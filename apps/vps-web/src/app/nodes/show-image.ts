import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const getShowImage: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      htmlNode.domElement.textContent = '-';
      if (rect) {
        rect.resize(256);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      if (typeof input === 'object') {
        (
          htmlNode.domElement as HTMLImageElement
        ).src = `data:image/png;base64,${(input as any).image}`;
        setTimeout(() => {
          if (rect) {
            rect.resize(256);
          }
        }, 0);
      }
    }
    return {
      result: input,
      followPath: undefined,
    };
  };
  return {
    name: 'show-image',
    family: 'flow-canvas',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      htmlNode = createElement(
        'img',
        {
          class: 'w-full block min-h-[32px] pointer-events-none',
          src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded max-w-[256px]`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        256,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',

            name: 'output',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: ' ',

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
          type: 'show-image',
          formElements: [],
        }
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
