import {
  IRectNodeComponent,
  IConnectionNodeComponent,
  IComputeResult,
  IRunCounter,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from './node-info';

export type BaseComputeAsync<T extends BaseNodeInfo> = (
  node: IRectNodeComponent<T>,
  input: string | any[],
  loopIndex?: number,
  payload?: any,
  thumbName?: string,
  scopeId?: string,
  runCounter?: IRunCounter,
  connection?: IConnectionNodeComponent<T>
) => Promise<IComputeResult>;

export type ComputeAsync = BaseComputeAsync<NodeInfo>;
