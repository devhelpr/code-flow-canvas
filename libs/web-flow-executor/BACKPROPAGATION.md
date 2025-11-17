# Backpropagation Feature

## Overview

The backpropagation feature allows nodes in the flow executor to send information back to their input nodes. This enables nodes to update the state or memory of upstream nodes based on downstream processing results.

## Use Cases

1. **Neural Network Training**: Send gradients backward through the network to update weights
2. **State Feedback**: Inform input nodes about processing results or statistics
3. **Dynamic Memory Updates**: Update node memory that will be used in subsequent executions
4. **UI Updates**: Trigger visual updates in upstream nodes based on downstream results
5. **Performance Metrics**: Send timing or performance data back to data sources

## How It Works

When a node's `compute` or `computeAsync` function executes:

1. The node can optionally include a `backpropagate` field in its return value
2. The flow engine automatically sends this data to the source node(s) via their `backpropagate` function
3. The source node can use this data to update its internal state, memory, or visual representation

## Implementation

### Step 1: Add Backpropagation Handler to Source Node

Add a `backpropagate` function to the NodeInfo of the node that should receive backpropagated data:

```typescript
node.nodeInfo.backpropagate = (
  data: any,
  fromNode?: any,
  fromConnection?: IConnectionNodeComponent<NodeInfo>
) => {
  // Handle the backpropagated data
  console.log('Received backpropagation:', data);
  
  // Update local state
  localState.updateCount++;
  localState.lastData = data;
  
  // Update visual representation
  if (htmlNode) {
    htmlNode.domElement.textContent = `Feedback: ${JSON.stringify(data)}`;
  }
};
```

### Step 2: Send Backpropagation Data from Downstream Node

In your `compute` or `computeAsync` function, return an object with a `backpropagate` field:

```typescript
// Synchronous compute
node.nodeInfo.compute = (input: any) => {
  const result = processInput(input);
  
  return {
    result: result,
    output: result,
    backpropagate: {
      processedAt: Date.now(),
      inputValue: input,
      outputValue: result,
      metadata: 'custom-data'
    }
  };
};

// Asynchronous compute
node.nodeInfo.computeAsync = async (input: any) => {
  const result = await processInputAsync(input);
  
  return {
    result: result,
    output: result,
    backpropagate: {
      responseTime: Date.now() - startTime,
      status: 'completed'
    }
  };
};
```

## Complete Example

Here's a complete example showing a data source node and a processing node using backpropagation:

```typescript
// Source node (receives backpropagation)
let executionStats = { count: 0, totalTime: 0 };

const sourceNode = {
  nodeInfo: {
    compute: (input: any) => ({
      result: input,
      output: input
    }),
    backpropagate: (data: any) => {
      // Update statistics based on downstream feedback
      executionStats.count++;
      if (data.processingTime) {
        executionStats.totalTime += data.processingTime;
      }
      
      // Update UI to show stats
      updateNodeDisplay(
        `Executions: ${executionStats.count}\n` +
        `Avg Time: ${executionStats.totalTime / executionStats.count}ms`
      );
    }
  }
};

// Processing node (sends backpropagation)
const processingNode = {
  nodeInfo: {
    compute: (input: any) => {
      const startTime = Date.now();
      const result = expensiveOperation(input);
      const endTime = Date.now();
      
      return {
        result: result,
        output: result,
        backpropagate: {
          processingTime: endTime - startTime,
          inputSize: input.length,
          outputSize: result.length
        }
      };
    }
  }
};
```

## Neural Network Example

Here's how you might use backpropagation for a simple neural network layer:

```typescript
// Input layer node
let weights = [0.5, 0.3, 0.8];
const learningRate = 0.01;

const inputLayer = {
  nodeInfo: {
    compute: (input: number) => {
      const output = weights.reduce((sum, w, i) => sum + w * input, 0);
      return { result: output, output: output };
    },
    backpropagate: (data: any) => {
      // Update weights using gradient from downstream
      if (data.gradient) {
        weights = weights.map(w => w - learningRate * data.gradient);
      }
    }
  }
};

// Hidden layer node
const hiddenLayer = {
  nodeInfo: {
    compute: (input: number) => {
      const output = Math.tanh(input); // activation function
      const gradient = 1 - output * output; // derivative of tanh
      
      return {
        result: output,
        output: output,
        backpropagate: {
          gradient: gradient * 0.1, // gradient from loss
          loss: 0.05
        }
      };
    }
  }
};
```

## API Reference

### IComputeResult Interface

```typescript
interface IComputeResult {
  result: any;           // The result to pass to the next node
  output: any;           // The output value
  followPath?: any;      // Optional path to follow
  stop?: boolean;        // Whether to stop execution
  dummyEndpoint?: boolean;
  backpropagate?: any;   // Data to send back to source nodes
}
```

### NodeInfo.backpropagate Function

```typescript
backpropagate?: (
  data: any,                                      // Data from downstream node
  fromNode?: any,                                 // The node that sent the data
  fromConnection?: IConnectionNodeComponent<NodeInfo>  // The connection used
) => void;
```

## Important Notes

1. **Optional Feature**: The backpropagation mechanism is completely optional. Nodes work normally without it.

2. **No Breaking Changes**: Existing nodes continue to work without modification.

3. **Data Can Be Anything**: The backpropagated data can be any JavaScript value (primitives, objects, arrays, etc.).

4. **Multiple Inputs**: If a node has multiple input connections, backpropagation is sent to the specific source node of each connection.

5. **Async Compatible**: Works with both synchronous `compute` and asynchronous `computeAsync` functions.

6. **No Automatic Propagation Chain**: Backpropagation only goes one hop back (to the direct source node). If you need to propagate further, the receiving node must explicitly send its own backpropagation data.

## Testing

The feature includes comprehensive tests covering:
- Type definitions
- Basic functionality
- Complex data structures
- Neural network-style usage
- State feedback patterns
- Async backpropagation

Run tests with:
```bash
npx nx test web-flow-executor
```

## Example Node

See `libs/web-flow-executor/src/nodes/backpropagation-example.ts` for a complete example node implementation demonstrating the backpropagation feature.
