import {
  createElement,
  createNamedSignal,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

export const getSum = () => {
  let node: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Sum';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string) => {
    let values: any[] = [];
    values = input as unknown as any[];
    if (!Array.isArray(input)) {
      values = [input];
    }
    const sum = values
      .map((value) => parseInt(value) ?? 0)
      .reduce((a, b) => a + b, 0);
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
        hasInitialValue = false;
      }
      htmlNode.domElement.textContent = sum.toString();

      if (rect) {
        rect.resize(240);
      }
    }
    return {
      result: sum.toString(),
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
        'Sum'
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
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            offsetY: 20,
            label: '[]',
            thumbConstraint: 'array',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            offsetY: 20,
            label: '[]',
            thumbConstraint: 'array',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        false,
        true
      );
      rect.nodeComponent.nodeInfo = {};
      rect.nodeComponent.nodeInfo.formElements = [];
      rect.nodeComponent.nodeInfo.taskType = 'sum';

      createNamedSignal(`sum-${rect.nodeComponent.id}`, '');

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
