import {
  Theme,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';

const fieldName = 'subtract-vector';
const labelName = `Subtract vectors`;
const nodeName = 'subtract-vector-node';
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
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'vector1',
    thumbConstraint: thumbConstraint,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'vector2',
    thumbConstraint: thumbConstraint,
  },
];

export const getSubtractVectorNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void,
  theme?: Theme
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value1 = payload?.['vector1'];
    const value2 = payload?.['vector2'];
    return {
      result: `(${value1} - ${value2})`,
      output: input,
      followPath: undefined,
    };
  };

  const element = createElementFromTemplate(
    createTemplate(
      `<div class="text-7xl -mt-[10px]">-<br /><span class="text-base block">Vectors</span></div>`
    )
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
