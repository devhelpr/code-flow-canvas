import {
  CanvasAppInstance,
  IElementNode,
  ICommandHandler,
} from '@devhelpr/visual-programming-system';
import { NodeTaskFactory } from '../node-task-registry';

export interface ICommandContext<T> {
  rootElement: HTMLElement;
  canvasApp: CanvasAppInstance<T>;
  canvasUpdated: () => void;
  removeElement: (element: IElementNode<T>) => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  commandRegistry: Map<string, ICommandHandler>;
}
