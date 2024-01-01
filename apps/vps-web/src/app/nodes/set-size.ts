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

const fieldName = 'set-szize';
const labelName = 'Get size';
export const setSizeNodeName = 'set-size';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraints.value,
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraints.set,
    maxConnections: 1,
    prefixLabel: 'set',
  },
];

export const getSetSizeNode: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<any> => {
  const initializeCompute = () => {
    return;
  };

  const compute = (input: string) => {
    if (
      input === undefined ||
      (typeof input === 'object' && !((input as any) instanceof Set))
    ) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }

    const size = (input as unknown as Set<any>).size;
    return {
      result: size,
      output: size,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    setSizeNodeName,
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
      //
    },
    {
      hasTitlebar: false,
    }
  );
};
