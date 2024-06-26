import {
  CanvasAppInstance,
  createElement,
  FormComponent,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getFetch: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const computeAsync = (input: string, _loopIndex?: number) => {
    return new Promise((resolve, _reject) => {
      (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
      let result: any = false;
      try {
        const url = node?.nodeInfo?.formValues?.['url'] ?? '';
        fetch(url, {
          method: 'POST',
          body: JSON.stringify(input),
        })
          .then((response) => {
            console.log('response', response);
            response.json().then((json) => {
              console.log('json', json);
              result = json;
              resolve({
                result: result,
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
              stop: true,
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
        resolve({
          result,
          followPath: undefined,
          stop: true,
        });
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
    name: 'fetch',
    family: 'flow-canvas',
    category: 'connectivity',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const url = initalValues?.['url'] ?? '';
      console.log('createVisualNode createNamedSignal', url, id);
      //createNamedSignal(id + '_' + 'Expression', expression ?? '');

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'url',
          value: url ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
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
          class: `inner-node bg-slate-500 p-4 rounded`,
        },
        undefined,
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      FormComponent({
        rootElement: jsxComponentWrapper.domElement as HTMLElement,
        id: id ?? '',
        formElements,
        hasSubmitButton: false,
        onSave: (formValues) => {
          console.log('onSave', formValues);
        },
      }) as unknown as HTMLElement;

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
            label: '{}',
            thumbConstraint: 'object',
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
        },
        containerNode
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

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
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
