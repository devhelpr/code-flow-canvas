import {
  IFlowCanvasBase,
  createElement,
  createNodeElement,
  FlowChangeType,
  FormComponent,
  FormFieldType,
  FormsComponent,
  IDOMElement,
  IFormsComponent,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import {
  getNodeByVariableName,
  getNodesByNodeType,
} from '../graph/get-node-by-variable-name';
import { registerExpressionFunctionNodeName } from './register-expression-function';
import { getVariablePayloadInputUtils } from './variable-payload-input-utils.ts/variable-payload-input-utils';

const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: -1,
    name: 'output',
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
  },
];

// export const parseInput = (input: string, inputType: string) => {
//   if (inputType === 'number') {
//     return parseFloat(input) || 0;
//   } else if (inputType === 'integer') {
//     return parseInt(input) || 0;
//   } else if (inputType === 'boolean') {
//     return input === 'true' || input === '1' || Boolean(input) ? true : false;
//   } else if (inputType === 'array') {
//     return Array.isArray(input) ? input : [];
//   } else {
//     return (input ?? '').toString();
//   }
// };

export const setClearExpressionCache = () => {
  expressionCache = {};
};

let expressionCache: Record<
  string,
  | {
      script: string;
      bindings: any;
      payloadProperties: string[];
    }
  | undefined
> = {};

export const getExpression: NodeTaskFactory<NodeInfo> = (
  updated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: IDOMElement | undefined = undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let nodeFormComponent: FormsComponent | undefined = undefined;

  let currentValue = 0;

  let executionRunCounter = 0;
  const initializeCompute = () => {
    currentValue = 0;
    executionRunCounter = 0;
    expressionCache[node.id] = undefined;
    if (errorNode) {
      (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
    }
    return;
  };

  const compileExpression = (expression: string) => {
    if (!expressionCache[node.id]) {
      expressionCache[node.id] = compileExpressionAsInfo(expression);
    }
  };

  const compute = (
    input: string,
    _loopIndexloopIndex?: number,
    payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if (errorNode) {
      (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
    }
    let result: any = false;
    try {
      compileExpression(node?.nodeInfo?.formValues?.['expression'] ?? 'input');
      if (!expressionCache[node.id]) {
        return {
          result: undefined,
          followPath: undefined,
        };
      }
      const compiledExpressionInfo = expressionCache[node.id]!;
      const expression = node?.nodeInfo?.formValues?.['expression'] ?? 'input';
      const inputType = node?.nodeInfo?.formValues?.['inputType'] ?? 'number';
      const expressionFunction = (
        new Function(
          'payload',
          `${compiledExpressionInfo.script}`
        ) as unknown as (payload?: any) => any
      ).bind(compiledExpressionInfo.bindings);

      // let inputAsString =
      //   typeof input === 'object' ? '' : parseInput(input, inputType);
      // let inputAsObject = {};
      // if (Array.isArray(input)) {
      //   if (inputType === 'array') {
      //     inputAsString = input;
      //   } else {
      //     inputAsString = input.map((item) =>
      //       parseInput(item, inputType)
      //     ) as unknown as string; // dirty hack
      //   }
      // } else if (typeof input === 'object') {
      //   inputAsObject = input;
      // }

      const payloadForExpression = getVariablePayloadInputUtils(
        input,
        payload,
        inputType,
        currentValue,
        executionRunCounter,
        scopeId,
        canvasAppInstance
      );

      result = runExpression(
        expressionFunction,
        payloadForExpression,
        false, // when True ... this fails when expression contains array indexes...
        compiledExpressionInfo.payloadProperties
      );

      // TODO : isNaN is not always correct .. for example when the output is an array
      //if (expression !== '' && (isNaN(result) || result === undefined)) {
      if (expression !== '' && result === undefined) {
        throw new Error("Expression couldn't be run");
      }
      executionRunCounter++;
    } catch (error) {
      result = undefined;
      if (errorNode) {
        (errorNode.domElement as unknown as HTMLElement).classList.remove(
          'hidden'
        );
        (errorNode.domElement as unknown as HTMLElement).textContent =
          error?.toString() ?? 'Error';
      }
      console.log('expression error', error);
    }
    if (result !== undefined) {
      currentValue = result;
    }
    return {
      result,
      output: result,
      followPath: undefined,
    };
  };

  const getDependencies = (): { startNodeId: string; endNodeId: string }[] => {
    const dependencies: { startNodeId: string; endNodeId: string }[] = [];
    const expression: string = node?.nodeInfo?.formValues?.['expression'] ?? '';
    compileExpression(expression);
    const compiledExpressionInfo = expressionCache[node.id];
    if (compiledExpressionInfo?.payloadProperties && canvasAppInstance) {
      const variablesInExpression = [
        ...new Set(compiledExpressionInfo.payloadProperties),
      ];

      variablesInExpression.forEach((variableName) => {
        if (canvasAppInstance) {
          const variableNode = getNodeByVariableName(
            variableName,
            canvasAppInstance
          );
          if (variableNode) {
            dependencies.push({
              startNodeId: variableNode.id,
              endNodeId: node.id,
            });
          }
        }
      });

      const registeredCustomFunctionNodes = getNodesByNodeType(
        registerExpressionFunctionNodeName,
        canvasAppInstance
      );
      registeredCustomFunctionNodes?.forEach(
        (customFunctionNode: INodeComponent<NodeInfo>) => {
          const functionName =
            customFunctionNode.nodeInfo?.formValues?.['functionName'];
          if (functionName && expression.indexOf(functionName) >= 0) {
            dependencies.push({
              startNodeId: node.id,
              endNodeId: customFunctionNode.id,
            });
          }
        }
      );
    }
    return dependencies;
  };

  return {
    name: 'expression',
    family: 'flow-canvas',
    category: 'expression',
    isContainer: false,
    thumbs,
    canBeUsedAsDecorator: true,
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
      canvasAppInstance = canvasApp;

      const initialValue = initalValues?.['expression'] ?? '';
      const initialInputType = initalValues?.['inputType'] ?? 'number';
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'expression',
          label: 'Expression',
          value: initialValue ?? '',
          onChange: (value: string, formComponent: IFormsComponent) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              expression: value,
            };
            console.log('onChange', node.nodeInfo);

            expressionCache[node.id] = undefined;
            if (nodeFormComponent) {
              if (
                nodeFormComponent.formComponentId !==
                formComponent.formComponentId
              ) {
                nodeFormComponent.setValue('expression', value);
              }
            }
            if (updated) {
              updated(undefined, undefined, FlowChangeType.UpdateNode);
            }
          },
        },
      ];

      const componentWrapper = createNodeElement<NodeInfo>(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded`,
        },
        undefined
      );

      nodeFormComponent = FormComponent({
        rootElement: componentWrapper?.domElement as HTMLElement,
        id: id ?? '',
        formElements,
        hasSubmitButton: false,
        onSave: (formValues) => {
          console.log('onSave', formValues);
        },
      });

      const rect = canvasApp.createRect(
        x,
        y,
        width ?? 200,
        height ?? 100,
        undefined,
        thumbs,
        componentWrapper as INodeComponent<NodeInfo>,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          type: 'expression',
          formValues: {
            expression: initialValue ?? '',
            inputType: initialInputType ?? 'number',
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
          class: `bg-red-500 p-4 rounded absolute bottom-[calc(100%+15px)] h-[min-content] w-full hidden
            after:content-['']
            after:w-0 after:h-0 
            after:border-l-[10px] after:border-l-transparent
            after:border-t-[10px] after:border-t-red-500
            after:border-r-[10px] after:border-r-transparent
            after:absolute after:bottom-[-10px] after:left-[50%] after:transform after:translate-x-[-50%]
          `,
        },
        rect.nodeComponent?.domElement,
        'error'
      );

      //createNamedSignal(`expression${rect.nodeComponent.id}`, '');
      node = rect.nodeComponent;

      if (node.nodeInfo) {
        expressionCache[node.id] = undefined;

        node.nodeInfo.formElements = [
          ...formElements,
          {
            fieldType: FormFieldType.Select,
            fieldName: 'inputType',
            value: initialInputType ?? 'number',
            options: [
              { value: 'number', label: 'Number' },
              { value: 'string', label: 'String' },
              { value: 'integer', label: 'Integer' },
              { value: 'boolean', label: 'Boolean' },
              { value: 'array', label: 'Array' },
            ],
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                inputType: value,
              };
              console.log('onChange', node.nodeInfo);
              expressionCache[node.id] = undefined;

              if (updated) {
                updated();
              }
            },
          },
        ];
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.getDependencies = getDependencies;
        node.nodeInfo.showFormOnlyInPopup = true;
        node.nodeInfo.isSettingsPopup = true;

        node.nodeInfo.compileInfo = {
          getCode: (input: any) => {
            compileExpression(node?.nodeInfo?.formValues?.['expression'] ?? '');

            if (!node.id || !expressionCache[node.id]) {
              return 'input;';
            }
            return `\
((payload) => {\
${expressionCache[node.id]!.script};\
})({input:${input ? input : '""'}});
`;
          },
          //           getGlobalCode: () => {
          //             return `\
          // const getExpression = (input, loopIndex, payload, nodeValue) => {
          //   return "";
          // }
          // `;
          //},
        };
      }
      return node;
    },
    createDecoratorNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      initalValues?: InitialValues,
      rootElement?: HTMLElement
    ) => {
      canvasAppInstance = canvasApp;
      if (node?.id) {
        expressionCache[node.id] = undefined;
      }
      const initialValue = initalValues?.['expression'] ?? '';
      const decoratorNode = (createNodeElement(
        'div',
        {
          class: `decorator-node text-white p-2 inline-block rounded text-center border-2 border-slate-200 border-solid`,
        },
        rootElement,
        initialValue
      ) as unknown as INodeComponent<NodeInfo>) ?? {
        domElement: undefined,
        id: crypto.randomUUID(),
      };

      decoratorNode.nodeInfo = {
        compute,
        initializeCompute,
        formValues: initalValues,
      };
      node = decoratorNode as unknown as IRectNodeComponent<NodeInfo>;
      return decoratorNode;
    },
  };
};
