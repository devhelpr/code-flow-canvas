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

export const getCircleNode = (updated: () => void): NodeTask<any> => {
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
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  return {
    name: 'circle-node',
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
        'circle'
      ) as unknown as INodeComponent<any>;

      const rect = canvasApp.createRect(
        x,
        y,
        110,
        110,
        undefined,
        [
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: '',
            name: 'x',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: '',
            name: 'y',
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
          type: 'circle-node',
          formValues: {},
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
