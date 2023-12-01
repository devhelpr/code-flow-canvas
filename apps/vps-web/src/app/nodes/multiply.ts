import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';

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
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value1',
    thumbConstraint: thumbConstraint,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value2',
    thumbConstraint: thumbConstraint,
  },
];

export const getMultiplyNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
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
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string
  ) => {
    if (thumbName === 'value1') {
      values.value1 = input;
    } else {
      if (thumbName === 'value2') {
        values.value2 = input;
      }
    }
    if (values.value1 === undefined || values.value2 === undefined) {
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
      output: input,
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
    (values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node;
    },
    {
      hasTitlebar: false,
    }
  );
};
