import {
  IRectNodeComponent,
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

const fieldName = 'square';
const labelName = 'Square';
const nodeName = 'squared-node';
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
  },
];

export const getSquaredNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void,
  theme?: Theme
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value = payload?.['value'];
    if (node && node.domElement) {
      const element = (node.domElement as HTMLElement).querySelector(
        '.node-text'
      );
      if (element) {
        if (value.length > 0 && value.length <= 4) {
          element.innerHTML = `${value}&sup2;`;
        } else {
          element.innerHTML = `x&sup2;`;
        }
      }
    }

    return {
      result: `(${value} * ${value})`,
      output: input,
      followPath: undefined,
    };
  };

  const element = createElementFromTemplate(
    createTemplate(`<div class="node-text text-7xl -mt-[10px]">x&sup2;</div>`)
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
    320,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      node = nodeInstance.node as unknown as IRectNodeComponent<GLNodeInfo>;

      const element = (node.domElement as HTMLElement).querySelector(
        '.node-text'
      );
      if (element) {
        const value = (nodeInstance.node as IRectNodeComponent<GLNodeInfo>)
          ?.connections?.[0]?.connectionStartNodeThumb?.prefixLabel;
        if (value && value.length > 0 && value.length <= 4) {
          element.innerHTML = `${value}&sup2;`;
        } else {
          element.innerHTML = `x&sup2;`;
        }
      }
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
