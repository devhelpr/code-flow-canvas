import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';
import { morgannoise, noise } from '../gl-functions/noise';
import { registerGLSLFunction } from './custom-glsl-functions-registry';

const fieldName = 'noise';
const labelName = 'Noise';
const nodeName = 'noise-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: 'vec3',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'vector',
    prefixLabel: 'vector',
    thumbConstraint: 'vec2',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'time',
    prefixLabel: 'time',
    thumbConstraint: 'value',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'zoom',
    prefixLabel: 'zoom',
    thumbConstraint: 'value',
  },
];

registerGLSLFunction(nodeName, noise());

export const getNoiseNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value = payload?.['vector'];
    const time = payload?.['time'] ?? '1.';
    const zoom = payload?.['zoom'] ?? '.0001';
    return {
      result: `normalNoise(${value},${zoom},0.5,${time})`,
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

const morganNoiseThumbs = [
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'vector',
    prefixLabel: 'vector',
    thumbConstraint: 'vec2',
  },
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: 'value',
    maxConnections: -1,
  },
];

const morganNoiseNodeName = 'morgan-noise-node';

registerGLSLFunction(morganNoiseNodeName, morgannoise());

export const getMorganNoiseNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value = payload?.['vector'];
    return {
      result: `morganmcguirenoise(${value})`,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    morganNoiseNodeName,
    'Morgan noise',
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    100,
    morganNoiseThumbs,
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
