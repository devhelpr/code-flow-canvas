import {
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { thumbConstraints } from '../node-task-registry/thumbConstraints';

const fieldName = 'range';
const labelName = 'Sort';
export const sortArrayNodeName = 'sort-array';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: '[]',
    thumbConstraint: thumbConstraints.array,
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: '[]',
    thumbConstraint: thumbConstraints.array,
    maxConnections: 1,
  },
];

export const getSortArrayNode: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<any> => {
  const initializeCompute = () => {
    return;
  };

  const compute = (input: string) => {
    if (Array.isArray(input)) {
      const array = [...input];
      array.sort();
      return {
        result: array,
        output: array,
        followPath: undefined,
      };
    }
    return {
      result: undefined,
      output: undefined,
      stop: true,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    sortArrayNodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    150,
    320,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      // //contextInstance = nodeInstance.contextInstance;
      // node = nodeInstance.node;
    },
    {
      hasTitlebar: false,
      category: 'variables-array',
    }
  );
};
