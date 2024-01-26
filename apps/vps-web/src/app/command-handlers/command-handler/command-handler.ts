import {
  CanvasAppInstance,
  IElementNode,
} from '@devhelpr/visual-programming-system';
import { NodeTaskFactory } from '../../node-task-registry';

export class CommandHandler<T> {
  constructor(
    _rootElement: HTMLElement,
    _canvasApp: CanvasAppInstance<T>,
    _canvasUpdated: () => void,
    _removeElement: (element: IElementNode<T>) => void,
    _getNodeTaskFactory: (name: string) => NodeTaskFactory<T>
  ) {
    //
  }

  execute(_parameter1: any, _parameter2?: any): void {
    //
  }
}
