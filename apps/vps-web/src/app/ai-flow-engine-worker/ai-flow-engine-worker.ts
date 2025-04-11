/// <reference lib="webworker" />

import {
  IComputeResult,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { RuntimeFlowEngine } from '../flow-engine/flow-engine';
import {
  AIWorkerMessage,
  AIWorkerWorkerSelf,
  OffscreenCanvasNodes,
} from './ai-flow-engine-worker-message';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { registerWorkerNodes } from '../custom-nodes/register-worker-nodes';

declare let self: AIWorkerWorkerSelf;
let flowEngine: RuntimeFlowEngine;
let offscreenCanvases: OffscreenCanvasNodes = [];

// function getGradientColor(percent: number, canvas: OffscreenCanvas) {
//   const ctx = canvas.getContext('2d');
//   if (!ctx) {
//     return;
//   }
//   const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
//   gradient.addColorStop(0, 'red');
//   gradient.addColorStop(1, 'blue');
//   ctx.fillStyle = gradient;
//   ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
// }

// Message event handler
self.addEventListener('message', (event: MessageEvent<AIWorkerMessage>) => {
  try {
    const { data } = event;
    if (data.message === 'start-node') {
      //console.log('start-node', data);
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
            data.inputPayload,
            undefined,
            undefined,
            (output, node) => {
              if (node.nodeInfo?.shouldNotSendOutputFromWorkerToMainThread) {
                return;
              }
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
      offscreenCanvases = [];
      if (!data.flow) {
        throw new Error('Flow not provided');
      }
      if (data.offscreenCanvases) {
        offscreenCanvases = data.offscreenCanvases;
        // offscreenCanvases.forEach((canvasNode) => {
        //   getGradientColor(40, canvasNode.offscreenCanvas);
        // });
      }
      flowEngine = new RuntimeFlowEngine();
      flowEngine.onSendUpdateToNode = (data, node) => {
        //console.log('onSendUpdateToNode', data, node);
        if (node.nodeInfo?.shouldNotSendOutputFromWorkerToMainThread) {
          return;
        }
        self.postMessage({
          message: 'node-update',
          result: {
            result: node.id,
            output: data,
          } as IComputeResult,
        });
      };
      flowEngine.initialize(data.flow.flows['flow'].nodes, registerWorkerNodes);
      flowEngine.canvasApp.elements.forEach((node) => {
        if (node && node.nodeInfo) {
          node.nodeInfo.offscreenCanvas = undefined;
          const offscreenCanvas = offscreenCanvases.find(
            (canvasNode) => canvasNode.id === node.id
          );
          if (offscreenCanvas) {
            node.nodeInfo.offscreenCanvas = offscreenCanvas.offscreenCanvas;
          }
        }
      });
      Object.entries(data.llmApiKeys).forEach((keyValue) => {
        flowEngine.canvasApp.setTempData(keyValue[0], keyValue[1]);
      });
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
