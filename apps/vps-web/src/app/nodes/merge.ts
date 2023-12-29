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
    //thumbConstraint: thumbConstraint,
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
    //thumbConstraint: thumbConstraint,
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
    values = { global: { value1: undefined, value2: undefined } };
    return;
  };

  let values = {
    global: {
      value1: undefined,
      value2: undefined,
    },
  } as Record<
    string,
    {
      value1: undefined | string;
      value2: undefined | string;
    }
  >;

  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (scopeId && !values[scopeId]) {
      values[scopeId] = {
        value1: undefined,
        value2: undefined,
      };
    }
    const localValues = values[scopeId ?? 'global'];
    if (thumbName === 'a') {
      localValues.value1 = input;
    } else {
      if (thumbName === 'b') {
        localValues.value2 = input;
      }
    }
    if (localValues.value1 === undefined || localValues.value2 === undefined) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const value1 = localValues.value1;
    const value2 = localValues.value2;
    localValues.value1 = undefined;
    localValues.value2 = undefined;

    if (contextInstance && scopeId) {
      contextInstance.registerTempVariable('a', value1, scopeId);
      contextInstance.registerTempVariable('b', value2, scopeId);
    }
    console.log('merge', scopeId, value1, value2, {
      ...contextInstance?.getVariables(scopeId),
    });
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
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
    },
    {
      hasTitlebar: false,
    }
  );
};
