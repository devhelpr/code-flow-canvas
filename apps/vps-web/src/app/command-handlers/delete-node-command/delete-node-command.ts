import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IElementNode,
  IRectNodeComponent,
  NodeType,
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { NodeTaskFactory } from '../../node-task-registry';

export class DeleteNodeCommand<T> extends CommandHandler<T> {
  constructor(
    rootElement: HTMLElement,
    canvasApp: CanvasAppInstance<T>,
    canvasUpdated: () => void,
    removeElement: (element: IElementNode<T>) => void,
    getNodeTaskFactory: (name: string) => NodeTaskFactory<T>,
    setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void
  ) {
    super(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory,
      setupTasksInDropdown
    );
    this.canvasApp = canvasApp;
    this.canvasUpdated = canvasUpdated;
    this.rootElement = rootElement;
    this.removeElement = removeElement;
  }
  rootElement: HTMLElement;
  canvasApp: CanvasAppInstance<T>;
  canvasUpdated: () => void;
  removeElement: (element: IElementNode<T>) => void;
  // parameter1 is the id of a selected node
  execute(parameter1?: any, _parameter2?: any): void {
    console.log('AddNode flow-app');
    if (typeof parameter1 !== 'string') {
      return;
    }
    const node = this.canvasApp?.elements.get(
      parameter1
    ) as IRectNodeComponent<T>;
    if (!node) {
      console.log('node not found in canvas');
      return;
    }
    this.canvasApp?.resetNodeTransform();
    if (node.nodeType === NodeType.Shape) {
      //does the shape have connections? yes.. remove the link between the connection and the node
      // OR .. remove the connection as well !?
      const shapeNode = node as IRectNodeComponent<T>;
      if (shapeNode.connections) {
        shapeNode.connections.forEach((c) => {
          const connection = this.canvasApp?.elements?.get(
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
            this.canvasApp?.elements?.delete(connection.id);
          }
        });
      }
    } else {
      return;
    }

    this.removeElement(node);
    this.canvasApp?.elements?.delete(node.id);

    setSelectNode(undefined);
    this.canvasUpdated();
  }
}
