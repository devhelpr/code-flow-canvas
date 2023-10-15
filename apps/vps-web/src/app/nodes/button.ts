import {
  CanvasAppInstance,
  createElement,
  IElementNode,
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
import {
  runNode,
  RunNodeResult,
} from '../simple-flow-engine/simple-flow-engine';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { FormFieldType } from '../components/form-component';

export const getButton =
  (animatePath: AnimatePathFunction<NodeInfo>) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let button: IElementNode<NodeInfo>;
    let currentValue = 0;
    let triggerButton = false;
    const initializeCompute = () => {
      currentValue = 0;
      return;
    };
    const compute = (input: string) => {
      try {
        currentValue = parseFloat(input) || 0;
      } catch {
        currentValue = 0;
      }
      if (triggerButton && node.nodeInfo) {
        triggerButton = false;
        return {
          result: node.nodeInfo.formValues['caption'] || 'Button',
        };
        // return {
        //   result: currentValue,
        // };
      }
      return {
        result: false,
        stop: true,
      };
    };

    return {
      name: 'button',
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
        const initialValue = initalValues?.['caption'] || 'Button';

        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'caption',
            value: initialValue,
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                caption: value,
              };
              button.domElement.textContent =
                node.nodeInfo.formValues['caption'] || 'Button';
              console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
        ];

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-sky-900 p-4 rounded`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        button = createElement(
          'button',
          {
            class: `bg-sky-600 hover:bg-sky-500 w-full p-2 text-center block text-white font-bold rounded`,
            click: (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!node.nodeInfo) {
                return;
              }
              triggerButton = true;
              runNode<NodeInfo>(
                containerNode ?? node,
                containerNode
                  ? (containerNode.nodeInfo as any)?.canvasAppInstance
                  : canvasApp,
                animatePath,
                undefined,
                containerNode
                  ? node.nodeInfo.formValues['caption'] || 'Button'
                  : currentValue.toString(),
                []
              );
              return false;
            },
          },
          componentWrapper.domElement
        );
        button.domElement.textContent = initialValue ?? 'Button';
        const rect = canvasApp.createRect(
          x,
          y,
          200,
          100,
          undefined,

          containerNode
            ? []
            : [
                {
                  thumbType: ThumbType.StartConnectorCenter,
                  thumbIndex: 0,
                  connectionType: ThumbConnectionType.start,
                  color: 'white',
                  label: '',
                  //thumbConstraint: 'value',
                },
                {
                  thumbType: ThumbType.EndConnectorCenter,
                  thumbIndex: 0,
                  connectionType: ThumbConnectionType.end,
                  color: 'white',
                  label: ' ',
                  //thumbConstraint: 'value',
                },
              ],
          componentWrapper,
          {
            classNames: `bg-sky-900 p-4 rounded`,
          },
          undefined,
          undefined,
          undefined,
          id,
          {
            type: 'button',
            formValues: {
              caption: initialValue || 'Button',
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;
        if (node.nodeInfo) {
          node.nodeInfo.formElements = formElements;
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;
        }
        return node;
      },
    };
  };
