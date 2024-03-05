import {
  IThumb,
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

const fieldName = 'greater-then';
const labelName = 'Greater Then';
const nodeName = 'greater-then-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: 'condition',
    maxConnections: -1,
    thumbShape: 'diamond',
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
] as IThumb[];

export const getGreaterThenNode: NodeTaskFactory<GLNodeInfo> = (
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
      result: `(${value1} > ${value2})`,
      output: input,
      followPath: undefined,
    };
  };

  const element = createElementFromTemplate(
    createTemplate(
      `<div class="text-7xl"><span class="icon-navigate_nextchevron_right" /></div>`
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
      backgroundColorClassName: `${theme?.nodeInversedBackground} diamond-shape`,
      textColorClassName: theme?.nodeInversedText,
    },
    element
  );
};
