import {
  FlowCanvasInstance,
  IElementNode,
  ICommandHandler,
  NodeTaskFactory,
  FlowChangeType,
} from '@devhelpr/visual-programming-system';

export interface ICommandContext<T> {
  rootElement: HTMLElement;
  getCanvasApp: () => FlowCanvasInstance<T> | undefined;
  canvasUpdated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void;
  removeElement: (element: IElementNode<T>) => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  commandRegistry: Map<string, ICommandHandler>;
}
