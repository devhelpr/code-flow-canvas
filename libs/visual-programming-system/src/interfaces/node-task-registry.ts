import { IThumb, IRectNodeComponent, INodeComponent, FlowChangeType } from '.';
import { IFlowCanvasBase } from '../canvas-app/flow-canvas';
import { BaseNodeInfo } from '../types/base-node-info';
import { InitialValues } from '../types/values';
import { Composition } from './composition';
import { Theme } from './theme';
import { FlowNode } from './flow';

export type NodeTaskFactory<T extends BaseNodeInfo> = (
  onUpdatedCanvas: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void,
  theme?: Theme,
  node?: FlowNode<T>
) => NodeTask<T>;
export type GetNodeTaskFactory<T extends BaseNodeInfo> = (
  name: string
) => NodeTaskFactory<T>;

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

export type NodeTypeRegistry<T extends BaseNodeInfo> = Record<
  string,
  NodeTaskFactory<T>
>;
export type RegisterComposition<T extends BaseNodeInfo> = (
  composition: Composition<T>
) => void;
