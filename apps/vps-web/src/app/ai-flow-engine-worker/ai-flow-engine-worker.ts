/// <reference lib="webworker" />

import {
  IComputeResult,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { RuntimeFlowEngine } from '../flow-engine/flow-engine';
import {
  AIWorkerMessage,
  AIWorkerWorkerSelf,
} from './ai-flow-engine-worker-message';
import { NodeInfo, run } from '@devhelpr/web-flow-executor';
import { registerWorkerNodes } from '../custom-nodes/register-worker-nodes';

declare let self: AIWorkerWorkerSelf;
console.log('WORKER RuntimeFlowContext', run);
let flowEngine: RuntimeFlowEngine;
// Message event handler
self.addEventListener('message', (event: MessageEvent<AIWorkerMessage>) => {
  try {
    const { data } = event;
    if (data.message === 'start-node') {
      console.log('start-node', data);
      const nodeId = data.nodeId;
      if (flowEngine && nodeId) {
        const node = flowEngine.canvasApp.elements.get(nodeId);
        if (node) {
          flowEngine.runNode(
            node as IRectNodeComponent<NodeInfo>,
            () => {
              //
            },
            data.input,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            (output, node) => {
              self.postMessage({
                message: 'node-update',
                result: {
                  result: node.id,
                  output: output,
                } as IComputeResult,
              });
            }
          );
        }
      }
    } else if (data.message === 'start') {
      if (!data.flow) {
        throw new Error('Flow not provided');
      }
      flowEngine = new RuntimeFlowEngine();
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
      flowEngine.initialize(data.flow.flows['flow'].nodes, registerWorkerNodes);
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
    }
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
