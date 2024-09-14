import { createFlowCanvas } from '.';
import { IBaseFlow } from './base-flow';
import { IFlowCore } from './flow-core';

export type FlowCanvas<T> = ReturnType<typeof createFlowCanvas<T>>;

export interface IFlowCanvasBase<T> extends IBaseFlow<T>, IFlowCore {}
