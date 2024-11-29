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

const fieldName = 'createGuid';
const createGuidNodeTitle = 'Create guid';
export const createGuidNodeName = 'create-guid';
export const createGuid: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = () => {
    const guid = crypto.randomUUID();
    return {
      result: guid,
      output: guid,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    createGuidNodeName,
    createGuidNodeTitle,
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
      category: 'utils',
    }
  );
};
