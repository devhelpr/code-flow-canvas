import {
  CanvasAppInstance,
  IElementNode,
  FlowNode,
  IRectNodeComponent,
  Composition,
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '@devhelpr/visual-programming-system';
import { FlowrunnerIndexedDbStorageProvider } from '../storage/indexeddb-storage-provider';
import { NodeInfo } from '../types/node-info';

export interface AppNavComponentsProps<T> {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: FlowrunnerIndexedDbStorageProvider;
  initializeNodes: () => void;
  clearCanvas: () => void;
  animatePath: AnimatePathFunction<T>;
  animatePathFromThumb: AnimatePathFromThumbFunction<T>;
  canvasUpdated: () => void;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  removeElement: (element: IElementNode<NodeInfo>) => void;
  setIsStoring: (isStoring: boolean) => void;
  importToCanvas: (
    nodesList: FlowNode<NodeInfo>[],
    canvasApp: CanvasAppInstance<NodeInfo>,
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
}

export interface GenericAppNavComponentsProps<T> {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: FlowrunnerIndexedDbStorageProvider;
  initializeNodes: () => void;
  clearCanvas: () => void;
  canvasUpdated: () => void;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  removeElement: (element: IElementNode<T>) => void;
  setIsStoring: (isStoring: boolean) => void;
  importToCanvas: (
    nodesList: FlowNode<T>[],
    canvasApp: CanvasAppInstance<T>,
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
