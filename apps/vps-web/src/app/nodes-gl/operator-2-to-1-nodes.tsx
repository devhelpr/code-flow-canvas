import {
  Theme,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
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
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'x',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'x',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'y',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'y',
  },
];

const createNodeFactoryFunction = (
  operator: string,
  label: string,
  nodeName: string,
  fieldName: string,
  passInVec2 = false
) => {
  return (_updated: () => void, theme?: Theme): NodeTask<GLNodeInfo> => {
    const initializeCompute = () => {
      return;
    };
    const compute = (input: string, _loopIndex?: number, payload?: any) => {
      const x = payload?.['x'];
      const y = payload?.['y'];
      if (passInVec2) {
        return {
          result: `${operator}(vec2(${x},${y}_)`,
          output: input,
          followPath: undefined,
        };
      }
      return {
        result: `${operator}(${y},${x})`,
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
        category: 'Math',
        hideTitle: true,
        backgroundColorClassName: theme?.nodeInversedBackground,
        textColorClassName: theme?.nodeInversedText,
      },
      <div class="text-base">Arctan</div>
    );
  };
};

export const get2To1OperatorNodes = () => {
  return [
    {
      nodeFactoryFunction: createNodeFactoryFunction(
        'atan',
        'Arctan',
        'atan-node',
        'atan'
      ),
      label: 'Arctan',
      nodeName: 'atan-node',
    },
  ];
};
