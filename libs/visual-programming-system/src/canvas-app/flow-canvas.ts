import { BaseNodeInfo } from '../types/base-node-info';
import { IBaseFlow } from './base-flow';
import { IFlowCore } from './flow-core';

//export type _FlowCanvas<T> = ReturnType<typeof createFlowCanvas<T>>;

export interface IFlowCanvasBase<T extends BaseNodeInfo, TFlowEngine = unknown>
  extends IBaseFlow<T>,
    IFlowCore {}
