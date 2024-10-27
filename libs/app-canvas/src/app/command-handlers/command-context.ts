import {
  IFlowCanvasBase,
  IElementNode,
  ICommandHandler,
  NodeTaskFactory,
  FlowChangeType,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

export interface ICommandContext<T extends BaseNodeInfo> {
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
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
