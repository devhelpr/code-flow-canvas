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

const fieldName = 'intersect';
const labelName = 'Intersect';
export const intersectSetsNodeName = 'intersect-sets';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    //thumbConstraint: thumbConstraint,
    maxConnections: 1,
    prefixLabel: 'set',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'b',
    thumbConstraint: thumbConstraints.set,
    maxConnections: 1,
    prefixLabel: 'set',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'a',
    thumbConstraint: thumbConstraints.set,
    maxConnections: 1,
    prefixLabel: 'set',
  },
];

export const getInsersectSetsNode: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<any> => {
  const initializeCompute = () => {
    values.value1 = undefined;
    values.value2 = undefined;
    return;
  };

  const values = {
    value1: undefined,
    value2: undefined,
  } as {
    value1: undefined | string;
    value2: undefined | string;
  };

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string
  ) => {
    if (thumbName === 'a') {
      values.value1 = input;
    } else {
      if (thumbName === 'b') {
        values.value2 = input;
      }
    }
    if (values.value1 === undefined || values.value2 === undefined) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const value1 = values.value1 as unknown as Set<any>;
    const value2 = values.value2 as unknown as Set<any>;
    const newset = new Set();
    value1.forEach((value) => {
      const trimmed = value.trim();
      if (trimmed && value2.has(trimmed)) {
        newset.add(trimmed);
      }
    });
    values.value1 = undefined;
    values.value2 = undefined;
    return {
      result: newset,
      output: newset,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    intersectSetsNodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    320,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
      category: 'variables-set',
    }
  );
};
