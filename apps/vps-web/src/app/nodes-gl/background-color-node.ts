import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

import { InitialValues, NodeTask } from '../node-task-registry';

export const getBackgroundColorNode = (_updated: () => void): NodeTask<any> => {
  let node: IRectNodeComponent<any>;

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
        float red = ${red_color};
      `;
      red_color = 'red';
      green_color = 'red';
    }

    if (red_color === blue_color) {
      if (!isRedStatementSet) {
        preStatements += `
          float red = ${red_color};
        `;
        red_color = 'red';
      }
      blue_color = 'red';
    }

    if (green_color === blue_color && green_color !== 'red') {
      preStatements += `
        float green = ${green_color};
      `;
      green_color = 'green';
      blue_color = 'green';
    }
    let shaderCode = `
      ${preStatements}
      backgroundColor = vec3(${red_color}, ${green_color}, ${blue_color});
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

  const nodeName = 'background-color-node';
  const nodeTitle = 'Background Color';
  return {
    name: nodeName,
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: (
      canvasApp: CanvasAppInstance<any>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<any>
    ) => {
      const jsxComponentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded-xl flex flex-row items-center justify-center`,
        },
        undefined,
        nodeTitle
      ) as unknown as INodeComponent<any>;

      const rect = canvasApp.createRect(
        x,
        y,
        220,
        100,
        undefined,
        [
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
            prefixLabel: 'vector',
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
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
