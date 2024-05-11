import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IElementNode,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { NodeTaskFactory } from '../../node-task-registry';
import { BaseNodeInfo } from '../../types/base-node-info';
import { ICommandContext } from '../command-context';

export class ReplaceNodeCommand<
  T extends BaseNodeInfo
> extends CommandHandler<T> {
  constructor(commandContext: ICommandContext<T>) {
    super(commandContext);
    this.getNodeTaskFactory = commandContext.getNodeTaskFactory;
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.setupTasksInDropdown = commandContext.setupTasksInDropdown;
    this.removeElement = commandContext.removeElement;
  }
  rootElement: HTMLElement;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  removeElement: (element: IElementNode<T>) => void;
  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(parameter1?: any, parameter2?: any): void {
    // parameter1 : new node-type
    // parameter2 : old node
    console.log('ReplaceNode', parameter1, parameter2);
    // create new node
    // update new node's x/y parameters with the old node's x/y parameters
    // same for width/height?
    // connection connections to new node and disconnect from old node
    // remove old node
    // update canvas
    const oldNode = parameter2 as unknown as IRectNodeComponent<T>;

    const canvasApp =
      (oldNode.containerNode?.nodeInfo as any)?.canvasAppInstance ??
      this.getCanvasApp();

    //const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }

    const containerNode = oldNode.containerNode as IRectNodeComponent<T>;

    const factory = this.getNodeTaskFactory(parameter1);

    if (factory) {
      const nodeTask = factory(this.canvasUpdated, canvasApp.theme);

      const node = nodeTask.createVisualNode(
        canvasApp,
        oldNode.x,
        oldNode.y,
        undefined,
        oldNode.nodeInfo?.formValues,
        containerNode
      );
      if (node && node.nodeInfo) {
        // TODO : IMPROVE THIS

        (node.nodeInfo as any).taskType = parameter1;
        node.nodeInfo.formValues = oldNode.nodeInfo?.formValues;

        if (oldNode.connections) {
          oldNode.connections.forEach((c) => {
            const connection = canvasApp.elements?.get(
              c.id
            ) as IConnectionNodeComponent<T>;
            if (connection) {
              if (connection.startNode?.id === oldNode.id) {
                connection.startNode = node;

                // todo search for thumb in new node and reassign
                connection.startNodeThumb = node.thumbConnectors?.find((t) => {
                  return (
                    t.thumbConnectionType ===
                      connection.startNodeThumb?.thumbConnectionType &&
                    t.thumbIndex === connection.startNodeThumb?.thumbIndex &&
                    t.thumbType === connection.startNodeThumb?.thumbType &&
                    t.thumbConstraint ===
                      connection.startNodeThumb?.thumbConstraint &&
                    t.maxConnections ===
                      connection.startNodeThumb?.maxConnections
                    //t.thumbName === connection.startNodeThumb?.thumbName
                  );
                });

                node.connections.push(connection);
                if (connection) {
                  connection.update?.(
                    connection,
                    connection.x,
                    connection.y,
                    connection
                  );
                }
              }
              if (connection.endNode?.id === oldNode.id) {
                connection.endNode = node;

                // todo search for thumb in new node and reassign
                connection.endNodeThumb = node.thumbConnectors?.find((t) => {
                  return (
                    t.thumbConnectionType ===
                      connection.endNodeThumb?.thumbConnectionType &&
                    t.thumbIndex === connection.endNodeThumb?.thumbIndex &&
                    t.thumbType === connection.endNodeThumb?.thumbType &&
                    t.thumbConstraint ===
                      connection.endNodeThumb?.thumbConstraint &&
                    t.maxConnections === connection.endNodeThumb?.maxConnections
                    //t.thumbName === connection.endNodeThumb?.thumbName
                  );
                });

                node.connections.push(connection);
                if (connection) {
                  connection.update?.(
                    connection,
                    connection.x,
                    connection.y,
                    connection
                  );
                }
              }
            }
          });
          oldNode.connections = [];
        }

        this.removeElement(oldNode);
        canvasApp.deleteElement(oldNode.id);

        if (node.update) {
          node.update(node, oldNode.x, oldNode.y, node);
        }

        this.canvasUpdated();
      }
    }
  }
}
