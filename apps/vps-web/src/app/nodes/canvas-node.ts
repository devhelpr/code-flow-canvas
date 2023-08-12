import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export interface ComputeResult {
  result: string | any[];
  followPath?: string;
}
export const getCanvasNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let canvasAppInstance: CanvasAppInstance | undefined = undefined;
  let input: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let output: IRectNodeComponent<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };

  const computePromise = <T>(
    input: string | any[],
    pathExecution?: RunNodeResult<T>[]
  ) => {
    return (
      resolve: (result: ComputeResult) => void,
      _reject: (error: string) => void
    ) => {
      resolve({ result: input });
    };
  };
  const computeAsync = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[]
  ) => {
    return new Promise<ComputeResult>(
      computePromise<NodeInfo>(input, pathExecution)
    );
  };

  return {
    name: 'canvas-node',
    family: 'flow-canvas',
    isContainer: true,
    childNodeTasks: ['expression', 'array', 'sum', 'fetch', 'if-condition'],
    getConnectionInfo: () => {
      if (!input || !output) {
        return { inputs: [], outputs: [] };
      }
      return { inputs: [input], outputs: [output] };
    },
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      initalValue?: InitialValues,
      containerNode?: INodeComponent<NodeInfo>
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: 'w-full h-full overflow-hidden',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `bg-slate-300 rounded`,
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
            name: 'output',
            label: '#',
            thumbConstraint: 'value',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            name: 'input',
            label: '#',
            thumbConstraint: 'value',
            color: 'white',
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
          taskType: 'canvas-node',
        }
      );
      // rect.nodeComponent.nodeInfo = {};
      // rect.nodeComponent.nodeInfo.formElements = [];
      // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      if (htmlNode.domElement) {
        canvasAppInstance = createCanvasApp<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          false,
          true,
          ''
        );

        const inputInstance = canvasAppInstance.createRect(
          -1,
          0,
          1,
          1,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              //hidden: true,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
            },
            {
              thumbType: ThumbType.EndConnectorLeft,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
              hidden: true,
            },
          ],
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

        const outputInstance = canvasAppInstance.createRect(
          600,
          0,
          1,
          1,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              hidden: true,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
            },
            {
              thumbType: ThumbType.EndConnectorLeft,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
            },
          ],
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

        canvasAppInstance.setOnCanvasUpdated(() => {
          updated?.();
        });

        (canvasAppInstance.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-auto'
        );
      }

      node = rect.nodeComponent;
      node.nodeInfo.computeAsync = computeAsync;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.canvasAppInstance = canvasAppInstance;

      return node;
    },
  };
};
