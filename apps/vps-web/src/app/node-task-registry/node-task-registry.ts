import {
  CanvasAppInstance,
  Composition,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  Theme,
} from '@devhelpr/visual-programming-system';
import { BaseNodeInfo } from '../types/base-node-info';

export type InitialValues = Record<string, any>;
export type NodeTaskFactory<T> = (
  onUpdatedCanvas: (shouldClearExecutionHistory?: boolean) => void,
  theme?: Theme
) => NodeTask<T>;
export type GetNodeTaskFactory<T> = (name: string) => NodeTaskFactory<T>;

export type NodeTask<T> = {
  name: string;
  family: string;
  category?: string;
  isContainer?: boolean;
  isContained?: boolean;
  canBeUsedAsDecorator?: boolean;
  childNodeTasks?: string[];
  notAllowedChildNodeTasks?: string[];
  thumbs?: IThumb[];
  hideFromNodeTypeSelector?: boolean;
  useInCompositionOnly?: boolean;
  getCompute?: () => (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    thumbIdentifierWithinNode?: string,
    isInComposition?: boolean
  ) => { result: string | undefined };
  setCanvasApp?: (canvasApp: CanvasAppInstance<T>) => void;
  createVisualNode: (
    canvasApp: CanvasAppInstance<T>,
    x: number,
    y: number,
    id?: string,
    initalValues?: InitialValues,
    containerNode?: IRectNodeComponent<T>,
    width?: number,
    height?: number,
    nestedLevel?: number,
    nodeInfo?: BaseNodeInfo,
    dummy2?: any
  ) => IRectNodeComponent<T>;
  getConnectionInfo?: () => {
    inputs: IRectNodeComponent<T>[];
    outputs: IRectNodeComponent<T>[];
  };
  createDecoratorNode?: (
    canvasApp: CanvasAppInstance<T>,
    initalValues?: InitialValues
  ) => INodeComponent<T>;
  setTitle?: (newTitle: string) => void;
};

export type NodeTypeRegistry<T> = Record<string, NodeTaskFactory<T>>;
export type RegisterComposition<T> = (composition: Composition<T>) => void;
