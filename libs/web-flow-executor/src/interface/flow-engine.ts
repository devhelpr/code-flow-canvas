import {
  ElementNodeMap,
  IFlowCanvasBase,
  IRectNodeComponent,
  IConnectionNodeComponent,
  IThumbNodeComponent,
  Flow,
} from '@devhelpr/visual-programming-system';
import { RunCounter } from '../follow-path/run-counter';
import { ComputeAsync } from '../types/compute-async';
import { NodeInfo } from '../types/node-info';

export interface FlowEngine {
  run?: (
    flow: Flow<NodeInfo> | undefined,
    nodes: ElementNodeMap<NodeInfo>,
    canvasApp: IFlowCanvasBase<NodeInfo>,
    onFinishRun?: (input: string | any[]) => void,
    input?: string,
    offsetX?: number,
    offsetY?: number,
    runCounter?: RunCounter,
    shouldResetConnectionSlider?: boolean,
    computeAsync?: ComputeAsync,
    sendOutputToNode?: (data: any, node: IRectNodeComponent<NodeInfo>) => void
  ) => boolean;
  runNode?: (
    flow: Flow<NodeInfo> | undefined,
    node: IRectNodeComponent<NodeInfo>,
    canvasApp: IFlowCanvasBase<NodeInfo>,
    onStopped?: (input: string | any[], scopeId?: string) => void,
    input?: string,
    offsetX?: number,
    offsetY?: number,
    loopIndex?: number,
    connection?: IConnectionNodeComponent<NodeInfo>,
    scopeId?: string,
    runCounter?: RunCounter,
    shouldClearExecutionHistory?: boolean,
    inputPayload?: any,
    useThumbName?: string,
    computeAsync?: ComputeAsync,
    sendOutputToNode?: (data: any, node: IRectNodeComponent<NodeInfo>) => void
  ) => void;
  runNodeFromThumb?: (
    flow: Flow<NodeInfo> | undefined,
    nodeThumb: IThumbNodeComponent<NodeInfo>,
    canvasApp: IFlowCanvasBase<NodeInfo>,
    onStopped?: (input: string | any[], scopeId?: string) => void,
    input?: any,
    _scopeNode?: IRectNodeComponent<NodeInfo>,
    loopIndex?: number,
    scopeId?: string,
    runCounter?: RunCounter,
    showCursorOnly?: boolean,
    computeAsync?: ComputeAsync,
    sendOutputToNode?: (data: any, node: IRectNodeComponent<NodeInfo>) => void
  ) => void;
  computeAsync?: ComputeAsync;
  sendOutputToNode?: (data: any, node: IRectNodeComponent<NodeInfo>) => void;
}
