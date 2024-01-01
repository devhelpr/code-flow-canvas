import {
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

export const getNoiseNode: NodeTaskFactory<any> = (
  _updated: () => void
): NodeTask<any> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    _pathExecution?: RunNodeResult<NodeInfo>[],
    _loopIndex?: number,
    payload?: any
  ) => {
    const value = payload?.['vector'];
    const time = payload?.['time'] ?? '1.';
    const zoom = payload?.['zoom'] ?? '.0001';
    return {
      result: `normalNoise(${value},${zoom},1.,${time})`,
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
