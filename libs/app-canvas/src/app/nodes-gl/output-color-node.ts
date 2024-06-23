import {
  CanvasAppInstance,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

import { GLNodeInfo } from '../types/gl-node-info';
import { floatType, vec3Type } from '../gl-types/float-vec2-vec3';

const thumbs = [
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'red',
    label: ' ',
    thumbConstraint: 'value',
    name: 'r',
    prefixLabel: 'r',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'green',
    label: ' ',
    thumbConstraint: 'value',
    name: 'g',
    prefixLabel: 'g',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.end,
    color: 'blue',
    label: ' ',
    thumbConstraint: 'value',
    name: 'b',
    prefixLabel: 'b',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 3,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    thumbConstraint: 'vec3',
    name: 'vector',
    prefixLabel: 'vector3',
  },
];

export const getOutputColorNode = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, _loopIndex?: number, payload?: any) => {
    let red_color = payload?.['r'] ?? '0.';
    let green_color = payload?.['g'] ?? '0.';
    let blue_color = payload?.['b'] ?? '0.';
    const vector = payload?.['vector'];
    let preStatements = '';
    let isRedStatementSet = false;
    if (red_color === green_color) {
      isRedStatementSet = true;
      preStatements += `
      ${floatType}  red = ${red_color};
      `;
      red_color = 'red';
      green_color = 'red';
    }

    if (red_color === blue_color) {
      if (!isRedStatementSet) {
        preStatements += `
        ${floatType} red = ${red_color};
        `;
        red_color = 'red';
      }
      blue_color = 'red';
    }

    if (green_color === blue_color && green_color !== 'red') {
      preStatements += `
      ${floatType} green = ${green_color};
      `;
      green_color = 'green';
      blue_color = 'green';
    }
    let shaderCode = `
      ${preStatements}
      backgroundColor =  ${vec3Type}(${red_color}, ${green_color}, ${blue_color});
    `;
    if (vector) {
      shaderCode = `
      backgroundColor = ${vector};
    `;
    }
    return {
      result: shaderCode,
      output: shaderCode,
      followPath: undefined,
    };
  };

  const nodeName = 'output-color-node';
  const nodeTitle = 'Output Color';
  return {
    name: nodeName,
    family: 'flow-canvas',
    isContainer: false,
    category: 'output',
    thumbs,
    createVisualNode: (
      canvasApp: CanvasAppInstance<GLNodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<GLNodeInfo>
    ) => {
      const jsxComponentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded flex flex-row items-center justify-center`,
        },
        undefined,
        nodeTitle
      ) as unknown as INodeComponent<GLNodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        220,
        100,
        undefined,
        thumbs,
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        undefined,
        true,
        id,
        {
          type: nodeName,
          formValues: {},
          compute: compute,
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [];
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
