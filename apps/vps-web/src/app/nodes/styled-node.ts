import {
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { FormFieldType } from '../components/form-component';

export const getStyledNode =
  (animatePath: AnimatePathFunction<NodeInfo>) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let divNode: IElementNode<NodeInfo>;
    let currentValue = 0;
    const defaultStyling = `{
      display:"block"
    }`;
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
      Object.assign(
        (divNode.domElement as HTMLElement).style,
        JSON.parse(node.nodeInfo.formValues['styling'] || defaultStyling)
      );

      return {
        result: input,
        stop: true,
      };
    };

    return {
      name: 'styled-node',
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
        const initialValue = initalValues?.['styling'] || defaultStyling;

        const formElements = [
          {
            fieldType: FormFieldType.TextArea,
            fieldName: 'styling',
            value: initialValue,
            onChange: (value: string) => {
              console.log('styling-node onchange', value);
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                styling: value,
              };
              console.log('onChange', node.nodeInfo);
              if (updated) {
                Object.assign(
                  (divNode.domElement as HTMLElement).style,
                  JSON.parse(
                    node.nodeInfo.formValues['styling'] || defaultStyling
                  )
                );
                updated();
              }
            },
          },
        ];

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-sky-900 rounded min-h-[100px]`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        divNode = createElement(
          'div',
          {
            //class: `bg-sky-600 hover:bg-sky-500 w-full p-2 text-center block text-white font-bold rounded`,
          },
          componentWrapper.domElement
        );
        //button.domElement.textContent = initialValue ?? 'Button';
        const rect = canvasApp.createRect(
          x,
          y,
          200,
          100,
          undefined,
          [
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
            type: 'styled-node',
            formValues: {
              styling: initialValue || '{display:"block"}',
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }
        rect.nodeComponent.nodeInfo.formElements = formElements;

        node = rect.nodeComponent;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        return node;
      },
    };
  };
