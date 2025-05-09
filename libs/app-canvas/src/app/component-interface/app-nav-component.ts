import {
  IFlowCanvasBase,
  IElementNode,
  FlowNode,
  IRectNodeComponent,
  Composition,
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
  BaseNodeInfo,
  NodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { StorageProvider } from '../storage/StorageProvider';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export interface AppNavComponentsProps<
  T extends BaseNodeInfo,
  TFlowEngine = unknown
> {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: StorageProvider<T>;
  initializeNodes: () => void;
  clearCanvas: () => void;
  animatePath: AnimatePathFunction<T>;
  animatePathFromThumb: AnimatePathFromThumbFunction<T>;
  canvasUpdated: () => void;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  removeElement: (element: IElementNode<NodeInfo>) => void;
  setIsStoring: (isStoring: boolean) => void;
  importToCanvas: (
    nodesList: FlowNode<NodeInfo>[],
    canvasApp: IFlowCanvasBase<NodeInfo>,
    canvasUpdated: () => void,
    containerNode?: IRectNodeComponent<NodeInfo>,
    nestedLevel?: number,
    getNodeTaskFactory?: (name: string) => any,
    compositions?: Record<string, Composition<T>>,
    flowEngine?: TFlowEngine
  ) => void;
  showPopup: (node: IRectNodeComponent<NodeInfo>) => void;
  executeCommand: (
    commandName: string,
    parameter1?: any,
    parameter2?: any
  ) => void;
  isReadOnly?: boolean;
  hideFlowPresets?: boolean;
  getNodeFactory: (name: string) => NodeTaskFactory<T, TFlowEngine>;
  flowEngine?: TFlowEngine;
}

export interface GenericAppNavComponentsProps<
  T extends BaseNodeInfo,
  TFlowEngine = unknown
> {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: StorageProvider<T>;
  initializeNodes: () => void;
  clearCanvas: () => void;
  canvasUpdated: () => void;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  removeElement: (element: IElementNode<T>) => void;
  setIsStoring: (isStoring: boolean) => void;
  importToCanvas: (
    nodesList: FlowNode<T>[],
    canvasApp: IFlowCanvasBase<T>,
    canvasUpdated: () => void,
    containerNode?: IRectNodeComponent<T>,
    nestedLevel?: number,
    getNodeTaskFactory?: (name: string) => any,
    compositions?: Record<string, Composition<T>>,
    flowEngine?: TFlowEngine
  ) => void;
  executeCommand: (
    commandName: string,
    parameter1?: any,
    parameter2?: any
  ) => void;
}
