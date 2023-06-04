import {
  createElement,
  createNamedSignal,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

export const getIfCondition = () => {
  let node: INodeComponent<NodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    return {
      result: input,
      followPath: Math.random() < 0.5 ? 'success' : 'failure',
    };
  };
  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number
    ) => {
      const jsxComponentWrapper = createElement(
        'div',
        {
          //class: `bg-slate-500 p-4 rounded cursor-pointer`,
          class:
            'flex text-center items-center justify-center w-[100px] h-[120px] overflow-hidden bg-slate-500 rounded cursor-pointer',
          style: {
            'clip-path': 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%',
          },
        },
        undefined,
        'random'
        // FormComponent({
        //   id: 'test',
        //   formElements: [],
        //   hasSubmitButton: false,
        //   onSave: (formValues) => {
        //     //
        //   },
        //}) as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorTop,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            pathName: 'success',
            color: 'rgba(95,204,37,1)',
          },
          {
            thumbType: ThumbType.StartConnectorBottom,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            pathName: 'failure',
            color: 'rgba(204,37,37,1)',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        }
      );
      rect.nodeComponent.nodeInfo = {};
      rect.nodeComponent.nodeInfo.formElements = [];
      rect.nodeComponent.nodeInfo.taskType = 'if';

      createNamedSignal(`if${rect.nodeComponent.id}`, '');

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
