import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  Rect,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';

export const getMultiTrigger: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: Rect<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    return {
      result: input,
      followPath: undefined,
    };
  };
  return {
    name: 'multi-trigger',
    family: 'flow-canvas',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const template = createTemplate(
        `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <title>call_split</title>
        <path stroke="currentColor" fill="currentColor" d="M9.984 3.984l-2.297 2.297 5.297 5.297v8.438h-1.969v-7.594l-4.734-4.734-2.297 2.297v-6h6zM14.016 3.984h6v6l-2.297-2.297-2.906 2.906-1.406-1.406 2.906-2.906z"></path>
        </svg>`
      );
      const svgElement = createElementFromTemplate(template);
      htmlNode = createElement(
        'div',
        {
          class: 'icon icon-call_split text-white text-[32px] rotate-90',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-transparent rotate-90 scale-[1.5] text-white flex items-center justify-center rounded-lg w-[100px] h-[50px] overflow-hidden text-center`,
          style: {
            // 'clip-path': 'circle(50%)',
          },
        },
        undefined,
        svgElement //htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        100,
        50,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            maxConnections: -1,
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
          type: 'multi-trigger',
          formElements: [],
        },
        containerNode,
        undefined
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
