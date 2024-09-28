import {
  IFlowCanvasBase,
  createElement,
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
import { RunCounter } from '../follow-path/run-counter';
import { runNodeFromThumb } from '../flow-engine/flow-engine';

export const getFetch: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const computeAsync = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => {
    return new Promise((resolve, reject) => {
      function sendFetchResult(result: any) {
        runNodeFromThumb(
          node.thumbConnectors![0],
          canvasAppInstance!,
          (inputFromLoadingRun: string | any[]) => {
            console.log('Fetch inputFromLoadingRun', inputFromLoadingRun);
            resolve({
              result: false,
              followPath: undefined,
              stop: true,
              dummyEndpoint: true,
            });
          },
          result,
          node,
          loopIndex,
          scopeId,
          runCounter
        );
      }
      function sendFetchState(state: string) {
        runNodeFromThumb(
          node.thumbConnectors![2],
          canvasAppInstance!,
          (inputFromLoadingRun: string | any[]) => {
            console.log('Fetch inputFromLoadingRun', inputFromLoadingRun);
          },
          state,
          node,
          loopIndex,
          scopeId,
          runCounter
        );
      }
      function sendError(error: string) {
        runNodeFromThumb(
          node.thumbConnectors![1],
          canvasAppInstance!,
          (inputFromErrorgRun: string | any[]) => {
            console.log('Fetch inputFromErrorgRun', inputFromErrorgRun);
            resolve({
              result: false,
              followPath: undefined,
              stop: true,
              dummyEndpoint: true,
            });
          },
          error,
          node,
          loopIndex,
          scopeId,
          runCounter
        );
      }

      if (!canvasAppInstance?.isContextOnly) {
        (errorNode?.domElement as unknown as HTMLElement)?.classList.add(
          'hidden'
        );
      }
      let result: any = false;
      if (!node || !canvasAppInstance) {
        reject();
        return;
      }

      try {
        sendFetchState('fetching');

        let url = node?.nodeInfo?.formValues?.['url'] ?? '';
        if (url.startsWith('/')) {
          url = canvasAppInstance?.getApiUrlRoot() + url.substring(1);
        }
        const responseType =
          node?.nodeInfo?.formValues?.['response-type'] ?? 'json';
        const httpMethod =
          node?.nodeInfo?.formValues?.['http-method'] ?? 'post';

        const headers = new Headers();
        if (responseType === 'json') {
          headers.append('Content-Type', 'application/json');
        }
        fetch(url, {
          method: httpMethod,
          headers,
          body: httpMethod === 'get' ? undefined : JSON.stringify(input),
        })
          .then((response) => {
            if (responseType === 'json') {
              response.json().then((json) => {
                sendFetchState('ready');
                result = json;
                sendFetchResult(result);
              });
            } else {
              response.text().then((text) => {
                sendFetchState('ready');
                result = text;
                sendFetchResult(result);
              });
            }
          })
          .catch((error) => {
            console.log('error', error);
            sendFetchState('error');
            result = undefined;
            if (
              (errorNode?.domElement as unknown as HTMLElement) &&
              !canvasAppInstance?.isContextOnly
            ) {
              (
                errorNode?.domElement as unknown as HTMLElement
              )?.classList.remove('hidden');
              (errorNode.domElement as unknown as HTMLElement).textContent =
                error?.toString() ?? 'Error';
            }
            sendError(error?.toString() ?? 'Error');
          });

        //
      } catch (error) {
        result = undefined;
        sendFetchState('ready');
        if (
          (errorNode?.domElement as unknown as HTMLElement) &&
          !canvasAppInstance.isContextOnly
        ) {
          (errorNode.domElement as unknown as HTMLElement).classList.remove(
            'hidden'
          );
          (errorNode.domElement as unknown as HTMLElement).textContent =
            error?.toString() ?? 'Error';
        }
        sendError(error?.toString() ?? 'Error');
      }
    });
  };

  return {
    name: 'fetch',
    family: 'flow-canvas',
    category: 'connectivity',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const url = initalValues?.['url'] ?? '';
      console.log('createVisualNode createNamedSignal', url, id);
      //createNamedSignal(id + '_' + 'Expression', expression ?? '');
      canvasAppInstance = canvasApp;
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
          class: `inner-node bg-slate-500 p-4 rounded text-white flex flex-col items-center justify-start`,
        },
        undefined,
        'Fetch'
      ) as unknown as INodeComponent<NodeInfo>;

      // FormComponent({
      //   rootElement: jsxComponentWrapper.domElement as HTMLElement,
      //   id: id ?? '',
      //   formElements,
      //   hasSubmitButton: false,
      //   onSave: (formValues) => {
      //     console.log('onSave', formValues);
      //   },
      // }) as unknown as HTMLElement;

      const rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: '',
            name: 'output',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: '',
            name: 'error',
            prefixLabel: 'error',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 2,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: '',
            name: 'state',
            prefixLabel: 'state',
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
            ...initalValues,
            url: url ?? '',
          },
        },
        containerNode
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      if (rect.nodeComponent.domElement && !canvasApp.isContextOnly) {
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
      }

      //createNamedSignal(`expression${rect.nodeComponent.id}`, '');
      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [
          ...formElements,
          {
            fieldType: FormFieldType.Select,
            fieldName: 'http-method',
            label: 'HTTP Method',
            value: initalValues?.['http-method'] ?? 'post',
            options: [
              { label: 'get', value: 'get' },
              { label: 'post', value: 'post' },
              { label: 'put', value: 'put' },
              { label: 'delete', value: 'delete' },
              { label: 'patch', value: 'patch' },
            ],
            onChange: (value: string) => {
              if (!node || !node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['http-method']: value,
              };
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Select,
            fieldName: 'response-type',
            label: 'Response type',
            value: initalValues?.['response-type'] ?? 'json',
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'text', value: 'Text' },
              { label: 'binary', value: 'Binary' },
            ],
            onChange: (value: string) => {
              if (!node || !node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['response-type']: value,
              };
              if (updated) {
                updated();
              }
            },
          },
        ];
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.isSettingsPopup = true;
      }
      return node;
    },
  };
};
