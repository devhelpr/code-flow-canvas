import {
  CanvasAppInstance,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  Rect,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';

export const getSummingJunction: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;

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
    name: 'summing-junction',
    family: 'flow-canvas',
    category: 'flow-control',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const template = createTemplate(
        `<svg class="scale-[4]" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 5L4.99998 19M5.00001 5L19 19" 
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      );
      const svgElement = createElementFromTemplate(template);

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-white 
          text-black flex items-center justify-center 
          rounded-full
          w-[50px] h-[50px] 
          overflow-hidden text-center`,
          style: {
            'clip-path': 'circle(50%)',
          },
        },
        undefined,
        svgElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRectThumb(
        x,
        y,
        50,
        50,
        undefined,
        [
          {
            thumbType: ThumbType.Center,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            maxConnections: 1,
          },
          {
            thumbType: ThumbType.Center,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            maxConnections: -1,
          },
        ],
        wrapper,
        {
          classNames: ``,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'summing-junction',
          formElements: [],
        },
        containerNode,
        undefined,
        true,
        true
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
