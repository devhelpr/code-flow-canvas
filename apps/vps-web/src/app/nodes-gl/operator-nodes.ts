import {
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { InitialValues, NodeTask } from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
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

export const getOperatorNodes = () => {
  return [
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'floor',
        'Floor',
        'floor-node',
        'floor-field'
      ),
      label: 'Floor',
      nodeName: 'floor-node',
    },
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'exp',
        'Exponentiation',
        'exp-node',
        'exp-field'
      ),
      label: 'Exponentiation',
      nodeName: 'exp-node',
    },
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'log2',
        'Base 2 of Log',
        'log2-node',
        'log2-field'
      ),
      label: 'Base 2 of Log',
      nodeName: 'log2-node',
    },
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'asin',
        'Arcsine',
        'arcsine-node',
        'arcsin-field'
      ),
      label: 'Arc sine',
      nodeName: 'arcsine-node',
    },
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'sin',
        'Sine(simple)',
        'sine-simple-node',
        'arcsin-field'
      ),
      label: 'Sine(simple)',
      nodeName: 'sine-simple-node',
    },
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'acos',
        'Arccos',
        'arcos-node',
        'arccos-field'
      ),
      label: 'Arc cos',
      nodeName: 'arccos-node',
    },
  ];
};
