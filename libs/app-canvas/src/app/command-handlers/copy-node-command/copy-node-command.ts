import {
  BaseNodeInfo,
  IFlowCanvasBase,
  IRectNodeComponent,
  NodeTaskFactory,
  NodeType,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { ICommandContext } from '../command-context';

export class CopyNodeCommand<
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
    this.node = undefined;
  }
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T, TFlowEngine>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(_parameter1?: any, parameter2?: any): void {
    const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    if (typeof parameter2 !== 'string') {
      return;
    }
    const node = canvasApp.elements.get(parameter2) as IRectNodeComponent<T>;
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
