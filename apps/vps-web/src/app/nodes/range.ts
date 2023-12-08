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
import { thumbConstraints } from '../node-task-registry/thumbConstraints';

const fieldName = 'range';
const labelName = 'Range';
export const rangeNodeName = 'range';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraints.range,
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'min',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
    prefixLabel: 'min',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'max',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
    prefixLabel: 'max',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'step',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
    prefixLabel: 'step',
  },
];

export const getRangeNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<NodeInfo>;
  //let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    values.min = undefined;
    values.max = undefined;
    values.step = 1;
    return;
  };

  const values = {
    min: undefined,
    max: undefined,
  } as {
    min: undefined | number;
    max: undefined | number;
    step: undefined | number;
  };

  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string
  ) => {
    const hasStepConnection =
      node?.connections?.find(
        (connection) => connection.endNodeThumb?.thumbName === 'step'
      ) !== undefined ?? false;

    if (thumbName === 'min') {
      values.min = parseFloat(input) ?? undefined;
      if (isNaN(values.min)) {
        values.min = undefined;
      }
    } else if (thumbName === 'max') {
      values.max = parseFloat(input) ?? undefined;
      if (isNaN(values.max)) {
        values.max = undefined;
      }
    } else if (thumbName === 'step') {
      values.step = parseFloat(input) ?? 1;
      if (isNaN(values.step)) {
        values.step = 1;
      }
    }
    if (
      values.min === undefined ||
      values.max === undefined ||
      (hasStepConnection && values.step === undefined)
    ) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const min = values.min;
    const max = values.max;
    const step = values.step;
    values.min = undefined;
    values.max = undefined;
    values.step = hasStepConnection ? undefined : 1;
    const value = {
      type: 'range',
      min: min,
      max: max,
      step: step,
    };
    return {
      result: value,
      output: value,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    rangeNodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    150,
    320,
    thumbs,
    (values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      //contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node;
    },
    {
      hasTitlebar: false,
    }
  );
};
