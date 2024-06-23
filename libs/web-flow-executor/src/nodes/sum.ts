import {
  CanvasAppInstance,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getSum: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let currentSum = 0;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    currentSum = 0;
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Sum';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string) => {
    const previousOutput = currentSum;
    let values: any[] = [];
    values = input as unknown as any[];
    if (!Array.isArray(input)) {
      values = [input];
    }
    const sum = values
      .map((value) => parseInt(value) ?? 0)
      .reduce((a, b) => a + b, 0);
    if (htmlNode) {
      createElement(
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
      htmlNode.domElement.textContent = `Sum: ${sum.toString()}`;

      if (rect) {
        rect.resize(240);
      }
    }
    currentSum = sum;
    return {
      result: sum.toString(),
      followPath: undefined,
      previousOutput: (previousOutput ?? '').toString(),
    };
  };
  return {
    name: 'sum',
    family: 'flow-canvas',
    category: 'variables-array',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
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
          class: `inner-node bg-slate-500 p-4 rounded max-w-[240px] text-center`,
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
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: '#',
            color: 'white',
            thumbConstraint: 'value',
            name: 'output',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: '[]',
            color: 'white',
            thumbConstraint: 'array',
            name: 'input',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'sum',
          formElements: [],
        },
        containerNode
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.setValue = (value: string) => {
          if (htmlNode) {
            htmlNode.domElement.textContent = value.toString();

            if (rect) {
              rect.resize(240);
            }
          }
        };
      }
      return node;
    },
  };
};
