import {
  FlowCanvasInstance,
  IElementNode,
  FlowNode,
  IRectNodeComponent,
  Composition,
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';
import { StorageProvider } from '../storage/StorageProvider';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export interface AppNavComponentsProps<T extends BaseNodeInfo> {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: StorageProvider<T>;
  initializeNodes: () => void;
  clearCanvas: () => void;
  animatePath: AnimatePathFunction<T>;
  animatePathFromThumb: AnimatePathFromThumbFunction<T>;
  canvasUpdated: () => void;
  getCanvasApp: () => FlowCanvasInstance<T> | undefined;
  removeElement: (element: IElementNode<NodeInfo>) => void;
  setIsStoring: (isStoring: boolean) => void;
  importToCanvas: (
    nodesList: FlowNode<NodeInfo>[],
    canvasApp: FlowCanvasInstance<NodeInfo>,
    canvasUpdated: () => void,
    containerNode?: IRectNodeComponent<NodeInfo>,
    nestedLevel?: number,
    getNodeTaskFactory?: (name: string) => any,
    compositions?: Record<string, Composition<T>>
  ) => void;
  showPopup: (node: IRectNodeComponent<NodeInfo>) => void;
  executeCommand: (
    commandName: string,
    parameter1?: any,
    parameter2?: any
  ) => void;
  isReadOnly?: boolean;
}

export interface GenericAppNavComponentsProps<T extends BaseNodeInfo> {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: StorageProvider<T>;
  initializeNodes: () => void;
  clearCanvas: () => void;
  canvasUpdated: () => void;
  getCanvasApp: () => FlowCanvasInstance<T> | undefined;
  removeElement: (element: IElementNode<T>) => void;
  setIsStoring: (isStoring: boolean) => void;
  importToCanvas: (
    nodesList: FlowNode<T>[],
    canvasApp: FlowCanvasInstance<T>,
    canvasUpdated: () => void,
    containerNode?: IRectNodeComponent<T>,
    nestedLevel?: number,
    getNodeTaskFactory?: (name: string) => any,
    compositions?: Record<string, Composition<T>>
  ) => void;
  executeCommand: (
    commandName: string,
    parameter1?: any,
    parameter2?: any
  ) => void;
}
