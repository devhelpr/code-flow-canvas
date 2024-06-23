import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  thumbConstraints,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

const fieldName = 'joinChar';
export const reverseArrayNodeName = 'reverse-array';
export const reverseArray: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, _payload?: any) => {
    if (!Array.isArray(input)) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const output = (input as any).toReversed();
    return {
      result: output,
      output: output,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    reverseArrayNodeName,
    'Reverse array',
    'flow-canvas',
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    100,
    [
      {
        thumbType: ThumbType.StartConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.start,
        color: 'white',
        label: '[]',
        thumbConstraint: thumbConstraints.array,
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: '[]',
        thumbConstraint: thumbConstraints.array,
      },
    ],
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
      category: 'variables-array',
    }
  );
};
