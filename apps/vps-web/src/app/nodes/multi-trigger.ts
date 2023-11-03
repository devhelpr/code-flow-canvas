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
import {
  runNodeFromThumb,
  RunNodeResult,
} from '../simple-flow-engine/simple-flow-engine';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';

export const getMultiTrigger =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
    let rect: Rect<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      return;
    };
    const compute = (
      input: string,
      pathExecution?: RunNodeResult<NodeInfo>[],
      loopIndex?: number,
      payload?: any
    ) => {
      if (node.thumbConnectors && node.thumbConnectors.length > 2) {
        runNodeFromThumb(
          node.thumbConnectors[0],
          animatePathFromThumb,
          (inputFromSecondRun: string | any[]) => {
            return;
          },
          input,
          pathExecution,
          node,
          loopIndex
        );

        runNodeFromThumb(
          node.thumbConnectors[1],
          animatePathFromThumb,
          (inputFromSecondRun: string | any[]) => {
            return;
          },
          input,
          pathExecution,
          node,
          loopIndex
        );
      }

      return {
        stop: true,
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
          // `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" class="scale-[2.5]" width="24" height="24" viewBox="0 0 24 24">
          // <title>call_split</title>
          // <path stroke="currentColor" fill="currentColor" d="M9.984 3.984l-2.297 2.297 5.297 5.297v8.438h-1.969v-7.594l-4.734-4.734-2.297 2.297v-6h6zM14.016 3.984h6v6l-2.297-2.297-2.906 2.906-1.406-1.406 2.906-2.906z"></path>
          // </svg>`

          `<svg class="scale-[2.5]" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
        <path  stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h4.597a5 5 0 0 1 3.904 1.877l.998 1.246A5 5 0 0 0 16.403 17H21m0 0-3-3m3 3-3 3m3-13h-5.078A4 4 0 0 0 12.8 8.501L11.201 10.5A4 4 0 0 1 8.078 12H6m15-5-3-3m3 3-3 3"/>
      </svg>`
        );
        const svgElement = createElementFromTemplate(template);
        htmlNode = createElement(
          'div',
          {
            class: 'icon icon-call_split text-white text-[32px]',
          },
          undefined,
          ''
        ) as unknown as INodeComponent<NodeInfo>;

        const wrapper = createElement(
          'div',
          {
            class: `inner-node bg-transparent 
          text-white flex items-center justify-center 
          rounded-lg 
          w-[100px] h-[110px] 
          overflow-hidden text-center`,
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
          110,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              maxConnections: 1,
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 1,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              maxConnections: 1,
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: ' ',
              maxConnections: 1,
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
