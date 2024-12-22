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
  IDOMElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNodeFromThumb } from '../flow-engine/flow-engine';

// interface ReadableStream<R = unknown> {
//   [Symbol.asyncIterator](): AsyncIterableIterator<R>;
// }

export const getFetch: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let loader: IDOMElement | undefined = undefined;

  function showLoader() {
    if (loader && loader.domElement) {
      (loader.domElement as HTMLElement).classList.remove('hidden');
    }
  }

  function hideLoader() {
    if (loader && loader.domElement) {
      (loader.domElement as HTMLElement).classList.add('hidden');
    }
  }

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
        return new Promise<void>((resolve) => {
          runNodeFromThumb(
            node.thumbConnectors![0],
            canvasAppInstance!,
            (_inputFromLoadingRun: string | any[]) => {
              resolve();
            },
            result,
            node,
            loopIndex,
            scopeId,
            runCounter
          );
        });
      }
      function sendEndStream() {
        return new Promise<void>((resolve) => {
          hideLoader();
          runNodeFromThumb(
            node.thumbConnectors![3],
            canvasAppInstance!,
            (_inputFromLoadingRun: string | any[]) => {
              resolve();
            },
            '',
            node,
            loopIndex,
            scopeId,
            runCounter
          );
        });
      }
      function sendFetchState(state: string) {
        runNodeFromThumb(
          node.thumbConnectors![2],
          canvasAppInstance!,
          (_inputFromLoadingRun: string | any[]) => {
            //
          },
          state,
          node,
          loopIndex,
          scopeId,
          runCounter
        );
      }
      function sendError(error: string) {
        hideLoader();
        runNodeFromThumb(
          node.thumbConnectors![1],
          canvasAppInstance!,
          (_inputFromErrorgRun: string | any[]) => {
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

        const openAIKey = canvasAppInstance?.isContextOnly
          ? process.env?.['openai_api_key'] ?? ''
          : canvasAppInstance?.getTempData('openai-key') ?? '';

        let url = node?.nodeInfo?.formValues?.['url'] ?? '';
        if (url.startsWith('/')) {
          url = canvasAppInstance?.getApiUrlRoot() + url.substring(1);
        }
        url = url.replace('[openai-key]', openAIKey);

        const responseType =
          node?.nodeInfo?.formValues?.['response-type'] ?? 'json';
        const httpMethod =
          node?.nodeInfo?.formValues?.['http-method'] ?? 'post';

        const headers = new Headers();
        const headersString = node?.nodeInfo?.formValues?.['headers'] ?? '';
        if (headersString) {
          const headersArray = headersString.split('\n');

          headersArray.forEach((header: string) => {
            const headerArray = header.split(':');
            if (headerArray.length === 2) {
              const value = headerArray[1].replace('[openai-key]', openAIKey);
              headers.append(headerArray[0], value);
            }
          });
        }
        if (responseType === 'json') {
          headers.append('Content-Type', 'application/json');
        }
        showLoader();
        fetch(url, {
          method: httpMethod,
          headers,
          body: httpMethod === 'get' ? undefined : JSON.stringify(input),
          mode: 'cors',
        })
          .then(async (response) => {
            const contentType = response.headers.get('content-type');

            if (
              response.body instanceof ReadableStream &&
              responseType !== 'text' &&
              contentType &&
              (contentType.includes('application/stream+json') ||
                contentType.includes('text/event-stream'))
            ) {
              const reader = response.body.getReader();
              let isFullJson = false;
              const readChunk = () => {
                // Read a chunk from the reader
                reader
                  .read()
                  .then(({ value, done }) => {
                    if (done) {
                      if (!isFullJson) {
                        sendEndStream().then(() => {
                          resolve({
                            result: false,
                            followPath: undefined,
                            stop: true,
                            dummyEndpoint: true,
                          });
                        });
                      }

                      return;
                    }
                    // Convert the chunk value to a string
                    const chunkString = new TextDecoder().decode(value);

                    // chunkstring can contain multiple eventstream messages
                    // .. use for .. of with await (create promises for each chunk part and await them)

                    console.log('chunkString', chunkString.split('\n\n'));
                    //const chunks = chunkString.split('\n\n');
                    //if (chunkString.endsWith('}\n')) {
                    try {
                      const json = JSON.parse(chunkString);
                      isFullJson = true;
                      hideLoader();
                      sendFetchResult(json).then(() => {
                        resolve({
                          result: false,
                          followPath: undefined,
                          stop: true,
                          dummyEndpoint: true,
                        });
                      });
                    } catch (error) {
                      isFullJson = false;
                    }
                    //}

                    if (!isFullJson) {
                      const lines = chunkString
                        .split('\n')
                        .map((line) => line.replace('data: ', ''))
                        .filter((line) => line.length > 0)
                        .filter((line) => line !== '[DONE]')
                        .map((line) => JSON.parse(line));
                      if (lines.length > 0) {
                        console.log('lines', lines);
                        sendFetchResult(lines).then(() => {
                          readChunk();
                        });
                      }
                    }
                  })
                  .catch((error) => {
                    // TODO : show this error in the UI
                    console.error(error);
                    if (
                      (errorNode?.domElement as unknown as HTMLElement) &&
                      !canvasAppInstance?.isContextOnly
                    ) {
                      (
                        errorNode?.domElement as unknown as HTMLElement
                      )?.classList.remove('hidden');
                      (
                        errorNode.domElement as unknown as HTMLElement
                      ).textContent = error?.toString() ?? 'Error';
                    }
                    sendError(error?.toString() ?? 'Error');
                  });
              };

              readChunk();
            } else if (
              responseType === 'json' &&
              contentType &&
              contentType.includes('application/json')
            ) {
              response.json().then((json) => {
                sendFetchState('ready');
                result = json;
                hideLoader();
                sendFetchResult(result).then(() => {
                  resolve({
                    result: false,
                    followPath: undefined,
                    stop: true,
                    dummyEndpoint: true,
                  });
                });
              });
            } else {
              response.text().then((text) => {
                sendFetchState('ready');
                result = text;
                hideLoader();
                sendFetchResult(result).then(() => {
                  resolve({
                    result: false,
                    followPath: undefined,
                    stop: true,
                    dummyEndpoint: true,
                  });
                });
              });
            }
          })
          .catch((error) => {
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
      containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number
    ) => {
      const url = initalValues?.['url'] ?? '';

      canvasAppInstance = canvasApp;
      const label = initalValues?.['label'] ?? '';
      let text = label;
      if (label) {
        text = `\n${label}`;
      }

      const thumbPortColor = 'white';
      const thumbLabelPortCssClass = 'text-black';
      const jsxComponentWrapper = createElement(
        'div',
        {
          class: `inner-node rounded p-4
                  bg-green-500  text-black 
                  font-bold
                  flex flex-col justify-center items-center justify-start`,
        },
        undefined,
        `Fetch ${text}`.trim()
      ) as unknown as INodeComponent<NodeInfo>;
      const loaderWrapper = createElement(
        'div',
        {
          class: `w-full flex justify-center `,
        },
        jsxComponentWrapper?.domElement
      );
      loader = createElement(
        'div',
        {
          class: `simple-loader hidden text-black mt-2`,
        },
        loaderWrapper?.domElement
      );
      const rect = canvasApp.createRect(
        x,
        y,
        width ?? 200,
        height ?? 200,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: thumbPortColor,
            prefixLabelCssClass: thumbLabelPortCssClass,
            label: '',
            prefixLabel: 'data',
            name: 'output',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            color: thumbPortColor,
            prefixLabelCssClass: thumbLabelPortCssClass,
            label: '',
            name: 'error',
            prefixLabel: 'error',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 2,
            connectionType: ThumbConnectionType.start,
            color: thumbPortColor,
            prefixLabelCssClass: thumbLabelPortCssClass,
            label: '',
            name: 'state',
            prefixLabel: 'state',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 3,
            connectionType: ThumbConnectionType.start,
            color: thumbPortColor,
            prefixLabelCssClass: thumbLabelPortCssClass,
            label: '',
            name: 'end',
            prefixLabel: 'end stream',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: thumbPortColor,
            prefixLabelCssClass: thumbLabelPortCssClass,
            label: '',
            //thumbConstraint: 'value',
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
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
            class: `bg-red-500 p-4 rounded absolute bottom-[calc(100%+8px)] h-[min-content] w-full hidden
            after:content-['']
            after:w-0 after:h-0 
            after:border-l-[10px] after:border-l-transparent
            after:border-t-[10px] after:border-t-red-500
            after:border-r-[10px] after:border-r-transparent
            after:absolute after:bottom-[-8px] after:left-[50%] after:transform after:translate-x-[-50%]
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
          {
            fieldType: FormFieldType.Text,
            fieldName: 'label',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                label: value,
              };
              if (jsxComponentWrapper.domElement) {
                let text = value;
                if (value) {
                  text = `\n${value}`;
                }
                jsxComponentWrapper.domElement.textContent =
                  `Fetch ${text}`.trim();
              }
              if (updated) {
                updated();
              }
            },
          },
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
              if (updated) {
                updated();
              }
            },
          },
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
          {
            fieldType: FormFieldType.TextArea,
            fieldName: 'headers',
            label: 'Headers',
            value: initalValues?.['headers'] ?? '',
            onChange: (value: string) => {
              if (!node || !node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['headers']: value,
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
