import {
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { GLNodeInfo } from '../types/gl-node-info';

const fieldName = 'sine';
const labelName = 'Sine';
const nodeName = 'sine-node';
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
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'value',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'rads',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'amp',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'amp',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'freq',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'freq',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 3,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'shift',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'shift',
  },
];

export const getSineNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value = payload?.['value'];
    const amp = payload?.['amp'] || '1.0';
    const freq = payload?.['freq'] || '1.0';
    const shift = payload?.['shift'] || '0.0';
    return {
      result: `(sin(${value} * ${freq} + ${shift}) * ${amp})`,
      output: input,
      followPath: undefined,
    };
  };

  const element = createElementFromTemplate(
    createTemplate(`<svg width="64px" height="64px" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M57 193.48C61.6479 150.493 84.5896 129 125.825 129C187.678 129 195.16 272 269.08 272C330.771 272 343 201.978 343 193.48" 
    stroke="#ffffff" 
    stroke-opacity="1" 
    stroke-width="40" 
    stroke-linecap="round"
    stroke-linejoin="round"/>
  </svg>`)
  );

  return visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    150,
    150,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
      additionalClassNames: 'flex-wrap flex-col py-5',
      childNodeWrapperClass: 'w-full flex justify-center text-center',
      category: 'Math',
      hideTitle: true,
    },
    element
  );
};
