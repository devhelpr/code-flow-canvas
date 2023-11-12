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
    const color = payload?.['color'] ?? 'vec3(1.,1.,1.)';
    const index = loopIndex ? loopIndex : 0;
    const x = Math.random() * 2.0 - 1.0;
    const y = Math.random() * 2.0 - 1.0;
    const xsine = Math.random() * 4;
    const ysine = Math.random() * 4;
    const factor = Math.random() * 0.5;
    const radius = Math.random() * 0.1;
    const shaderCode = `
      float dist${index} = length(centeredCoord + vec2(${factor}*sin(u_time*${xsine})+${x}, ${factor}*cos(u_time*${xsine})+${y}) ) ;
      dist${index} -= ${radius};
      //dist${index} = ${radius} / dist${index};
      dist${index} = abs(dist${index});
      float distep${index} = dist${index};//smoothstep(0.10, 0.28, dist${index});
      
      float colorhelper${index} = distep${index};//smoothstep(0.,1.,1.0 - distep${index});
      vec3 color${index} = ${color}; 
      vec3 colordist${index} = color${index} * vec3(distep${index});
      finalColor = mix(finalColor, colordist${index}, dist${index} > 0.85 ? 0. : dist${index});
    `;
    // float colorhelper${index} = smoothstep(0.7,1.,1.0 - dist${index} * 0.5);
    // vec3 color${index} = vec3(0.5 * colorhelper${index},0., 1. * colorhelper${index});
    //finalColor = mix(finalColor, color${index},dist${index});
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
            thumbConstraint: 'x',
            name: 'x',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            thumbConstraint: 'color',
            name: 'color',
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
