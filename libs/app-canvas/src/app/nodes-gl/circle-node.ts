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
import { vec3Type } from '../gl-types/float-vec2-vec3';

export const getCircleNode = (_updated: () => void): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, loopIndex?: number, payload?: any) => {
    const color = payload?.['color'] ?? `${vec3Type}(1.,1.,1.)`;
    const x = payload?.['x'] ?? '0.0';
    const y = payload?.['y'] ?? '0.0';

    const index = loopIndex ? loopIndex : 0;
    const radius = 0.25;

    const shaderCode = `
      vec2 center${index} = vec2(${x} , ${y});
      float influence${index} = metaball(uv, center${index}, ${radius});
      vec3 color${index} = ${color};
      totalcolinf += color${index} * influence${index};
      totalInfluence += influence${index};
    `;
    return {
      result: shaderCode,
      output: shaderCode,
      followPath: undefined,
    };
  };

  return {
    name: 'circle-node',
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
        'circle'
      ) as unknown as INodeComponent<GLNodeInfo>;

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
            color: 'white',
            label: ' ',
            thumbConstraint: 'value',
            name: 'x',
            prefixLabel: 'x',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: 'value',
            name: 'y',
            prefixLabel: 'y',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 2,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: 'value',
            name: 'factor',
            prefixLabel: 'factor',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
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
        false,
        undefined,
        undefined,
        id,
        {
          type: 'circle-node',
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
