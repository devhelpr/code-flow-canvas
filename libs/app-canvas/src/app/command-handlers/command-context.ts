import {
  IFlowCanvasBase,
  IElementNode,
  ICommandHandler,
  NodeTaskFactory,
  FlowChangeType,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

export interface ICommandContext<
  T extends BaseNodeInfo,
  TFlowEngine = unknown
> {
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  flowEngine?: TFlowEngine;
  canvasUpdated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void;
  removeElement: (element: IElementNode<T>) => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T, TFlowEngine>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  commandRegistry: Map<string, ICommandHandler>;
  onBeforeExecuteCommand?: (
    commandName: string,
    parameter1: any,
    parameter2: any
  ) => boolean;
}
