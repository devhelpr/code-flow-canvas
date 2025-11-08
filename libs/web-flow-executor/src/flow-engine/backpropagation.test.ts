import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuntimeFlowEngine } from './runtime-flow-engine';
import { FlowNode } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

describe('Backpropagation', () => {
  let flowEngine: RuntimeFlowEngine;

  beforeEach(() => {
    flowEngine = new RuntimeFlowEngine();
  });

  it('should call backpropagate on the source node when compute returns backpropagate data', async () => {
    const backpropagateData = { gradient: 0.5, value: 42 };
    const backpropagateFn = vi.fn();

    // Create a simple flow with two nodes: start -> compute
    const flow: FlowNode<NodeInfo>[] = [
      {
        id: 'start-node',
        x: 100,
        y: 100,
        nodeType: 'shape',
        taskType: 'start',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'start',
          compute: (input: any) => {
            return {
              result: 'start-value',
              output: 'start-value',
            };
          },
          backpropagate: backpropagateFn,
        },
      },
      {
        id: 'compute-node',
        x: 400,
        y: 100,
        nodeType: 'shape',
        taskType: 'compute',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'EndConnectorCenter',
            connectionType: 'end',
            name: 'input',
            thumbConstraint: 'value',
          },
          {
            thumbIndex: 1,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'compute',
          compute: (input: any) => {
            return {
              result: input + '-processed',
              output: input + '-processed',
              backpropagate: backpropagateData,
            };
          },
        },
      },
      {
        id: 'connection-1',
        x: 0,
        y: 0,
        nodeType: 'connection',
        startNodeId: 'start-node',
        endNodeId: 'compute-node',
        startThumbName: 'output',
        endThumbName: 'input',
      },
    ];

    flowEngine.initialize(flow);

    // Run the flow
    await flowEngine.run();

    // Verify backpropagate was called
    expect(backpropagateFn).toHaveBeenCalledTimes(1);
    expect(backpropagateFn).toHaveBeenCalledWith(
      backpropagateData,
      expect.objectContaining({
        id: 'compute-node',
      }),
      expect.objectContaining({
        id: 'connection-1',
      })
    );
  });

  it('should call backpropagate on the source node when computeAsync returns backpropagate data', async () => {
    const backpropagateData = { gradient: 0.8, value: 100 };
    const backpropagateFn = vi.fn();

    // Create a simple flow with two nodes: start -> computeAsync
    const flow: FlowNode<NodeInfo>[] = [
      {
        id: 'start-node',
        x: 100,
        y: 100,
        nodeType: 'shape',
        taskType: 'start',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'start',
          compute: (input: any) => {
            return {
              result: 'start-value',
              output: 'start-value',
            };
          },
          backpropagate: backpropagateFn,
        },
      },
      {
        id: 'async-node',
        x: 400,
        y: 100,
        nodeType: 'shape',
        taskType: 'async',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'EndConnectorCenter',
            connectionType: 'end',
            name: 'input',
            thumbConstraint: 'value',
          },
          {
            thumbIndex: 1,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'async',
          computeAsync: async (input: any) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return {
              result: input + '-async-processed',
              output: input + '-async-processed',
              backpropagate: backpropagateData,
            };
          },
        },
      },
      {
        id: 'connection-1',
        x: 0,
        y: 0,
        nodeType: 'connection',
        startNodeId: 'start-node',
        endNodeId: 'async-node',
        startThumbName: 'output',
        endThumbName: 'input',
      },
    ];

    flowEngine.initialize(flow);

    // Run the flow
    await flowEngine.run();

    // Verify backpropagate was called
    expect(backpropagateFn).toHaveBeenCalledTimes(1);
    expect(backpropagateFn).toHaveBeenCalledWith(
      backpropagateData,
      expect.objectContaining({
        id: 'async-node',
      }),
      expect.objectContaining({
        id: 'connection-1',
      })
    );
  });

  it('should not fail if backpropagate is not defined on the source node', async () => {
    // Create a simple flow where the source node doesn't have backpropagate
    const flow: FlowNode<NodeInfo>[] = [
      {
        id: 'start-node',
        x: 100,
        y: 100,
        nodeType: 'shape',
        taskType: 'start',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'start',
          compute: (input: any) => {
            return {
              result: 'start-value',
              output: 'start-value',
            };
          },
          // No backpropagate function defined
        },
      },
      {
        id: 'compute-node',
        x: 400,
        y: 100,
        nodeType: 'shape',
        taskType: 'compute',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'EndConnectorCenter',
            connectionType: 'end',
            name: 'input',
            thumbConstraint: 'value',
          },
          {
            thumbIndex: 1,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'compute',
          compute: (input: any) => {
            return {
              result: input + '-processed',
              output: input + '-processed',
              backpropagate: { gradient: 0.5 },
            };
          },
        },
      },
      {
        id: 'connection-1',
        x: 0,
        y: 0,
        nodeType: 'connection',
        startNodeId: 'start-node',
        endNodeId: 'compute-node',
        startThumbName: 'output',
        endThumbName: 'input',
      },
    ];

    flowEngine.initialize(flow);

    // Run the flow - should not throw
    await expect(flowEngine.run()).resolves.toBeDefined();
  });

  it('should not call backpropagate if compute does not return backpropagate data', async () => {
    const backpropagateFn = vi.fn();

    // Create a simple flow where compute doesn't return backpropagate
    const flow: FlowNode<NodeInfo>[] = [
      {
        id: 'start-node',
        x: 100,
        y: 100,
        nodeType: 'shape',
        taskType: 'start',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'start',
          compute: (input: any) => {
            return {
              result: 'start-value',
              output: 'start-value',
            };
          },
          backpropagate: backpropagateFn,
        },
      },
      {
        id: 'compute-node',
        x: 400,
        y: 100,
        nodeType: 'shape',
        taskType: 'compute',
        width: 200,
        height: 100,
        thumbs: [
          {
            thumbIndex: 0,
            thumbType: 'EndConnectorCenter',
            connectionType: 'end',
            name: 'input',
            thumbConstraint: 'value',
          },
          {
            thumbIndex: 1,
            thumbType: 'StartConnectorCenter',
            connectionType: 'start',
            name: 'output',
            thumbConstraint: 'value',
          },
        ],
        nodeInfo: {
          type: 'compute',
          compute: (input: any) => {
            return {
              result: input + '-processed',
              output: input + '-processed',
              // No backpropagate field
            };
          },
        },
      },
      {
        id: 'connection-1',
        x: 0,
        y: 0,
        nodeType: 'connection',
        startNodeId: 'start-node',
        endNodeId: 'compute-node',
        startThumbName: 'output',
        endThumbName: 'input',
      },
    ];

    flowEngine.initialize(flow);

    // Run the flow
    await flowEngine.run();

    // Verify backpropagate was not called
    expect(backpropagateFn).not.toHaveBeenCalled();
  });
});
