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
import { vec2Type } from '../gl-types/float-vec2-vec3';

const fieldName = 'position';
const labelName = 'Scene position';
const nodeName = 'position-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
    name: 'x',
    prefixLabel: 'x',
  },
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
    name: 'y',
    prefixLabel: 'y',
  },
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: 'vec2',
    maxConnections: -1,
    name: 'vector',
    prefixLabel: 'vector',
  },
];

export const getPositionNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string
  ) => {
    if (thumbName === 'x') {
      return {
        result: `u_positionX`,
        output: input,
        followPath: undefined,
      };
    } else if (thumbName == 'y') {
      return {
        result: `u_positionY`,
        output: input,
        followPath: undefined,
      };
    } else {
      return {
        result: `${vec2Type}(u_positionX, u_positionY)`,
        output: input,
        followPath: undefined,
      };
    }
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
      additionalClassNames: 'position-node',
    }
  );
};
