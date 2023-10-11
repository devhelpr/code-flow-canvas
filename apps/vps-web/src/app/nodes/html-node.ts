import {
  createASTNodeElement,
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { FormFieldType } from '../components/form-component';
import {
  createStructuredExpressionsMarkup,
  replaceExpressionScript,
} from '../utils/replace-expression-script';
import {
  compileMarkup,
  IASTTreeNode,
  IASTTreeProperty,
} from '@devhelpr/markup-compiler';

export const getHtmlNode = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divNode: IElementNode<NodeInfo>;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
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
  const parseBody = (
    body: IASTTreeNode,
    expressions: Record<string, object>
  ) => {
    body.body?.forEach((childASTNode) => {
      if (childASTNode.type === 'Markup') {
        parseBody(childASTNode, expressions);
      } else if (childASTNode.type === 'TEXT') {
        const matches = (childASTNode.value ?? '')
          .toString()
          .match(/\[[\s\S]+?\]/gm);
        if (matches) {
          matches.map((match) => {
            const expressionId = match.slice(1, -1);
            const expression = expressions[expressionId] as any;
            if (expression) {
              expression.value = childASTNode.value ?? '';
              expression.isTextNode = true;
              expression.textNode = childASTNode;
            }
          });
        }
      }
    });
    body.properties?.forEach((propertyKeyValue) => {
      const matches = propertyKeyValue.value.toString().match(/\[[\s\S]+?\]/gm);
      if (matches) {
        matches.map((match) => {
          const expressionId = match.slice(1, -1);
          const expression = expressions[expressionId] as any;
          if (expression) {
            expression.value = propertyKeyValue.value;
            expression.isProperty = true;
            expression.propertyNode = propertyKeyValue;
          }
        });
      }
    });
  };
  const setHTML = (value: string) => {
    try {
      const splitted = (value ?? '').toString().split(':');
      if (splitted.length === 2) {
        variables[splitted[0]] = splitted[1] || '';
      } else {
        variables['value'] = value;
      }
      if (!astElement) {
        const htmlString = node?.nodeInfo?.formValues['html'] || defaultHTML;
        structuredMarkup = createStructuredExpressionsMarkup(htmlString);
        //console.log('structuredMarkup', structuredMarkup);
        const compiledMarkup = compileMarkup(structuredMarkup.markup);
        // htmlString = replaceExpressionScript(htmlString, variables, true);

        // (divNode.domElement as HTMLElement).innerHTML = htmlString;
        if (compiledMarkup) {
          (divNode.domElement as HTMLElement).innerHTML = '';
          astElement = createASTNodeElement(
            compiledMarkup.body,
            divNode.domElement,
            divNode.elements,
            structuredMarkup.expressions,
            node?.id
          );
          console.log('compiledMarkup', compiledMarkup);
        }
      }
      if (astElement && structuredMarkup) {
        Object.entries(structuredMarkup.expressions).forEach((entry) => {
          console.log('entry', entry);
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
              console.log('result', result, match);
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
              console.log(
                'info.propertyName',
                info.propertyName,
                resultContent
              );
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
    createVisualNode: (
      canvasApp: canvasAppReturnType,
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
            console.log('html-node onchange', value);
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              html: value,
            };
            console.log('onChange', node.nodeInfo);
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

      divNode = createElement('div', {}, componentWrapper.domElement);
      rect = canvasApp.createRect(
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
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
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
      }
      setHTML('');

      return node;
    },
  };
};
