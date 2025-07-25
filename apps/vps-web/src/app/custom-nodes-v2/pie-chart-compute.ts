import {
  IComputeResult,
  IConnectionNodeComponent,
  IRunCounter,
  NodeCompute,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

// depending if "ai-canvas" is used.. the below is called from a worker or main thread

export class PieChartCompute extends NodeCompute<NodeInfo> {
  initializeCompute(): void {
    // Initialization logic if needed
  }
  async compute(
    data: unknown,
    _loopIndex?: number,
    _payload?: unknown,
    _portName?: string,
    _scopeId?: string,
    _runCounter?: IRunCounter,
    _connection?: IConnectionNodeComponent<NodeInfo>
  ): Promise<IComputeResult> {
    //const random = (Math.random() * 100).toFixed(2);
    return Promise.resolve({
      output: data,
      result: data,
    });
  }
}
