import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Theme,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';

const fieldName = 'multiply-color';
const labelName = 'Multiply';
const nodeName = 'multiply-color-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
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
    name: 'x',
    thumbConstraint: thumbConstraint,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'color',
    //    prefixLabel: '',
    thumbConstraint: 'vec3',
  },
];

export const getMultiplyColorNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void,
  theme?: Theme
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const color = payload?.['color'];

    const x = payload?.['x'];
    return {
      result: `(${color} * ${x})`,
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
    <div class="text-7xl -mt-[10px]">
      *<br />
      <span class="text-base block">Color</span>
    </div>
  );
};
