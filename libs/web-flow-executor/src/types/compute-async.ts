import {
  IRectNodeComponent,
  IConnectionNodeComponent,
  IComputeResult,
} from '@devhelpr/visual-programming-system';
import { RunCounter } from '../follow-path/run-counter';
import { NodeInfo } from './node-info';

export type ComputeAsync = (
  node: IRectNodeComponent<NodeInfo>,
  input: string | any[],
  loopIndex?: number,
  payload?: any,
  thumbName?: string,
  scopeId?: string,
  runCounter?: RunCounter,
  connection?: IConnectionNodeComponent<NodeInfo>
) => Promise<IComputeResult>;
