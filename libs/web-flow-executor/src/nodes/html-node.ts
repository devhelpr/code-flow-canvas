import {
  IFlowCanvasBase,
  createASTNodeElement,
  createElement,
  createNodeElement,
  FormFieldType,
  IElementNode,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { compileMarkup } from '@devhelpr/markup-compiler';
import { createStructuredExpressionsMarkup } from '../utils/replace-expression-script';

/*
  example HTML:

  <div class="bg-sky-800 text-white 
    flex items-center justify-center
    min-w-[200px] min-h-[200px]"
style="background:{{input}}"
>{{input}}</div>

*/

export const getHtmlNode = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divNode: IElementNode<NodeInfo> | undefined = undefined;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let variables: Record<string, string> = {};
  let astElement: IElementNode<NodeInfo> | undefined = undefined;
  let structuredMarkup:
    | {
        expressions: Record<string, object>;
        markup: string;
      }
    | undefined = undefined;
  const defaultHTML = `<div class="bg-sky-800 text-white 
    flex items-center justify-center
    min-w-[200px] min-h-[200px]">Click to edit HTML</div>`;
  // const parseBody = (
  //   body: IASTTreeNode,
  //   expressions: Record<string, object>
  // ) => {
  //   body.body?.forEach((childASTNode) => {
  //     if (childASTNode.type === 'Markup') {
  //       parseBody(childASTNode, expressions);
  //     } else if (childASTNode.type === 'TEXT') {
  //       const matches = (childASTNode.value ?? '')
  //         .toString()
  //         .match(/\[[\s\S]+?\]/gm);
  //       if (matches) {
  //         matches.map((match) => {
  //           const expressionId = match.slice(1, -1);
  //           const expression = expressions[expressionId] as any;
  //           if (expression) {
  //             expression.value = childASTNode.value ?? '';
  //             expression.isTextNode = true;
  //             expression.textNode = childASTNode;
  //           }
  //         });
  //       }
  //     }
  //   });
  //   body.properties?.forEach((propertyKeyValue) => {
  //     const matches = propertyKeyValue.value.toString().match(/\[[\s\S]+?\]/gm);
  //     if (matches) {
  //       matches.map((match) => {
  //         const expressionId = match.slice(1, -1);
  //         const expression = expressions[expressionId] as any;
  //         if (expression) {
  //           expression.value = propertyKeyValue.value;
  //           expression.isProperty = true;
  //           expression.propertyNode = propertyKeyValue;
  //         }
  //       });
  //     }
  //   });
  // };
  const setHTML = (value: string) => {
    try {
      const splitted = (value ?? '').toString().split(':');
      if (splitted.length === 2) {
        variables[splitted[0]] = splitted[1] || '';
      } else {
        variables['value'] = value;
      }
      variables['input'] = value;
      if (typeof value === 'object') {
        variables = {
          ...variables,
          ...(value as any),
        };
      }
      if (!astElement && divNode) {
        const htmlString = node?.nodeInfo?.formValues['html'] || defaultHTML;
        structuredMarkup = createStructuredExpressionsMarkup(htmlString);
        const compiledMarkup = compileMarkup(structuredMarkup.markup);
        if (compiledMarkup) {
          (divNode.domElement as HTMLElement).innerHTML = '';
          astElement = createASTNodeElement(
            compiledMarkup.body,
            divNode.domElement,
            divNode.elements,
            structuredMarkup.expressions,
            node?.id,
            {
              input: value,
            }
          );
        }
      }
      if (astElement && structuredMarkup) {
        // Iterates over `structuredMarkup.expressions`. Each entry is an object with properties like `expressionFunction`, `value`, `isProperty`, `propertyName`, `isTextNode`, and `element`.
        // Checks if `value` contains substrings enclosed in square brackets. If so, it replaces the matched substring with the result of `expressionFunction` call.
        // If the result is `false` or `undefined`, the matched substring is removed.
        // If the object represents a property, it sets the property on the `domElement` of the `element` object. If the property name is 'class', it assigns the `resultContent` to the `className` of the `domElement`. For other properties, it uses the `setAttribute` method.
        // If the object represents a text node, it sets the `textContent` of the `domElement` to `resultContent`.
        Object.entries(structuredMarkup.expressions).forEach((entry) => {
          const info = entry[1] as {
            expressionFunction: (payload?: object) => any;
            value: string;
            isProperty: boolean;
            propertyName: string;
            isTextNode: boolean;
            element: IElementNode<NodeInfo>;
          };

          const matches = (info.value ?? '').toString().match(/\[[\s\S]+?\]/gm);
          if (matches) {
            let resultContent = info.value;
            matches.map((match) => {
              const result = info.expressionFunction(variables);
              if (result !== false && result !== undefined) {
                //resultContent.replace(match, result);

                if (match.substring(0, 1) == '[') {
                  resultContent = resultContent.replace(match, result);
                } else {
                  const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
                  resultContent = resultContent.replace(
                    allOccurancesOfMatchRegex,
                    result
                  );
                }
              } else {
                if (match.substring(0, 1) == '[') {
                  resultContent = resultContent.replace(match, '');
                } else {
                  const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
                  resultContent = resultContent.replace(
                    allOccurancesOfMatchRegex,
                    ''
                  );
                }
              }
            });
            if (info.isProperty) {
              if (info.propertyName === 'class') {
                (info.element.domElement as HTMLElement).className =
                  resultContent;
              } else {
                (info.element.domElement as HTMLElement).setAttribute(
                  info.propertyName,
                  resultContent
                );
              }
            } else if (info.isTextNode) {
              (info.element.domElement as HTMLElement).textContent =
                resultContent;
            }
          }
        });

        if (rect) {
          rect.resize();
        }
      }
    } catch (error) {
      console.log('setHTML error', error);
    }
  };

  const initializeCompute = () => {
    variables = {};
    astElement = undefined;
    return;
  };
  const compute = (input: string) => {
    setHTML(input);

    return {
      result: input,
    };
  };

  return {
    name: 'html-node',
    family: 'flow-canvas',
    isContainer: false,
    category: 'html',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const initialValue = initalValues?.['html'] || defaultHTML;

      const formElements = [
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'html',
          value: initialValue,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              html: value,
            };
            if (updated) {
              astElement = undefined;
              setHTML('');
              updated();
            }
          },
        },
      ];

      const componentWrapper = createElement(
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

      divNode = createNodeElement('div', {}, componentWrapper.domElement);
      rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        [
          // {
          //   thumbType: ThumbType.StartConnectorCenter,
          //   thumbIndex: 0,
          //   connectionType: ThumbConnectionType.start,
          //   color: 'white',
          //   label: '',
          // },
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
        false,
        undefined,
        undefined,
        id,
        {
          type: 'html-node',
          formValues: {
            html: initialValue || defaultHTML,
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
        node.nodeInfo.formValues = {
          html: initialValue || defaultHTML,
        };
        node.nodeInfo.showFormOnlyInPopup = true;
      }
      setHTML('');

      return node;
    },
  };
};
