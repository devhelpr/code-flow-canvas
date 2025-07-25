import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { FlowEngine } from '../interface/flow-engine';

const fieldName = 'multiply';
const labelName = 'Multiply';
const nodeName = 'multiply-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value1',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value2',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
];

export const getMultiplyNode: NodeTaskFactory<NodeInfo, FlowEngine> = (
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
    thumbName?: string,
    _scopeId?: string
  ) => {
    if (thumbName === 'value1') {
      values.value1 = input;
    } else {
      if (thumbName === 'value2') {
        values.value2 = input;
      }
    }
    if (
      values.value1 === undefined ||
      values.value2 === undefined ||
      isNaN(parseFloat(values.value1)) ||
      isNaN(parseFloat(values.value2))
    ) {
      return {
        result: undefined,
        output: input,
        stop: true,
        followPath: undefined,
      };
    }
    const value1 = parseFloat(values.value1) ?? 0;
    const value2 = parseFloat(values.value2) ?? 0;
    values.value1 = undefined;
    values.value2 = undefined;
    return {
      result: value1 * value2,
      output: value1 * value2,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    100,
    320,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      // contextInstance = nodeInstance.contextInstance;
      // node = nodeInstance.node;
    },
    {
      hasTitlebar: false,
      category: 'expression',
    }
  );
};
