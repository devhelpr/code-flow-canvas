import { NodeCompute } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

// depending if "ai-canvas" is used.. the below is called from a worker or main thread

export const pieChartCompute: NodeCompute<NodeInfo> = {
  initializeCompute: () => {
    // Initialization logic if needed
  },
  compute: async (data: unknown) => {
    //const random = (Math.random() * 100).toFixed(2);
    return Promise.resolve({
      output: data,
      result: data,
    });
  },
};
