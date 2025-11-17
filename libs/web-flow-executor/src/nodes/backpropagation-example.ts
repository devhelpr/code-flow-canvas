/**
 * Example node demonstrating backpropagation functionality
 *
 * This node shows how a node can send information back to its input nodes
 * using the backpropagation mechanism. This can be useful for:
 * - Neural network-style gradient propagation
 * - Updating state in previous nodes based on downstream processing
 * - Providing feedback to input sources
 *
 * Usage:
 * 1. In your compute or computeAsync function, return a backpropagate field
 *    in the IComputeResult object
 * 2. Implement a backpropagate function in the NodeInfo of the source node
 *    that should receive the backpropagated data
 *
 * Example:
 *
 * // Node A (source node)
 * nodeInfo: {
 *   compute: (input) => ({ result: input, output: input }),
 *   backpropagate: (data, fromNode, fromConnection) => {
 *     console.log('Received backpropagation:', data);
 *     // Update local state, memory, or trigger visual updates
 *   }
 * }
 *
 * // Node B (destination node)
 * nodeInfo: {
 *   compute: (input) => ({
 *     result: input * 2,
 *     output: input * 2,
 *     backpropagate: { gradient: 0.5, originalInput: input }
 *   })
 * }
 *
 * When Node B executes, it will automatically call Node A's backpropagate
 * function with the data { gradient: 0.5, originalInput: input }
 */

import {
  IFlowCanvasBase,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getBackpropagationExampleNode: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;

  // Local state that can be updated via backpropagation
  let backpropCount = 0;
  let lastBackpropData: any = null;

  const compute = (input: string) => {
    const processedValue = `Processed: ${input}`;

    // Update display
    if (htmlNode) {
      htmlNode.domElement.textContent = `Backprop Count: ${backpropCount}\nLast Data: ${JSON.stringify(
        lastBackpropData,
        null,
        2
      )}\nInput: ${input}`;
    }

    // Return result with backpropagation data
    // This data will be sent back to the source node
    return {
      result: processedValue,
      output: processedValue,
      backpropagate: {
        processedAt: Date.now(),
        inputReceived: input,
        metadata: 'example-backprop-data',
      },
    };
  };

  const handleBackpropagation = (
    data: any,
    fromNode?: any,
    fromConnection?: any
  ) => {
    // This function is called when a downstream node sends backpropagation data
    console.log('Backpropagation received:', {
      data,
      fromNodeId: fromNode?.id,
      fromConnectionId: fromConnection?.id,
    });

    // Update local state
    backpropCount++;
    lastBackpropData = data;

    // Update visual representation
    if (htmlNode) {
      htmlNode.domElement.textContent = `Backprop Count: ${backpropCount}\nLast Data: ${JSON.stringify(
        data,
        null,
        2
      )}`;
    }
  };

  const initializeCompute = () => {
    backpropCount = 0;
    lastBackpropData = null;
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Backprop Example\nWaiting...';
    }
  };

  return {
    name: 'backpropagation-example',
    family: 'flow-canvas',
    category: 'example',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initialValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: 'text-center whitespace-pre-wrap',
        },
        undefined,
        'Backprop Example\nWaiting...'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-white p-4 rounded min-w-[240px] text-center text-black`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        240,
        120,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: 'output',
            color: 'white',
            thumbConstraint: 'value',
            name: 'output',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: 'input',
            color: 'white',
            thumbConstraint: 'value',
            name: 'input',
          },
        ],
        wrapper,
        {
          classNames: `bg-blue-500 p-4 rounded`,
        },
        undefined,
        false,
        false,
        id,
        {
          type: 'backpropagation-example',
          formElements: [],
        },
        containerNode
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;

      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.backpropagate = handleBackpropagation;
      }

      return node;
    },
  };
};
