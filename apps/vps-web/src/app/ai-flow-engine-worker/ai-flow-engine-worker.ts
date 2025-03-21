/// <reference lib="webworker" />

import { IComputeResult } from '@devhelpr/visual-programming-system';
import { FlowEngine } from '../flow-engine/flow-engine';
import {
  AIWorkerMessage,
  AIWorkerWorkerSelf,
} from './ai-flow-engine-worker-message';
import { run } from '@devhelpr/web-flow-executor';

declare let self: AIWorkerWorkerSelf;
console.log('WORKER RuntimeFlowContext', run);
// Message event handler
self.addEventListener('message', (event: MessageEvent<AIWorkerMessage>) => {
  try {
    const { data } = event;

    const flowEngine = new FlowEngine();
    flowEngine.onSendUpdateToNode = (data, node) => {
      console.log('onSendUpdateToNode', data, node);
      self.postMessage({
        message: 'node-update',
        result: {
          result: node.id,
          output: data,
        } as IComputeResult,
      });
    };
    flowEngine.initialize(data.flow.flows['flow'].nodes);
    flowEngine
      .run()
      .then((output) => {
        // Send the result back to the main thread
        self.postMessage({
          message: 'computation-result',
          result: {
            result: 'success',
            output: output,
            followPath: undefined,
          },
        });
      })
      .catch((error) => {
        self.postMessage({
          message: 'error',
          result: {
            result: error?.toString?.() ?? 'Error in flow engine worker',
            output: undefined,
            followPath: undefined,
          },
        });
      });
  } catch (error) {
    self.postMessage({
      message: 'error',
      result: {
        result: error?.toString?.() ?? 'Error in flow engine worker',
        output: undefined,
        followPath: undefined,
      },
    });
  }
});

// Error handling
self.addEventListener('error', (error) => {
  console.log('Worker error:', error.message);
  self.postMessage({
    message: 'error',
    result: {
      result: error.message,
      output: undefined,
      followPath: undefined,
    },
  });
});

export {};
