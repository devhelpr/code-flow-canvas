import {
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';

const familyName = 'flow-canvas';
const thumbConstraint = 'vec2';
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
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'vector',
    thumbConstraint: thumbConstraint,
    prefixLabel: ' ',
  },
];

const createNodeFactoryFunction = (
  operator: string,
  label: string,
  nodeName: string,
  fieldName: string,
  _passInVec2 = false
) => {
  return (_updated: () => void): NodeTask<GLNodeInfo> => {
    const initializeCompute = () => {
      return;
    };
    const compute = (input: string, _loopIndex?: number, payload?: any) => {
      const vector = payload?.['vector'];
      return {
        result: `${operator}(${vector})`,
        output: input,
        followPath: undefined,
      };
    };

    return visualNodeFactory(
      nodeName,
      label,
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
        category: 'Math',
      }
    );
  };
};

export const getVec2ToVec2OperatorNodes = () => {
  return [
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'floor',
        'Floor',
        'floor-vector-node',
        'floor'
      ),
      label: 'Floor',
      nodeName: 'floor-vector-node',
    },
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'normalize',
        'Normalize',
        'normalize-vec2-node',
        'normalize-field',
        true
      ),
      label: 'Normalize',
      nodeName: 'normalize-vec2-node',
    },
  ];
};
