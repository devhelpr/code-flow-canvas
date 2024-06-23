import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';

import { GLNodeInfo } from '../types/gl-node-info';
import { vec3Type } from '../gl-types/float-vec2-vec3';

const fieldName = 'create-vector3';
const labelName = 'Create vector3';
const nodeName = 'create-vector3';
const familyName = 'flow-canvas';
const thumbConstraint = 'vec3';
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
    color: 'red',
    label: ' ',

    name: 'r',
    thumbConstraint: 'value',
    prefixLabel: 'r',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'green',
    label: ' ',

    name: 'g',
    thumbConstraint: 'value',
    prefixLabel: 'g',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.end,
    color: 'blue',
    label: ' ',

    name: 'b',
    thumbConstraint: 'value',
    prefixLabel: 'b',
  },
];

export const getCreateVector3Node: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const r = payload?.['r'] ?? '0.0';
    const g = payload?.['g'] ?? '0.0';
    const b = payload?.['b'] ?? '0.0';
    return {
      result: `${vec3Type}(${r}, ${g}, ${b})`,
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
    }
  );
};
