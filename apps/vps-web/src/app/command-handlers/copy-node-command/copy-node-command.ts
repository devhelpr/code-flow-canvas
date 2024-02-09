import {
  CanvasAppInstance,
  ICommandHandler,
  IElementNode,
  IRectNodeComponent,
  NodeType,
} from '@devhelpr/visual-programming-system';
import { NodeTaskFactory } from '../../node-task-registry';
import { CommandHandler } from '../command-handler/command-handler';
import { BaseNodeInfo } from '../../types/base-node-info';

export class CopyNodeCommand<T extends BaseNodeInfo> extends CommandHandler<T> {
  constructor(
    rootElement: HTMLElement,
    canvasApp: CanvasAppInstance<T>,
    canvasUpdated: () => void,
    removeElement: (element: IElementNode<T>) => void,
    getNodeTaskFactory: (name: string) => NodeTaskFactory<T>,
    setupTasksInDropdown: (
      selectNodeTypeHTMLElement: HTMLSelectElement
    ) => void,
    commandRegistry: Map<string, ICommandHandler>
  ) {
    super(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory,
      setupTasksInDropdown,
      commandRegistry
    );
    this.getNodeTaskFactory = getNodeTaskFactory;
    this.canvasApp = canvasApp;
    this.canvasUpdated = canvasUpdated;
    this.rootElement = rootElement;
    this.setupTasksInDropdown = setupTasksInDropdown;
    this.node = undefined;
  }
  rootElement: HTMLElement;
  canvasApp: CanvasAppInstance<T>;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(_parameter1?: any, parameter2?: any): void {
    if (typeof parameter2 !== 'string') {
      return;
    }
    const node = this.canvasApp?.elements.get(
      parameter2
    ) as IRectNodeComponent<T>;
    if (!node) {
      console.log('node not found in canvas');
      return;
    }
    if (node.nodeType === NodeType.Shape) {
      this.node = node;
    } else {
      this.node = undefined;
    }
  }

  node: IRectNodeComponent<T> | undefined;

  resetNode() {
    this.node = undefined;
  }
}
