import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

import { InitialValues, NodeTask } from '../node-task-registry';
import { GLNodeInfo } from '../types/gl-node-info';

export const getSplitVector2dNode = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    _loopIndex?: number,
    payload?: any,
    thumbName?: string
  ) => {
    const vector = payload?.['vector'];
    if (thumbName === 'x') {
      return {
        result: `${vector}.x`,
        output: input,
        followPath: undefined,
      };
    } else if (thumbName == 'y') {
      return {
        result: `${vector}.y`,
        output: input,
        followPath: undefined,
      };
    }
    return {
      result: undefined,
      output: undefined,
      followPath: undefined,
    };
  };

  const nodeName = 'split-vector2-node';
  const nodeTitle = 'Split';
  return {
    name: nodeName,
    family: 'flow-canvas',
    isContainer: false,
    getCompute: () => compute,
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
          class: `inner-node bg-slate-500 text-white p-4 rounded flex flex-row items-center justify-center`,
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
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            thumbConstraint: 'value',
            name: 'x',
            prefixLabel: 'x',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            thumbConstraint: 'value',
            name: 'y',
            prefixLabel: 'y',
            maxConnections: -1,
          },

          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: 'vec2',
            name: 'vector',
            prefixLabel: 'vector',
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
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
