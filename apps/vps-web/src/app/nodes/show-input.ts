import {
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const getShowInput: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let inputValues: any;
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = '';
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Input';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    inputValues = input;
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }

      htmlNode.domElement.textContent = (inputValues || '-').toString();
      if (rect) {
        rect.resize(240);
      }
    }
    return {
      result: input || '',
      followPath: undefined,
    };
  };
  return {
    name: 'show-input',
    family: 'flow-canvas',
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: 'break-words text-center',
        },
        undefined,
        'Input'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded max-w-[120px]`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        120,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',
            //thumbConstraint: '',
            name: 'output',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: ' ',
            //thumbConstraint: 'array',
            name: 'input',
            color: 'white',
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
      return node;
    },
  };
};
