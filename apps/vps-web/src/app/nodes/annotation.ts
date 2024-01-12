import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { AnimatePathFunction } from '../follow-path/animate-path';

export const getAnnotation =
  (_animatePath: AnimatePathFunction) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    const initializeCompute = () => {
      return;
    };
    const compute = () => {
      return {
        result: true,
      };
    };

    return {
      name: 'annotation',
      family: 'flow-canvas',
      isContainer: false,
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        const componentWrapper = createElement(
          'div',
          {
            class: `relative
              before:content-[''] before:block
              before:w-[16px] before:h-[16px]
              before:bg-white
              before:absolute
              before:left-[-24px]`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        const textArea = createElement(
          'textarea',
          {
            type: 'annotation',
            class: `relative block text-white bg-transparent h-auto `,
            change: (event) => {
              if (!node?.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues['text'] = (
                event.target as HTMLInputElement
              ).value;
              rect.resize(240);
              updated();
            },
          },
          componentWrapper.domElement
        );
        textArea.domElement.textContent = initalValues?.['text'] || 'TEXT';

        const rect = canvasApp.createRect(
          x,
          y,
          240,
          100,
          undefined,
          [],
          componentWrapper,
          {
            classNames: `p-4 bg-transparent `,
          },
          false,
          undefined,
          undefined,
          id,
          {
            type: 'annotation',
            formValues: {
              text: initalValues?.['text'] || 'TEXT',
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;
        if (node.nodeInfo) {
          node.nodeInfo.formElements = [];
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;
        }
        return node;
      },
    };
  };
