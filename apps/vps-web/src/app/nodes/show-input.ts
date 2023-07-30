import {
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

export const getShowInput = () => {
  let inputValues: any[] = [];
  let node: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = [];
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Input';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    inputValues = Array.isArray(input) ? input : [input];
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }

      htmlNode.domElement.textContent = inputValues.toString();
      if (rect) {
        rect.resize(240);
      }
    }
    return {
      result: [...inputValues],
      followPath: undefined,
    };
  };
  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: 'break-words',
        },
        undefined,
        'Input'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded max-w-[240px]`,
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
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            offsetY: 20,
            label: '[]',
            thumbConstraint: 'array',
            name: 'output',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            offsetY: 20,
            label: '[]',
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
          type: 'show-input',
          formElements: [],
        }
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
