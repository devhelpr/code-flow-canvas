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
import { InitialValues, NodeTask } from '../node-task-registry';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { FormFieldType } from '../components/form-component';

export const getFunction =
  (animatePath: AnimatePathFunction<NodeInfo>) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let divElement: IElementNode<NodeInfo>;
    let parametersContainer: IElementNode<NodeInfo>;
    const initializeCompute = () => {
      return;
    };
    const compute = (input: string) => {
      if (!node?.nodeInfo?.formValues?.['node']) {
        return {
          result: false,
          stop: true,
        };
      }
      const parameters: string =
        node?.nodeInfo?.formValues?.['parameters'] ?? '';
      const parametersArray = parameters ? parameters.split(',') : [];
      const inputObject = input as any;
      let isError = false;
      if (inputObject && inputObject.trigger === 'TRIGGER') {
        const payload: Record<string, any> = {};

        parametersArray.forEach((parameter) => {
          if (!inputObject[parameter]) {
            isError = true;
          }
          payload[parameter] = inputObject[parameter];
        });
        if (isError) {
          return {
            result: false,
            stop: true,
          };
        }
        return {
          result: { ...payload },
        };
      }
      return {
        result: false,
        stop: true,
      };
    };

    const showParameters = () => {
      (parametersContainer.domElement as HTMLElement).innerHTML = '';

      const parameters: string[] = (
        node?.nodeInfo?.formValues?.['parameters'] ?? ''
      ).split(',');

      parameters.forEach((parameter, index) => {
        const parameterElement = createElement(
          'span',
          {
            'data-index': index,
            class: `outline-[4px] max-w-[40px] text-ellipsis overflow-hidden inline-block px-0.5 leading-5 bg-slate-500 border border-slate-600 rounded text-white`,
            title: parameter,
          },
          undefined,
          parameter.toString()
        ) as unknown as INodeComponent<NodeInfo>;

        if (parametersContainer) {
          parametersContainer.domElement.appendChild(
            parameterElement.domElement as unknown as HTMLElement
          );
        }
      });
    };

    return {
      name: 'function',
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
        const initialValue = initalValues?.['node'] || '';
        const intialParameters = initalValues?.['parameters'] || '';
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'node',
            value: initialValue,
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                node: value,
              };
              divElement.domElement.textContent =
                node.nodeInfo.formValues['node'] || '';

              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'parameters',
            value: initialValue,
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                parameters: value,
              };

              showParameters();

              if (updated) {
                updated();
              }
            },
          },
        ];

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-sky-900 p-4 rounded flex flex-row justify-center items-center`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        divElement = createElement(
          'div',
          {
            class: `text-center block text-white font-bold`,
          },
          componentWrapper.domElement
        );

        divElement.domElement.textContent = initialValue || '';
        parametersContainer = createElement(
          'div',
          {
            class: `absolute -top-3 left-0`,
          },
          componentWrapper.domElement
        );

        const rect = canvasApp.createRect(
          x,
          y,
          100,
          100,
          undefined,

          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
            },
          ],
          componentWrapper,
          {
            classNames: `bg-sky-900 py-4 px-2 rounded`,
          },
          false,
          undefined,
          undefined,
          id,
          {
            type: 'function',
            formValues: {
              node: initialValue || '',
              parameters: intialParameters || '',
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
        showParameters();

        return node;
      },
    };
  };
