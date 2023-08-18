import {
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const getVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;

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
    (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
    let result: any = false;
    try {
      currentValue = parseFloat(input) ?? 0;
      if (isNaN(currentValue)) {
        currentValue = 0;
      }
      if (htmlNode) {
        (htmlNode.domElement as unknown as HTMLElement).textContent =
          currentValue.toString();
      }
      result = currentValue;
    } catch (error) {
      result = undefined;
      (errorNode.domElement as unknown as HTMLElement).classList.remove(
        'hidden'
      );
      (errorNode.domElement as unknown as HTMLElement).textContent =
        error?.toString() ?? 'Error';
      console.log('variable error', error);
    }

    return {
      result,
      followPath: undefined,
    };
  };

  const getData = () => {
    return currentValue;
  };
  return {
    name: 'variable',
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: <NodeInfo>(
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
          class: '',
        },
        undefined,
        '-'
      ) as unknown as INodeComponent<NodeInfo>;

      const componentWrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded text-center`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        100,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorBottom,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'yellow',
            label: '#',
            thumbConstraint: 'value',
            isDataPort: true,
          },
          {
            thumbType: ThumbType.EndConnectorTop,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'yellow',
            label: '#',
            thumbConstraint: 'value',
            isDataPort: true,
          },
        ],
        componentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          type: 'variable',
          formValues: {},
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.nodeComponent.nodeInfo.formElements = [];
      errorNode = createElement(
        'div',
        {
          class: `bg-red-500 p-4 rounded absolute bottom-[calc(100%+15px)] h-[100px] w-full hidden
            after:content-['']
            after:w-0 after:h-0 
            after:border-l-[10px] after:border-l-transparent
            after:border-t-[10px] after:border-t-red-500
            after:border-r-[10px] after:border-r-transparent
            after:absolute after:bottom-[-10px] after:left-[50%] after:transform after:translate-x-[-50%]
          `,
        },
        rect.nodeComponent.domElement,
        'error'
      ) as unknown as INodeComponent<NodeInfo>;

      node = rect.nodeComponent;
      node.nodeInfo.isVariable = true;
      node.nodeInfo.compute = compute;
      node.nodeInfo.sendData = compute;
      node.nodeInfo.getData = getData;
      node.nodeInfo.initializeCompute = initializeCompute;
      return node;
    },
  };
};
