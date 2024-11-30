import {
  IFlowCanvasBase,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  IDOMElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { createPreviewTip } from './node-utils/create-preview-tip';
import { showPreviewTip } from './node-utils/show-preview-tip';

export const getSum: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let previewNode: IDOMElement | undefined = undefined;
  let hasInitialValue = true;
  let currentSum = 0;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    lastInput = undefined;
    hasInitialValue = true;
    currentSum = 0;
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Sum';
      if (rect) {
        rect.resize(240);
      }
    }
    if (previewNode) {
      (previewNode.domElement as unknown as HTMLElement).classList.add(
        'hidden'
      );
    }
    return;
  };
  let lastInput: any = undefined;
  const compute = (
    input: string,
    _loopIndexloopIndex?: number,
    payload?: any
  ) => {
    const previousOutput = currentSum;

    if (payload && payload.triggerNode) {
      input = lastInput;
    } else {
      if (!payload?.showPreview) {
        lastInput = input;
      }
    }

    if (!payload?.showPreview) {
      if (previewNode) {
        (previewNode.domElement as unknown as HTMLElement).classList.add(
          'hidden'
        );
      }
    }

    let values: any[] = [];
    values = input as unknown as any[];
    if (!Array.isArray(input)) {
      values = [input];
    }
    const sum = values
      .map((value) => parseFloat(value) ?? 0)
      .reduce((a, b) => a + b, 0);
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      htmlNode.domElement.textContent = `Sum: ${sum.toFixed(2)}`;

      if (rect) {
        rect.resize(240);
      }
    }
    currentSum = sum;

    if (payload?.showPreview) {
      showPreviewTip(sum, previewNode);
    }
    return {
      result: sum.toFixed(2),
      followPath: undefined,
      previousOutput: (previousOutput ?? '').toString(),
    };
  };
  return {
    name: 'sum',
    family: 'flow-canvas',
    category: 'variables-array',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
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
          class: `inner-node bg-white p-4 rounded max-w-[240px] text-center text-black`,
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
            maxConnections: -1,
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

      if (node) {
        previewNode = createPreviewTip(node);
      }

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

        node.nodeInfo.supportsPreview = true;
        node.nodeInfo.cancelPreview = () => {
          if (previewNode) {
            (previewNode.domElement as unknown as HTMLElement).classList.add(
              'hidden'
            );
          }
        };
      }
      return node;
    },
  };
};
