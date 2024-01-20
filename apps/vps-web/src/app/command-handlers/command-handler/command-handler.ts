import {
  CanvasAppInstance,
  IElementNode,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

export class CommandHandler {
  constructor(
    _rootElement: HTMLElement,
    _canvasApp: CanvasAppInstance<NodeInfo>,
    _canvasUpdated: () => void,
    _removeElement: (element: IElementNode<NodeInfo>) => void
  ) {
    //
  }

  execute(_parameter1: any, _parameter2?: any): void {
    //
  }
}
