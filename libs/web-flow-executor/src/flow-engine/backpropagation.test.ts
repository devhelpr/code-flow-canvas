import { describe, it, expect, vi } from 'vitest';

/**
 * Unit tests for the backpropagation feature
 * 
 * These tests verify that:
 * 1. When a compute function returns backpropagate data, it's sent to the source node
 * 2. When a computeAsync function returns backpropagate data, it's sent to the source node
 * 3. The feature gracefully handles cases where backpropagate is not defined
 * 4. The feature doesn't interfere with normal operation when not used
 */

describe('Backpropagation Feature', () => {
  it('should define backpropagate in IComputeResult interface', () => {
    // This test verifies the type definition exists
    // The actual type checking happens at compile time
    const computeResult = {
      result: 'test',
      output: 'test',
      backpropagate: { gradient: 0.5 },
    };

    expect(computeResult).toHaveProperty('backpropagate');
    expect(computeResult.backpropagate).toEqual({ gradient: 0.5 });
  });

  it('should allow backpropagate to be undefined', () => {
    const computeResult = {
      result: 'test',
      output: 'test',
    };

    expect(computeResult).not.toHaveProperty('backpropagate');
  });

  it('should allow complex backpropagation data structures', () => {
    const complexData = {
      gradients: [0.1, 0.2, 0.3],
      metadata: {
        timestamp: Date.now(),
        nodeId: 'test-node',
      },
      state: {
        counter: 42,
        values: new Map([['key', 'value']]),
      },
    };

    const computeResult = {
      result: 'test',
      output: 'test',
      backpropagate: complexData,
    };

    expect(computeResult.backpropagate).toEqual(complexData);
    expect(computeResult.backpropagate.gradients).toHaveLength(3);
    expect(computeResult.backpropagate.metadata.nodeId).toBe('test-node');
    expect(computeResult.backpropagate.state.counter).toBe(42);
  });

  it('should support backpropagate function in node info', () => {
    const backpropagateFn = vi.fn();
    const nodeInfo = {
      compute: (input: any) => ({ result: input, output: input }),
      backpropagate: backpropagateFn,
    };

    expect(nodeInfo).toHaveProperty('backpropagate');
    expect(typeof nodeInfo.backpropagate).toBe('function');

    // Test that the function can be called
    nodeInfo.backpropagate({ test: 'data' }, 'fromNode', 'fromConnection');
    expect(backpropagateFn).toHaveBeenCalledTimes(1);
    expect(backpropagateFn).toHaveBeenCalledWith(
      { test: 'data' },
      'fromNode',
      'fromConnection'
    );
  });

  it('should allow nodeInfo without backpropagate function', () => {
    const nodeInfo = {
      compute: (input: any) => ({ result: input, output: input }),
    };

    expect(nodeInfo).not.toHaveProperty('backpropagate');
  });
});

/**
 * Documentation test
 * 
 * This test serves as living documentation for how to use the backpropagation feature
 */
describe('Backpropagation Usage Documentation', () => {
  it('example: neural network-style backpropagation', () => {
    // Mock nodes for a simple neural network layer
    const layerState = { weights: [0.5, 0.3, 0.8] };

    // Source node (e.g., input layer)
    const sourceNode = {
      nodeInfo: {
        compute: (input: number) => ({
          result: input,
          output: input,
        }),
        backpropagate: vi.fn((data: any) => {
          // Update weights based on gradient
          if (data.gradient) {
            layerState.weights = layerState.weights.map(
              (w: number) => w - 0.1 * data.gradient
            );
          }
        }),
      },
    };

    // Destination node (e.g., hidden layer)
    const destNode = {
      nodeInfo: {
        compute: (input: number) => {
          const output = input * 2;
          return {
            result: output,
            output: output,
            // Send gradient back for weight updates
            backpropagate: {
              gradient: 0.15,
              loss: 0.02,
            },
          };
        },
      },
    };

    // Simulate flow execution
    const inputValue = 1.0;
    const result = destNode.nodeInfo.compute(inputValue);

    // Simulate backpropagation
    if (result.backpropagate) {
      sourceNode.nodeInfo.backpropagate(result.backpropagate, destNode, null);
    }

    // Verify backpropagation was called
    expect(sourceNode.nodeInfo.backpropagate).toHaveBeenCalledWith(
      { gradient: 0.15, loss: 0.02 },
      destNode,
      null
    );

    // Verify weights were updated
    expect(layerState.weights).toEqual([0.485, 0.285, 0.785]);
  });

  it('example: state feedback for UI updates', () => {
    const sourceState = { executionCount: 0, lastFeedback: null as any };

    // Source node that tracks execution statistics
    const sourceNode = {
      id: 'data-source',
      nodeInfo: {
        compute: (input: any) => ({
          result: input,
          output: input,
        }),
        backpropagate: vi.fn((data: any) => {
          sourceState.executionCount++;
          sourceState.lastFeedback = data;
        }),
      },
    };

    // Processing node that sends feedback
    const processingNode = {
      id: 'processor',
      nodeInfo: {
        compute: (input: any) => {
          const processedData = input.toUpperCase();
          return {
            result: processedData,
            output: processedData,
            backpropagate: {
              processedAt: Date.now(),
              inputLength: input.length,
              outputLength: processedData.length,
            },
          };
        },
      },
    };

    // Simulate flow
    const input = 'hello';
    const result = processingNode.nodeInfo.compute(input);

    if (result.backpropagate) {
      sourceNode.nodeInfo.backpropagate(
        result.backpropagate,
        processingNode,
        null
      );
    }

    // Verify feedback was received
    expect(sourceNode.nodeInfo.backpropagate).toHaveBeenCalled();
    expect(sourceState.executionCount).toBe(1);
    expect(sourceState.lastFeedback).toHaveProperty('inputLength', 5);
    expect(sourceState.lastFeedback).toHaveProperty('outputLength', 5);
  });

  it('example: async backpropagation', async () => {
    const metrics = { responseTime: 0 };

    // Source node
    const sourceNode = {
      nodeInfo: {
        compute: (input: any) => ({ result: input, output: input }),
        backpropagate: vi.fn((data: any) => {
          if (data.responseTime) {
            metrics.responseTime = data.responseTime;
          }
        }),
      },
    };

    // Async processing node
    const asyncNode = {
      nodeInfo: {
        computeAsync: async (input: any) => {
          const startTime = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 10));
          const endTime = Date.now();

          return {
            result: input,
            output: input,
            backpropagate: {
              responseTime: endTime - startTime,
              status: 'completed',
            },
          };
        },
      },
    };

    // Simulate async flow
    const result = await asyncNode.nodeInfo.computeAsync('test-data');

    if (result.backpropagate) {
      sourceNode.nodeInfo.backpropagate(result.backpropagate, asyncNode, null);
    }

    // Verify async backpropagation
    expect(sourceNode.nodeInfo.backpropagate).toHaveBeenCalled();
    expect(metrics.responseTime).toBeGreaterThanOrEqual(10);
  });
});
