import {
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import {
  compileExpression,
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';

export const getFetch = (updated?: () => void) => {
  let node: INodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;

  let currentValue = 0;
  const initializeCompute = () => {
    currentValue = 0;
    return;
  };
  const computeAsync = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number
  ) => {
    return new Promise((resolve, reject) => {
      (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
      let result: any = false;
      try {
        const url = node.nodeInfo.formValues?.['url'] ?? '';
        fetch(url)
          .then((response) => {
            console.log('response', response);
            response.json().then((json) => {
              console.log('json', json);
              result = json;
              resolve({
                result: true,
                output: result,
                followPath: undefined,
              });
            });
          })
          .catch((error) => {
            console.log('error', error);
            result = undefined;
            (errorNode.domElement as unknown as HTMLElement).classList.remove(
              'hidden'
            );
            (errorNode.domElement as unknown as HTMLElement).textContent =
              error?.toString() ?? 'Error';
            console.log('expression error', error);
            resolve({
              result,
              followPath: undefined,
            });
          });

        //
      } catch (error) {
        result = undefined;
        (errorNode.domElement as unknown as HTMLElement).classList.remove(
          'hidden'
        );
        (errorNode.domElement as unknown as HTMLElement).textContent =
          error?.toString() ?? 'Error';
        console.log('expression error', error);
      }
      // if (result) {
      //   currentValue = result;
      // }
      // resolve({
      //   result,
      //   followPath: undefined,
      // });
    });
  };

  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      url?: string
    ) => {
      console.log('createVisualNode createNamedSignal', url, id);
      //createNamedSignal(id + '_' + 'Expression', expression ?? '');

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'url',
          value: url ?? '',
          onChange: (value: string) => {
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              url: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];

      const jsxComponentWrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        FormComponent({
          id: id ?? '',
          formElements,
          hasSubmitButton: false,
          onSave: (formValues) => {
            console.log('onSave', formValues);
          },
        }) as unknown as HTMLElement
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
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'purple',
            label: '{}',
            thumbConstraint: 'object',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          type: 'fetch',
          formValues: {
            url: url ?? '',
          },
        }
      );
      rect.nodeComponent.nodeInfo.formElements = formElements;
      errorNode = createElement(
        'div',
        {
          class: `bg-red-500 p-4 rounded absolute bottom-[calc(100%+15px)] h-[100px] w-full hidden
            after:content-['']
            after:w-0 after:h-0 
            after:border-l-[10px] after:border-l-transparent
            after:border-t-[10px] after:border-t-red-500
            after:border-r-[10px] after:border-r-transparent
            after:absolute after:bottom-[-10px] after:left-[50%] after:transform after:translate-x-[-50%]
          `,
        },
        rect.nodeComponent.domElement,
        'error'
      ) as unknown as INodeComponent<NodeInfo>;

      //createNamedSignal(`expression${rect.nodeComponent.id}`, '');
      node = rect.nodeComponent;
      node.nodeInfo.computeAsync = computeAsync;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
