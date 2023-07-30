import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';

export const getCanvasNode = (updated?: () => void) => {
  let node: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let mapCanvasApp: CanvasAppInstance | undefined = undefined;
  let currentValue = 0;
  const initializeCompute = () => {
    currentValue = 0;
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number
  ) => {
    return {
      result: 1,
      followPath: undefined,
    };
  };

  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      expression?: string,
      id?: string
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        600,
        400,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            offsetY: 20,
            name: 'output',
            label: '#',
            thumbConstraint: 'value',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            offsetY: 20,
            name: 'input',
            label: '#',
            thumbConstraint: 'value',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          FormElements: [],
          type: 'canvas-node',
          taskTyp: 'canvas-node',
        }
      );
      // rect.nodeComponent.nodeInfo = {};
      // rect.nodeComponent.nodeInfo.formElements = [];
      // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

      if (htmlNode.domElement) {
        mapCanvasApp = createCanvasApp<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          true
        );

        (mapCanvasApp.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-none'
        );
      }
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      node.nodeInfo.computeAsync = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
