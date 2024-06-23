import {
  IComputeResult,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';

const fieldName = 'wheel';
const labelName = 'Scene zoom';
const nodeName = 'wheel-node';
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
    name: 'wheel',
    prefixLabel: ' ',
  },
];

export const getWheelNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string
  ) => {
    return {
      result: `u_wheel`,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    `${nodeName}`,
    `${labelName}`,
    familyName,
    fieldName,
    compute as unknown as (
      input: string,
      loopIndex?: number,
      payload?: any
    ) => IComputeResult,
    initializeCompute,
    false,
    200,
    100,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
      category: 'input',
      additionalClassNames: 'wheel-node',
    }
  );
};
