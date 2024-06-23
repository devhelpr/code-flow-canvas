import {
  CanvasAppInstance,
  IElementNode,
  ICommandHandler,
  NodeTaskFactory,
} from '@devhelpr/visual-programming-system';

export interface ICommandContext<T> {
  rootElement: HTMLElement;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  canvasUpdated: () => void;
  removeElement: (element: IElementNode<T>) => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  commandRegistry: Map<string, ICommandHandler>;
}
