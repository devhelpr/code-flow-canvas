import { NodeCompute } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

// depending if "ai-canvas" is used.. the below is called from a worker or main thread

export const plotCompute: NodeCompute<NodeInfo> = {
  initializeCompute: () => {
    // Initialization logic if needed
  },
  compute: async (data: unknown, _1, _2, _3, _4, _5, connection) => {
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
  },
};
