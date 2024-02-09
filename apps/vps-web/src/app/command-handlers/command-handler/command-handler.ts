import {
  CanvasAppInstance,
  ICommandHandler,
  IElementNode,
} from '@devhelpr/visual-programming-system';
import { NodeTaskFactory } from '../../node-task-registry';
import { BaseNodeInfo } from '../../types/base-node-info';

export class CommandHandler<T extends BaseNodeInfo> {
  constructor(
    _rootElement: HTMLElement,
    _canvasApp: CanvasAppInstance<T>,
    _canvasUpdated: () => void,
    _removeElement: (element: IElementNode<T>) => void,
    _getNodeTaskFactory: (name: string) => NodeTaskFactory<T>,
    _setupTasksInDropdown: (
      selectNodeTypeHTMLElement: HTMLSelectElement
    ) => void,
    _commandRegistry: Map<string, ICommandHandler>
  ) {
    //
  }

  execute(_parameter1: any, _parameter2?: any): void {
    //
  }
}
