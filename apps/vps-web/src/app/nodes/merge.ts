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

const fieldName = 'merge';
const labelName = 'Merge';
export const mergeModeName = 'merge';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    //thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'a',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
    prefixLabel: 'a',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'b',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
    prefixLabel: 'b',
  },
];

export const getMergeNode: NodeTaskFactory<NodeInfo> = (
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
    const value1 = values.value1;
    const value2 = values.value2;
    values.value1 = undefined;
    values.value2 = undefined;
    return {
      result: {
        a: value1,
        b: value2,
      },
      output: {
        a: value1,
        b: value2,
      },
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    mergeModeName,
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
