import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues, NodeTask } from '../node-task-registry';

export const getBackgroundColorNode = (updated: () => void): NodeTask<any> => {
  let node: IRectNodeComponent<any>;

  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<any>[],
    loopIndex?: number,
    payload?: any
  ) => {
    const red_color = payload?.['r'] ?? '0.';
    const green_color = payload?.['g'] ?? '0.';
    const blue_color = payload?.['b'] ?? '0.';

    const shaderCode = `
      backgroundColor = vec3(${red_color}, ${green_color}, ${blue_color});
    `;
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
      initalValues?: InitialValues,
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
        220,
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
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        undefined,
        undefined,
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
