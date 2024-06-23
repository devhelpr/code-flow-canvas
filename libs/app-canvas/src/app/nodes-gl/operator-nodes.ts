import {
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';

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
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'value',
    thumbConstraint: thumbConstraint,
    prefixLabel: ' ',
  },
];

const createNodeFactoryFunction = (
  operator: string,
  label: string,
  nodeName: string,
  fieldName: string
) => {
  return (_updated: () => void): NodeTask<GLNodeInfo> => {
    const initializeCompute = () => {
      return;
    };
    const compute = (input: string, _loopIndex?: number, payload?: any) => {
      const value = payload?.['value'];
      return {
        result: `${operator}(${value})`,
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

function createOperatorNodeInfo(
  operator: string,
  label: string,
  nodeName: string,
  fieldName: string
) {
  return {
    nodeFactoryFunction: createNodeFactoryFunction(
      operator,
      label,
      nodeName,
      fieldName
    ),
    label: label,
    nodeName: nodeName,
  };
}

export const getOperatorNodes = () => {
  return [
    createOperatorNodeInfo('floor', 'Floor', 'floor-node', 'floor-field'),
    createOperatorNodeInfo('exp', 'Exponentiation', 'exp-node', 'exp-field'),
    createOperatorNodeInfo('log2', 'Base 2 of Log', 'log2-node', 'log2-field'),
    createOperatorNodeInfo('asin', 'Arcsine', 'arcsine-node', 'arcsin-field'),
    createOperatorNodeInfo(
      'sin',
      'Sine(simple)',
      'sine-simple-node',
      'arcsin-field'
    ),
    createOperatorNodeInfo('acos', 'Arccos', 'arcos-node', 'arccos-field'),
  ];
};
