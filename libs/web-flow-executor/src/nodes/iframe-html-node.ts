import {
  IFlowCanvasBase,
  createElement,
  createNodeElement,
  FormFieldType,
  IDOMElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { compileExpressionAsInfo } from '@devhelpr/expression-compiler';
import { createStructuredExpressionsMarkup } from '../utils/replace-expression-script';

function traverseDOMTree(node: Node, compileExpressionAsInfoFunction: any) {
  const childNodes = node.childNodes;
  //console.log('traverseDOMTree', childNodes);
  for (let i = 0; i < childNodes.length; i++) {
    const childNode = childNodes[i];
    if (childNode.textContent) {
      const matches = childNode.textContent.match(/{{[\s\S]+?}}/gm);
      if (matches) {
        matches.forEach((match) => {
          const info = compileExpressionAsInfo(match.slice(2, -2));
          const expressionFunction = (
            new Function('payload', `${info.script}`) as unknown as (
              payload?: object
            ) => any
          ).bind(info.bindings);
          try {
            expressionFunction({});
            //const result = expressionFunction({});
            //console.log('result', result);
            //
          } catch (error) {
            console.error('replaceExpressionScript error', error);
          }
        });
      }
    } else {
      traverseDOMTree(childNode, compileExpressionAsInfoFunction);
    }
  }
}

export const getIFrameHtmlNode = (updated: () => void): NodeTask<NodeInfo> => {
  let currentInput = '';
  let node: IRectNodeComponent<NodeInfo>;
  let divNode: IDOMElement | undefined = undefined;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let variables: Record<string, string> = {};
  let oldHtml = '';

  const defaultHTML = `<div class="bg-sky-800 text-white 
    flex items-center justify-center
    min-w-full min-h-full">Click to edit HTML</div>`;

  const setHTML = (value: string) => {
    if (!divNode?.domElement) {
      return;
    }
    try {
      const splitted = (value ?? '').toString().split(':');
      if (splitted.length === 2) {
        variables[splitted[0]] = splitted[1] || '';
      } else {
        variables['value'] = value;
      }

      let iframeWasCreated = false;

      const isEmpty = !node?.nodeInfo?.formValues['html'];

      let htmlString = `${node?.nodeInfo?.formValues['html'] || defaultHTML}`;
      const hasHTMLDoctype = htmlString.indexOf('<!DOCTYPE html>') > -1;

      if (oldHtml === '' || oldHtml !== htmlString) {
        oldHtml = htmlString;
        //console.log('htmlString', htmlString);
        if (!divNode) {
          return;
        }
        if (isEmpty || !hasHTMLDoctype) {
          (divNode.domElement as HTMLElement).innerHTML = `${htmlString}`;
        } else {
          (divNode.domElement as HTMLElement).innerHTML = '';
          createStructuredExpressionsMarkup(htmlString);
          htmlString = `${htmlString}
            <script>
              window['createElement'] = window.parent['createElement'];
              window['sendOutput'] = window.parent['sendOutput'];
              window["input"] = window["input"] || [];
              window.addEventListener('message', (event) => {  
                window['createElement'] = window.parent['createElement'];
                window['sendOutput'] = window.parent['sendOutput'];

                //console.log('Received message:', event.data, window.parent["createStructuredExpressionsMarkup"]);
                const html = document.body.innerHTML;
                const expressions = window.parent["createStructuredExpressionsMarkup"](html);
                //console.log('expressions', expressions);
                //console.log('html', expressions.markup);

                const traverseDOMTree = window.parent['traverseDOMTree'];
                const compileExpressionAsInfo = window.parent['compileExpressionAsInfo'];
                //console.log('traverseDOMTree', traverseDOMTree);
                traverseDOMTree(document.body,compileExpressionAsInfo);

                const value = JSON.parse(event.data);
                window["input"] = value;


                const onExecute = window["onExecute"];
                //console.log('onExecute', onExecute, value, window["input"] );
                if (onExecute) {
                 
                  //console.log('onExecute is defined', event.data);
                  onExecute(value);
                } else {
                  //console.log('onExecute is undefined');
                }
              });            

            </script>            
            `;
          createElement(
            'iframe',
            {
              srcdoc: `${htmlString}`,
              id: `iframe${node.id}`,
              class: 'w-full h-full bg-white',
            },
            divNode.domElement as HTMLElement
          );
          iframeWasCreated = true;
        }
      }

      const iframe = document.getElementById(
        `iframe${node.id}`
      ) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        (window as any)['createStructuredExpressionsMarkup'] =
          createStructuredExpressionsMarkup;

        (window as any)['traverseDOMTree'] = traverseDOMTree;
        (window as any)['compileExpressionAsInfo'] = compileExpressionAsInfo;
        (window as any)['createElement'] = createElement;
        (window as any)['sendOutput'] = (value: any) => {
          window.parent.postMessage(
            {
              type: 'output',
              iframeNodeId: node.id,
              message: value,
            },
            '*'
          );
        };

        // can't send structured data which contains code...
        const data = JSON.stringify(value);
        //console.log('setHTML', data);

        if (iframeWasCreated) {
          setTimeout(() => {
            //console.log('postMessage', data);
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(data);
            }
          }, 10);
        } else {
          iframe.contentWindow.postMessage(data);
        }
      }

      if (rect) {
        rect.resize();
      }
    } catch (error) {
      console.log('setHTML error', error);
    }
  };

  const initializeCompute = () => {
    currentInput = '';
    variables = {};
    setHTML(currentInput);
  };

  const compute = (input: string) => {
    currentInput = input;
    setHTML(input);

    return {
      result: input,
    };
  };

  const getNodeStatedHandler = () => {
    return {
      data: structuredClone(currentInput),
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    setHTML(data);
  };

  const updateVisual = (data: any) => {
    setHTML(data);
  };

  return {
    name: 'iframe-html-node',
    family: 'flow-canvas',
    isContainer: false,
    category: 'html',
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
      const initialValue = initalValues?.['html'] || defaultHTML;
      const aiPrompt = initalValues?.['aiprompt'] || '';
      //console.log('iframe', width, height);
      const formElements = [
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'html',
          value: initialValue,
          isCodeEditor: false, //true,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            //console.log('html-node onchange', value);
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              html: value,
            };
            //console.log('onChange', node.nodeInfo);
            if (updated) {
              setHTML(currentInput);
              updated();
            }
          },
        },

        // {
        //   fieldType: FormFieldType.TextArea,
        //   fieldName: 'aiprompt',
        //   label: 'AI Prompt to generate HTML',
        //   value: aiPrompt,

        //   onChange: (value: string) => {
        //     if (!node.nodeInfo) {
        //       return;
        //     }

        //     aiPrompt = value;
        //     node.nodeInfo.formValues = {
        //       ...node.nodeInfo.formValues,
        //       aiprompt: value,
        //     };

        //     if (updated) {
        //       updated();
        //     }
        //   },
        // },
        // {
        //   fieldType: FormFieldType.Button,
        //   fieldName: 'execute',
        //   caption: 'Get HTML from AI',
        //   onButtonClick: (formContext: FormContext) => {
        //     return new Promise<void>((resolve, _reject) => {
        //       fetch('http://localhost:3000/create-ui', {
        //         method: 'POST',
        //         headers: {
        //           'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //           message: aiPrompt,
        //         }),
        //       }).then((response) => {
        //         //console.log('response', response);
        //         response.json().then((json) => {
        //           if (!node.nodeInfo) {
        //             resolve();
        //             return;
        //           }
        //           //console.log('json', json);
        //           const html = json.message;
        //           node.nodeInfo.formValues = {
        //             ...node.nodeInfo.formValues,
        //             html: html,
        //           };
        //           //console.log('currentinput after prompting', currentInput);

        //           if (updated) {
        //             updated();
        //           }
        //           formContext.setFormFieldValue('html', html);
        //           setTimeout(() => {
        //             setHTML(currentInput);
        //           }, 0);
        //           resolve();
        //         });
        //       });
        //     });
        //   },
        // },
      ];

      const componentWrapper = createNodeElement(
        'div',
        {
          id: id ?? '',
          class: `inner-node rounded min-h-[100px] overflow-hidden`,
          style: {
            'clip-path': 'polygon(100% 0, 100% 100%, 0% 100%, 0 0%',
          },
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;
      createElement(
        'div',
        { class: 'flex items-center bg-slate-600 text-white p-1 px-3' },
        componentWrapper?.domElement,
        'HTML Node'
      );
      divNode = createElement(
        'div',
        {
          class: 'w-full h-[calc(100%-32px)]',
        },
        componentWrapper?.domElement
      );
      rect = canvasApp.createRect(
        x,
        y,
        width ?? 400,
        height ?? 400,
        undefined,
        [
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            maxConnections: -1,
          },
        ],
        componentWrapper,
        {
          classNames: `bg-sky-900 p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          type: 'iframe-html-node',
          formValues: {
            html: initialValue || defaultHTML,
            aiprompt: aiPrompt,
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      const messageHandler = function (event: MessageEvent) {
        if (
          event.data &&
          event.data.type === 'output' &&
          event.data.iframeNodeId === node.id
        ) {
          console.log('Message received from iframe: ', event.data.message); // Message received from child
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('message', messageHandler);
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.compute = compute;
        node.nodeInfo.showFormOnlyInPopup = true;
        node.nodeInfo.updateVisual = updateVisual;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.initializeOnStartFlow = true;
        node.nodeInfo.delete = () => {
          if (typeof window !== 'undefined') {
            window.removeEventListener('message', messageHandler);
          }
        };

        node.nodeInfo.formValues = {
          html: initialValue || defaultHTML,
          aiprompt: aiPrompt,
        };

        node.nodeInfo.meta = [
          {
            getDescription: () => {
              return `Last input data`;
            },

            type: 'info',
          },

          {
            propertyName: 'input',
            displayName: 'Last input',
            type: 'any',

            getData: () => {
              try {
                return currentInput
                  ? typeof currentInput === 'string'
                    ? JSON.parse(currentInput)
                    : currentInput
                  : { message: 'No input data available' };
              } catch (_error) {
                return currentInput;
              }
            },
          },
        ];
      }
      setHTML(currentInput);

      if (id) {
        canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
        canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
      }

      return node;
    },
  };
};
