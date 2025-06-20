import {
  IConnectionNodeComponent,
  IRunCounter,
  NodeCompute,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

// depending if "ai-canvas" is used.. the below is called from a worker or main thread

export class PlotCompute extends NodeCompute<NodeInfo> {
  initializeCompute() {
    // Initialization logic if needed
  }
  async compute(
    data: unknown,
    _loopIndex?: number,
    _payload?: unknown,
    _portName?: string,
    _scopeId?: string,
    _runCounter?: IRunCounter,
    connection?: IConnectionNodeComponent<NodeInfo>
  ) {
    const plotData = data as { type: string; data: unknown };
    if (plotData.type !== 'plot' && plotData.type !== 'line') {
      return Promise.resolve({
        output: undefined,
        result: undefined,
      });
    }

    console.log('plotCompute', plotData);

    const dataToPlot = {
      type: plotData.type,
      data: plotData.data,
      id: connection?.id ?? '',
    };
    return Promise.resolve({
      output: dataToPlot,
      result: dataToPlot,
    });
  }
}
