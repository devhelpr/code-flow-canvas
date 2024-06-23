import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { GLNodeInfo } from '../types/gl-node-info';

const fieldName = 'time';
const labelName = 'Time';
const nodeName = 'time-node';
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
];

export const getTimeNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    return {
      result: `u_time`,
      output: input,
      followPath: undefined,
    };
  };

  const element = createElementFromTemplate(
    createTemplate(`<div class="loader"></div>`)
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
      additionalClassNames: 'flex-wrap flex-col',
      childNodeWrapperClass: 'w-full block text-center',
      category: 'input',
    },
    element
  );
};
