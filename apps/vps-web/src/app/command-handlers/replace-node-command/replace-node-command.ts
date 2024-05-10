import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
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
  }
  rootElement: HTMLElement;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;

  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(parameter1?: any, parameter2?: any): void {
    console.log('ReplaceNode', parameter1, parameter2);
    //
  }
}
