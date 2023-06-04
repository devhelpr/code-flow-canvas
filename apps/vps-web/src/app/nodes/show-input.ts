import {
  createElement,
  createNamedSignal,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

export const getShowInput = () => {
  let node: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Input';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string) => {
    if (htmlNode) {
      const inputElement = createElement(
        'div',
        {
          class:
            'inline-block p-1 m-1 bg-slate-500 border border-slate-600 rounded text-white',
        },
        undefined,
        input.toString()
      ) as unknown as INodeComponent<NodeInfo>;

      if (hasInitialValue) {
        htmlNode.domElement.textContent = '';
        hasInitialValue = false;
      }

      htmlNode.domElement.appendChild(
        inputElement.domElement as unknown as HTMLElement
      );

      if (rect) {
        rect.resize(240);
      }
    }
    return {
      result: input,
      followPath: undefined,
    };
  };
  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        'Input'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded cursor-pointer max-w-[240px]`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        }
      );
      rect.nodeComponent.nodeInfo = {};
      rect.nodeComponent.nodeInfo.formElements = [];
      rect.nodeComponent.nodeInfo.taskType = 'showInput';

      createNamedSignal(`showInput-${rect.nodeComponent.id}`, '');

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
