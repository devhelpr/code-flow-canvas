import {
  FlowCanvasInstance,
  createElement,
  INodeComponent,
  createFlowCanvas,
  IRectNodeComponent,
  createNodeElement,
  IDOMElement,
  ThumbConnectionType,
  ThumbType,
  InitialValues,
  NodeTask,
} from '@devhelpr/visual-programming-system';

import { GLNodeInfo } from '../types/gl-node-info';
import { getLoop } from '../shapes/loop';

export interface ComputeResult {
  result: string | any[];
  output?: string | any[];
  followPath?: string;
  stop?: boolean;
}
let repeatVariable = 0;

export const getForNode = (updated: () => void): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;
  let htmlNode: IDOMElement | undefined = undefined;
  let rect:
    | ReturnType<FlowCanvasInstance<GLNodeInfo>['createRect']>
    | undefined = undefined;
  let canvasAppInstance: FlowCanvasInstance<GLNodeInfo> | undefined = undefined;
  let input: IRectNodeComponent<GLNodeInfo> | undefined = undefined;
  let output: IRectNodeComponent<GLNodeInfo> | undefined = undefined;
  let repeatVariableInstance = 0;
  const initializeCompute = () => {
    //repeatVariable = 0;
    return;
  };

  const compute = (_input: string, _loopIndex?: number, payload?: any) => {
    const block = payload?.['block'] ?? 1;
    const repeat = payload?.['repeat'] ?? 1;
    const shader = `for (float i${repeatVariable} = 0.; i${repeatVariable} < ${repeat}; i${repeatVariable}+=1.0) {
        ${block}
    }`;

    return {
      result: shader,
      output: shader,
      followPath: undefined,
    };
  };

  return {
    name: 'for-node',
    family: 'flow-canvas',
    isContainer: true,
    notAllowedChildNodeTasks: ['for-node'],
    childNodeTasks: undefined,
    getCompute: () => compute,
    getConnectionInfo: () => {
      if (!input || !output) {
        return { inputs: [], outputs: [] };
      }
      return { inputs: [input], outputs: [output] };
    },
    createVisualNode: (
      canvasApp: FlowCanvasInstance<GLNodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValue?: InitialValues,
      containerNode?: IRectNodeComponent<GLNodeInfo>,
      width?: number,
      height?: number
    ) => {
      repeatVariable++;
      repeatVariableInstance = repeatVariable;

      htmlNode = createElement(
        'div',
        {
          class: 'w-full h-full overflow-hidden',
        },
        undefined,
        ''
      );

      const wrapper = createNodeElement(
        'div',
        {
          class: `bg-slate-400 rounded opacity-90 relative `, //z-[1151]`,
        },
        undefined,
        htmlNode?.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<GLNodeInfo>;

      createNodeElement(
        'div',
        {
          class: `absolute bottom-0 right-0 w-auto h-auto flex flex-row justify-center text-white p-8 opacity-100`,
        },
        wrapper.domElement,
        getLoop()
      ) as unknown as INodeComponent<GLNodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        width ?? 600,
        height ?? 400,
        undefined,
        [
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            name: 'repeat',
            thumbConstraint: 'constant-value',
          },
        ],
        wrapper,
        undefined,
        true,
        undefined,
        undefined,
        id,
        {
          formElements: [],
          type: 'for-node',
          taskType: 'for-node',
        },
        containerNode,
        undefined,
        'rect-node container-node'
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      (
        rect.nodeComponent?.thumbConnectors?.[0].domElement as HTMLElement
      )?.classList.remove('z-[1150]');
      (
        rect.nodeComponent?.thumbConnectors?.[0].domElement as HTMLElement
      )?.classList.add('z-[1200]');

      if (htmlNode && htmlNode.domElement) {
        canvasAppInstance = createFlowCanvas<GLNodeInfo>(
          htmlNode.domElement as HTMLElement,
          false,
          true,
          '',
          canvasApp.interactionStateMachine,
          undefined,
          undefined,
          undefined,
          true
        );

        rect.nodeComponent.canvasAppInstance = canvasAppInstance;
        canvasAppInstance.compositons = canvasApp.compositons;
        const inputInstance = canvasAppInstance.createRect(
          -1,
          0,
          1,
          1,
          undefined,
          [],
          '',
          {
            classNames: `pointer-events-auto`,
          },
          true,
          false,
          undefined,
          id + '_input',
          undefined,
          rect.nodeComponent,
          true
        );
        input = inputInstance.nodeComponent;

        if (input) {
          input.nodeInfo = {};
        }

        const outputInstance = canvasAppInstance.createRect(
          width ?? 600,
          0,
          1,
          1,
          undefined,
          [],
          '',
          {
            classNames: `pointer-events-auto`,
          },
          true,
          false,
          undefined,
          id + '_output',
          undefined,
          rect.nodeComponent,
          true
        );
        output = outputInstance.nodeComponent;
        if (output) {
          output.nodeInfo = {};
        }
        canvasAppInstance.setOnCanvasUpdated(() => {
          updated?.();
        });

        rect.addUpdateEventListener((target) => {
          if (target) {
            outputInstance.nodeComponent?.update?.(
              outputInstance.nodeComponent,
              target?.width,
              0,
              rect?.nodeComponent
            );
          }
        });

        (canvasAppInstance.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-auto'
        );
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.canvasAppInstance = canvasAppInstance;
        (node.nodeInfo as any).repeatVariableInstance = repeatVariableInstance;
      }

      return node;
    },
  };
};
