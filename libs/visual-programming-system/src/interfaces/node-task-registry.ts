import { IFlowCanvasBase } from '../canvas-app/flow-canvas';
import { BaseNodeInfo } from '../types/base-node-info';
import { InitialValues } from '../types/values';
import { Composition } from './composition';
import { Theme } from './theme';
import { FlowNode } from './flow';
import { IComputeResult } from '../utils/create-rect-node';
import {
  IConnectionNodeComponent,
  IRectNodeComponent,
  INodeComponent,
  IThumb,
} from './element';
import { FlowChangeType } from './flow';
import { IRunCounter } from './run-counter';

export type NodeTaskFactory<T extends BaseNodeInfo, TFlowEngine = unknown> = (
  onUpdatedCanvas: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void,
  theme?: Theme,
  node?: FlowNode<T>,
  flowEngine?: TFlowEngine
) => NodeTask<T>;
export type GetNodeTaskFactory<
  T extends BaseNodeInfo,
  TFlowEngine = unknown
> = (name: string) => NodeTaskFactory<T, TFlowEngine>;

export type NodeTask<T extends BaseNodeInfo> = {
  name: string;
  family: string;
  category?: string;
  isContainer?: boolean;
  isContained?: boolean;
  canBeUsedAsDecorator?: boolean;
  nodeCannotBeReplaced?: boolean;
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
  setCanvasApp?: (canvasApp: IFlowCanvasBase<T>) => void;
  createVisualNode: (
    canvasApp: IFlowCanvasBase<T>,
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
    canvasApp: IFlowCanvasBase<T>,
    initalValues?: InitialValues
  ) => INodeComponent<T>;
  setTitle?: (newTitle: string) => void;
};

export type NodeTypeRegistry<T extends BaseNodeInfo, TFlowEngine> = Record<
  string,
  NodeTaskFactory<T, TFlowEngine>
>;
export type RegisterComposition<T extends BaseNodeInfo> = (
  composition: Composition<T>
) => void;

export class NodeVisual<T extends BaseNodeInfo> {
  constructor() {
    // Constructor logic
  }
  updateVisual(_data: unknown, _parentNode: HTMLElement, _nodeInfo: T) {
    //
  }
  destroy() {
    // Cleanup logic
  }
}
export interface NodeDefinition {
  nodeTypeName: string;
  category?: string;
  description: string;
}

export interface NodeCompute<T extends BaseNodeInfo> {
  initializeCompute: () => void;
  compute: (
    input: unknown,
    loopIndex?: number,
    payload?: unknown,
    portName?: string,
    scopeId?: string,
    runCounter?: IRunCounter,
    connection?: IConnectionNodeComponent<T>
  ) => Promise<IComputeResult>;
}
