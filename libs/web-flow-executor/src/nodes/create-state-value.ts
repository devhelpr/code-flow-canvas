import {
  IFlowCanvasBase,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

const fieldName = 'state-value';
const labelName = '';
export const createStateEventValueName = 'create-state-event-value';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'state-event',
    maxConnections: 1,
    prefixLabel: 'event',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value',
    maxConnections: 1,
    prefixLabel: 'value',
  },
];

export const getCreateEventStateValueNode: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<any> => {
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    values = { global: { stateEvent: undefined, value: undefined } };
    return;
  };

  let values = {
    global: {
      stateEvent: undefined,
      value: undefined,
    },
  } as Record<
    string,
    {
      stateEvent: undefined | string;
      value: undefined | string;
    }
  >;

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (scopeId && !values[scopeId]) {
      values[scopeId] = {
        stateEvent: undefined,
        value: undefined,
      };
    }
    const localValues = values[scopeId ?? 'global'];
    if (thumbName === 'state-event') {
      localValues.stateEvent = input;
    } else {
      if (thumbName === 'value') {
        localValues.value = input;
      }
    }
    if (
      localValues.stateEvent === undefined ||
      localValues.value === undefined
    ) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const stateEvent = localValues.stateEvent;
    const value = localValues.value;
    localValues.stateEvent = undefined;
    localValues.value = undefined;

    if (contextInstance && scopeId) {
      contextInstance.registerTempVariable('state-value', stateEvent, scopeId);
      contextInstance.registerTempVariable('value', value, scopeId);
    }
    console.log('state-value', scopeId, stateEvent, value, {
      ...contextInstance?.getVariables(scopeId),
    });
    return {
      result: {
        stateEvent: stateEvent,
        value: value,
      },
      output: {
        stateEvent: stateEvent,
        value: value,
      },
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    createStateEventValueName,
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
    (nodeInstance) => {
      contextInstance = nodeInstance.contextInstance;
    },
    {
      hasTitlebar: false,
      category: 'flow-control',
    }
  );
};
