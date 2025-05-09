import {
  BaseNodeInfo,
  IFlowCanvasBase,
  ICommandHandler,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  NodeTaskFactory,
  ThumbType,
  calculateConnectorY,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { ICommandContext } from '../command-context';
import { getStartNodes } from '../../utils/start-nodes';

/*

  possible info to use for auto align/layout:

  - node-type priorities : 
      [..node-type which have priority to be evaluated first]
      ... all other node-types
      [..node-type which have priority to be evaluated last]

  - determine longest chain of nodes from start node to end node
     .. this should be the first chain to be evaluated and aligned (it should be "straight").
     .. then start at the end node and walk backwards and determine other connections
          connections that are connected to thumbs above the main thumb (from the longest chain) should be aligned above the main chain
          connections that are connected to thumbs below the main thumb (from the longest chain) should be aligned below the main chain

     .. subpaths should be on its own row .. used rows should be tracked


  - all nodes that have no input/output connections should be aligned to the bottom of all other nodes at the end
  
  - special nodes that can grow in size (like a list of items) should be aligned to the bottom of all other nodes at the end

  - can spatial partioning be used to determine occupied space?

  - use a column grid to determine free columns for nodes to be placed in?

*/

const nodeSpacing = 400;
const nodeSpacingHeight = 100;

export class AutoAlignCommand<
  T extends BaseNodeInfo,
  TFlowEngine
> extends CommandHandler<T, TFlowEngine> {
  constructor(commandContext: ICommandContext<T, TFlowEngine>) {
    super(commandContext);
    this.getNodeTaskFactory = commandContext.getNodeTaskFactory;
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.setupTasksInDropdown = commandContext.setupTasksInDropdown;
    this.commandRegistry = commandContext.commandRegistry;
  }
  commandRegistry: Map<string, ICommandHandler>;
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T, TFlowEngine>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;

  elementsList: INodeComponent<T>[] = [];
  isRevisiting = false;
  minX = -1;
  minY = -1;
  maxX = -1;
  maxY = -1;
  x: undefined | number = undefined;
  y: undefined | number = undefined;

  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(_parameter1?: any, _parameter2?: any): void {
    const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    this.elementsList = Array.from(canvasApp.elements).map(
      (e) => e[1] as INodeComponent<T>
    );
    this.minX = -1;
    this.minY = -1;
    this.maxX = -1;
    this.maxY = -1;
    this.x = undefined;
    this.y = undefined;

    const visitedNodes: string[] = [];
    const revisitNodes: IRectNodeComponent<T>[] = [];
    this.isRevisiting = false;
    const nodes = getStartNodes<T>(canvasApp.elements).toSorted((a, b) => {
      if (['uv-node', 'value-node'].indexOf(a.nodeInfo?.type ?? '') >= 0) {
        if (
          a.nodeInfo?.type === 'uv-node' &&
          b.nodeInfo?.type === 'value-node'
        ) {
          return -1;
        }
        if (
          b.nodeInfo?.type === 'uv-node' &&
          a.nodeInfo?.type === 'value-node'
        ) {
          return 1;
        }
        return -1;
      }
      return 1;
    });
    const columnX = this.x ?? nodes[0].x ?? 0;
    nodes.forEach((node) => {
      this.visitNode(node, visitedNodes, revisitNodes, 0, columnX);
    });
  }

  visitNode(
    node: IRectNodeComponent<T>,
    visitedNodes: string[],
    revisitNodes: IRectNodeComponent<T>[],
    level = 0,
    columnX = 0,
    columnY = 0
  ) {
    if (visitedNodes.indexOf(node.id) !== -1) {
      return;
    }
    if ((node.nodeInfo as any).isVariable && !this.isRevisiting) {
      revisitNodes.push(node);
      return;
    }
    visitedNodes.push(node.id);

    const startNodes = node.connections
      .filter((connection) => {
        return (
          connection.endNode?.id === node.id &&
          connection.startNode &&
          connection.startNodeThumb &&
          connection.endNodeThumb
        );
      })
      .map((connection) => {
        return {
          startNode: connection.startNode as IRectNodeComponent<T>,
          endNode: connection.endNode as IRectNodeComponent<T>,
          startNodeThumb: connection.startNodeThumb as IThumbNodeComponent<T>,
          endNodeThumb: connection.endNodeThumb as IThumbNodeComponent<T>,
          connection: connection as IConnectionNodeComponent<T>,
        };
      });
    if (startNodes.length === 0) {
      this.x = columnX;
      node.x = columnX;
      this.updateXY(node);

      node.y = this.y as number;
      this.y = (this.y as number) + (node.height ?? 0) + nodeSpacingHeight;

      if (node.update) {
        node.update(node, node.x, node.y, node);
      }
    } else {
      startNodes.forEach((connectionInfo, index) => {
        visitedNodes.push(connectionInfo.endNode.id);
        if (index === 0) {
          const connectiondStartThumbY = calculateConnectorY(
            connectionInfo.startNodeThumb.thumbType ?? ThumbType.None,
            connectionInfo.startNode.width ?? 0,
            connectionInfo.startNode.height ?? 0,
            connectionInfo.startNodeThumb.thumbIndex,
            connectionInfo.startNodeThumb
          );

          const connectiondEndThumbY = calculateConnectorY(
            connectionInfo.endNodeThumb.thumbType ?? ThumbType.None,
            connectionInfo.endNode.width ?? 0,
            connectionInfo.endNode.height ?? 0,
            connectionInfo.endNodeThumb.thumbIndex,
            connectionInfo.endNodeThumb
          );
          node.x = connectionInfo.startNode.x + nodeSpacing;
          node.y =
            connectionInfo.startNode.y +
            connectiondStartThumbY -
            connectiondEndThumbY;

          if (node.update) {
            node.update(node, node.x, node.y, node);
          }
          this.updateXY(node);
          this.x = (this.x as number) + (node.width ?? 0) + nodeSpacing;
        } else {
          node.y = columnY + nodeSpacingHeight;
          node.x = columnX + nodeSpacing * 2;
          if (node.update) {
            node.update(node, node.x, node.y, node);
          }
        }
      });
    }

    const nextNodes = node.connections
      .filter((connection) => {
        return (
          connection.startNode?.id === node.id &&
          connection.startNodeThumb &&
          connection.endNode?.id !== node.id &&
          connection.endNode &&
          connection.endNodeThumb
        );
      })
      .map((connection) => {
        return {
          startNode: connection.startNode as IRectNodeComponent<T>,
          endNode: connection.endNode as IRectNodeComponent<T>,
          startNodeThumb: connection.startNodeThumb as IThumbNodeComponent<T>,
          endNodeThumb: connection.endNodeThumb as IThumbNodeComponent<T>,
          connection: connection as IConnectionNodeComponent<T>,
        };
      });

    let y = this.y ?? node.y;
    nextNodes.forEach((connectionInfo, index) => {
      this.visitNode(
        connectionInfo.endNode,
        visitedNodes,
        revisitNodes,
        level + 1,
        node.x,
        y
      );
      y += index * (connectionInfo.endNode.height ?? 0) + nodeSpacingHeight;
    });
  }

  updateXY(node: IRectNodeComponent<T>) {
    if (this.minX === -1 || node.x < this.minX) {
      this.minX = node.x;
    }
    if (this.minY === -1 || node.y < this.minY) {
      this.minY = node.y;
    }
    if (this.maxX === -1 || node.x + (node.width ?? 0) > this.maxX) {
      this.maxX = node.x + (node.width ?? 0);
    }
    if (this.maxY === -1 || node.y + (node.height ?? 0) > this.maxY) {
      this.maxY = node.y + (node.height ?? 0);
    }
    if (this.x === undefined) {
      this.x = node.x;
    }
    if (this.y === undefined) {
      this.y = node.y;
    }
  }
}
