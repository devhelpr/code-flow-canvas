import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Theme,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';

const fieldName = 'subtract';
const labelName = 'Subtract';
const nodeName = 'subtract-node';
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
    name: 'value1',
    thumbConstraint: thumbConstraint,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value2',
    thumbConstraint: thumbConstraint,
  },
];

export const getSubtractNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void,
  theme?: Theme
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value1 = payload?.['value1'];
    const value2 = payload?.['value2'];
    return {
      result: `(${value1} - ${value2})`,
      output: input,
      followPath: undefined,
    };
  };

  const element = createElementFromTemplate(
    createTemplate(`<div class="text-7xl -mt-[10px]">-</div>`)
  );

  return visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    100,
    320,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
      hideTitle: true,
      category: 'Math',
      backgroundColorClassName: theme?.nodeInversedBackground,
      textColorClassName: theme?.nodeInversedText,
    },
    element
  );
};
