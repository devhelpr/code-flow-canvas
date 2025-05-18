import {
  IFlowCanvasBase,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  thumbConstraints,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

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
  _updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    values.min = undefined;
    values.max = undefined;
    values.step = undefined;
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
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string
  ) => {
    const hasStepConnection =
      node?.connections?.find(
        (connection) => connection.endNodeThumb?.thumbName === 'step'
      ) !== undefined;

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
      if (!canvasAppInstance?.isContextOnly) {
        if (values.min === undefined && values.max) {
          (node?.thumbConnectors?.[1].domElement as HTMLElement)
            ?.querySelector('.inner-thumb')
            ?.classList?.add('blink-thumb');
        }
        if (values.max === undefined && values.min) {
          (node?.thumbConnectors?.[2].domElement as HTMLElement)
            .querySelector('.inner-thumb')
            ?.classList?.add('blink-thumb');
        }
      }
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    if (!canvasAppInstance?.isContextOnly) {
      (node?.thumbConnectors?.[1].domElement as HTMLElement)
        ?.querySelector('.inner-thumb')
        ?.classList?.remove('blink-thumb');
      (node?.thumbConnectors?.[2].domElement as HTMLElement)
        ?.querySelector('.inner-thumb')
        ?.classList?.remove('blink-thumb');
    }
    const min = values.min;
    const max = values.max;
    const step = values.step;

    // ... commented because if this runs, you cannot control the range with individual slider input for example
    // values.min = undefined;
    // values.max = undefined;
    // values.step = hasStepConnection ? undefined : 1;
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
    (_values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      canvasAppInstance = nodeInstance.contextInstance;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (node?.nodeInfo) {
        node.nodeInfo.initializeOnStartFlow = true;
      }
    },
    {
      hasTitlebar: false,
      category: 'variables-array',
    }
  );
};
