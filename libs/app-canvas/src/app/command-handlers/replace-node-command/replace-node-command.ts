import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  ThumbConnectionType,
  BaseNodeInfo,
  NodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
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
  execute(parameter1?: any, parameter2?: any): void {
    // parameter1 : new node-type
    // parameter2 : old node
    /*
      TODO:
      
        - add label
        - "isInReplaceeMode" flag in toolbar (reset in oa hideUL en input.oninput)
        - "isNotInterchangable" flag in NodeInfo
      
    */
    console.log('ReplaceNode', parameter1, parameter2);

    const oldNode = parameter2 as unknown as IRectNodeComponent<T>;

    const canvasApp =
      (oldNode.containerNode?.nodeInfo as any)?.canvasAppInstance ??
      this.getCanvasApp();

    //const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }

    if (oldNode.nodeType === NodeType.Connection) {
      this.insertNodeInConnection(
        parameter1,
        oldNode as unknown as IConnectionNodeComponent<T>
      );
      return;
    }
    if (oldNode.nodeType !== NodeType.Shape) {
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

  insertNodeInConnection = (
    nodeType: string,
    connection: IConnectionNodeComponent<T>
  ) => {
    const canvasApp =
      (connection.containerNode?.nodeInfo as any)?.canvasAppInstance ??
      this.getCanvasApp();

    if (!canvasApp) {
      return;
    }

    const containerNode = connection.containerNode as IRectNodeComponent<T>;

    const factory = this.getNodeTaskFactory(nodeType);
    let shiftNodes = false;
    if (factory) {
      const nodeTask = factory(this.canvasUpdated, canvasApp.theme);

      const node = nodeTask.createVisualNode(
        canvasApp,
        connection.endNode?.x ?? connection.x,
        connection.endNode?.y ?? connection.y,
        undefined,
        undefined,
        containerNode
      );
      if (node && node.nodeInfo) {
        (node.nodeInfo as any).taskType = nodeType;

        const endNode = connection.endNode;
        const endNodeThumb = connection.endNodeThumb;

        /*
          start -> end
          start -> newNode -newconnection-> end          
        */
        if (connection?.endNode?.connections) {
          connection.endNode.connections =
            connection.endNode?.connections?.filter(
              (c) => c.id !== connection.id
            );
        }
        node.connections.push(connection);
        if (endNode) {
          shiftNodes = true;
          const newConnection = canvasApp.createCubicBezier(
            connection.x,
            connection.y,
            connection.x,
            connection.y,
            connection.x,
            connection.y,
            connection.x,
            connection.y,
            false,
            undefined,
            undefined,
            containerNode
          );
          if (newConnection && newConnection.nodeComponent) {
            newConnection.nodeComponent.isControlled = true;
            newConnection.nodeComponent.nodeInfo = {} as T;
            newConnection.nodeComponent.layer = 1;

            node.connections?.push(newConnection.nodeComponent);
            if (endNode) {
              endNode?.connections?.push(newConnection.nodeComponent);
            }
            newConnection.nodeComponent.startNode = node;
            newConnection.nodeComponent.endNode = endNode;
            newConnection.nodeComponent.startNodeThumb =
              node.thumbConnectors?.find((t) => {
                return (
                  t.thumbConnectionType === ThumbConnectionType.start &&
                  t.thumbConstraint ===
                    connection.startNodeThumb?.thumbConstraint
                );
              });
            newConnection.nodeComponent.endNodeThumb = endNodeThumb;

            if (newConnection.nodeComponent.update) {
              newConnection.nodeComponent.update();
            }
          }
        }

        connection.endNode = node;
        if (endNode) {
          connection.endNodeThumb = node.thumbConnectors?.find((t) => {
            return (
              t.thumbConnectionType === ThumbConnectionType.end &&
              t.thumbConstraint === endNodeThumb?.thumbConstraint //&&
            );
          });
        } else {
          connection.endNodeThumb = node.thumbConnectors?.find((t) => {
            return (
              t.thumbConnectionType === ThumbConnectionType.end &&
              t.thumbConstraint === connection?.startNodeThumb?.thumbConstraint //&&
            );
          });
        }

        const newX = shiftNodes ? node.x : connection.endX;
        if (node.update) {
          node.update(node, newX, node.y, node);
        }

        if (endNode?.update) {
          endNode.update(endNode, endNode.x, endNode.y, endNode);
        }
        if (shiftNodes) {
          const updateList: INodeComponent<T>[] = [];
          this.nodes = [];
          this.getUpstreamNodes(node);
          console.log('getUpstreamNodes', this.nodes);
          const shiftX = (endNode?.x ?? 0) - (connection.startNode?.x ?? 0);
          this.nodes.forEach((e) => {
            const elementNode = e as INodeComponent<T>;
            if (elementNode.nodeType === NodeType.Shape) {
              const shape = elementNode as IRectNodeComponent<T>;
              if (shape.id !== node.id) {
                if (shape.x >= node.x) {
                  shape.x += shiftX;
                  updateList.push(shape);
                }
              }
            }
          });
          updateList.forEach((e) => {
            e.update?.(e, e.x, e.y, e);
          });
        }
        this.canvasUpdated();
      }
    }
  };

  nodes: IRectNodeComponent<T>[] = [];
  getUpstreamNodes = (node: IRectNodeComponent<T>) => {
    if (node.connections.length > 0) {
      node.connections.forEach((connection) => {
        if (connection.startNode?.id === node.id) {
          if (
            connection.endNode &&
            !this.nodes.find((node) => node.id === connection.endNode?.id)
          ) {
            this.nodes.push(connection.endNode);
            this.getUpstreamNodes(connection.endNode);
          }
        }
      });
    }
  };
}
