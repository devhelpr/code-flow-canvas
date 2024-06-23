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

const fieldName = 'createArray';
const createArrayNodeTitle = 'Create array';
export const createArrayNodeName = 'create-array';
export const createArray: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = () => {
    return {
      result: [],
      output: [],
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    createArrayNodeName,
    createArrayNodeTitle,
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
        prefixLabel: '',
        thumbConstraint: thumbConstraints.array,
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
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
