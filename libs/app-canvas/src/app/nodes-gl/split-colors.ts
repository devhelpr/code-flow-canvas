import {
  IFlowCanvasBase,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

import { GLNodeInfo } from '../types/gl-node-info';

export const getSplitColorsNode = (
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
    const vector = payload?.['color'];
    if (thumbName === 'r') {
      return {
        result: `${vector}.r`,
        output: input,
        followPath: undefined,
      };
    } else if (thumbName == 'g') {
      return {
        result: `${vector}.g`,
        output: input,
        followPath: undefined,
      };
    } else {
      return {
        result: `${vector}.b`,
        output: input,
        followPath: undefined,
      };
    }
  };

  const nodeName = 'split-colors-node';
  const nodeTitle = 'Split Colors';
  return {
    name: nodeName,
    family: 'flow-canvas',
    isContainer: false,
    getCompute: () => compute,
    createVisualNode: (
      canvasApp: IFlowCanvasBase<GLNodeInfo>,
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
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'red',
            label: ' ',
            thumbConstraint: 'value',
            name: 'r',
            prefixLabel: 'r',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            color: 'green',
            label: ' ',
            thumbConstraint: 'value',
            name: 'g',
            prefixLabel: 'g',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 2,
            connectionType: ThumbConnectionType.start,
            color: 'blue',
            label: ' ',
            thumbConstraint: 'value',
            name: 'b',
            prefixLabel: 'b',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 3,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: 'vec3',
            name: 'color',
            prefixLabel: 'color',
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
