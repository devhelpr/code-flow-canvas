import {
  IFlowCanvasBase,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  getSelectedNode,
  setSelectNode,
  BaseNodeInfo,
  FlowChangeType,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { ICommandContext } from '../command-context';

export class DeleteNodeCommand<
  T extends BaseNodeInfo,
  TFlowEngine
> extends CommandHandler<T, TFlowEngine> {
  constructor(commandContext: ICommandContext<T, TFlowEngine>) {
    super(commandContext);
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.removeElement = commandContext.removeElement;
  }
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  canvasUpdated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void;
  removeElement: (element: IElementNode<T>) => void;
  // parameter1 is the id of a selected node
  execute(parameter1?: any, parameter2?: any): void {
    const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    console.log('DeleteNode flow-app');
    if (parameter1 === undefined && Array.isArray(parameter2)) {
      const selectedNodes = parameter2 as INodeComponent<T>[];
      selectedNodes.forEach((node) => {
        if (node.nodeType === NodeType.Connection) {
          // Remove the connection from the start and end nodes
          const connection = node as IConnectionNodeComponent<T>;
          if (connection.startNode) {
            connection.startNode.connections =
              connection.startNode?.connections?.filter(
                (c) => c.id !== connection.id
              );
          }
          if (connection.endNode) {
            connection.endNode.connections =
              connection.endNode?.connections?.filter(
                (c) => c.id !== connection.id
              );
          }
        } else if (node.nodeType === NodeType.Shape) {
          //does the shape have connections? yes.. remove the link between the connection and the node
          // AND .. remove the connection as well !?
          const shapeNode = node as IRectNodeComponent<T>;
          if (shapeNode.connections) {
            shapeNode.connections.forEach((c) => {
              const connection = this.getCanvasApp()?.elements?.get(
                c.id
              ) as IConnectionNodeComponent<T>;
              if (connection) {
                if (connection.startNode?.id === node.id) {
                  connection.startNode = undefined;
                  connection.startNodeThumb = undefined;
                }
                if (connection.endNode?.id === node.id) {
                  connection.endNode = undefined;
                  connection.endNodeThumb = undefined;
                }
                this.removeElement(connection);
                this.getCanvasApp()?.deleteElement(connection.id);
              }
            });
          }
        }
        this.removeElement(node);
        this.getCanvasApp()?.deleteElement(node.id);
      });
      this.canvasUpdated(undefined, undefined, FlowChangeType.DeleteNode);
      this.getCanvasApp()?.resetNodeSelector();
      return;
    }
    if (typeof parameter1 !== 'string') {
      return;
    }
    const nodeInfo = this.getSelectedNodeInfo();
    if (!nodeInfo) {
      return;
    }
    const node = nodeInfo?.node;
    if (!node) {
      console.log('node not found in canvas');
      return;
    }
    canvasApp.resetNodeTransform();
    if (node.nodeType === NodeType.Shape) {
      //does the shape have connections? yes.. remove the link between the connection and the node
      // OR .. remove the connection as well !?
      const shapeNode = node as IRectNodeComponent<T>;
      if (shapeNode.connections) {
        shapeNode.connections.forEach((c) => {
          const connection = canvasApp.elements?.get(
            c.id
          ) as IConnectionNodeComponent<T>;
          if (connection) {
            if (connection.startNode?.id === node.id) {
              connection.startNode = undefined;
              connection.startNodeThumb = undefined;

              if (connection.endNode) {
                connection.endNode.connections =
                  connection.endNode?.connections?.filter(
                    (c) => c.id !== connection.id
                  );
              }
            }
            if (connection.endNode?.id === node.id) {
              connection.endNode = undefined;
              connection.endNodeThumb = undefined;

              if (connection.startNode) {
                connection.startNode.connections =
                  connection.startNode?.connections?.filter(
                    (c) => c.id !== connection.id
                  );
              }
            }
            this.removeElement(connection);
            canvasApp.deleteElement(connection.id);
          }
        });
      }
    } else if (node.nodeType === NodeType.Connection) {
      // Remove the connection from the start and end nodes
      const connection = node as IConnectionNodeComponent<T>;
      if (connection.startNode) {
        connection.startNode.connections =
          connection.startNode?.connections?.filter(
            (c) => c.id !== connection.id
          );
      }
      if (connection.endNode) {
        connection.endNode.connections =
          connection.endNode?.connections?.filter(
            (c) => c.id !== connection.id
          );
      }
    }

    if (node.containerNode) {
      (
        (node.containerNode as unknown as IRectNodeComponent<T>)
          ?.nodeInfo as any
      )?.canvasAppInstance?.resetNodeTransform();
      (
        (node?.containerNode as unknown as IRectNodeComponent<T>)
          ?.nodeInfo as any
      )?.canvasAppInstance?.deleteElement(node.id);
      this.removeElement(node);
    } else {
      this.removeElement(node);
      this.getCanvasApp()?.deleteElement(node.id);
    }

    setSelectNode(undefined);
    this.canvasUpdated();
  }

  getSelectedNodeInfo = () => {
    const nodeElementId = getSelectedNode();
    if (nodeElementId) {
      const node = nodeElementId.containerNode
        ? ((
            (nodeElementId?.containerNode as unknown as IRectNodeComponent<T>)
              ?.nodeInfo as any
          )?.canvasAppInstance?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<T>)
        : (this.getCanvasApp()?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<T>);

      if (node) {
        return { selectedNodeInfo: nodeElementId, node };
      }
    }
    return false;
  };
}
