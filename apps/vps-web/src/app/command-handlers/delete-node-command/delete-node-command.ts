import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { BaseNodeInfo } from '../../types/base-node-info';
import { ICommandContext } from '../command-context';

export class DeleteNodeCommand<
  T extends BaseNodeInfo
> extends CommandHandler<T> {
  constructor(commandContext: ICommandContext<T>) {
    super(commandContext);
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.removeElement = commandContext.removeElement;
  }
  rootElement: HTMLElement;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  canvasUpdated: () => void;
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
      this.canvasUpdated();
      this.getCanvasApp()?.resetNodeSelector();
      return;
    }
    if (typeof parameter1 !== 'string') {
      return;
    }
    const node = canvasApp.elements.get(parameter1) as IRectNodeComponent<T>;
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
    } else {
      return;
    }

    this.removeElement(node);
    canvasApp.deleteElement(node.id);

    setSelectNode(undefined);
    this.canvasUpdated();
  }
}
