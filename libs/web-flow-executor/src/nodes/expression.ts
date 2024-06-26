import {
  CanvasAppInstance,
  createElement,
  createNodeElement,
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
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

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

export const parseInput = (input: string, inputType: string) => {
  if (inputType === 'number') {
    return parseFloat(input) || 0;
  } else if (inputType === 'integer') {
    return parseInt(input) || 0;
  } else if (inputType === 'boolean') {
    return input === 'true' || input === '1' || Boolean(input) ? true : false;
  } else if (inputType === 'array') {
    return Array.isArray(input) ? input : [];
  } else {
    return (input ?? '').toString();
  }
};

export const getExpression: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: IDOMElement | undefined = undefined;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  let nodeFormComponent: FormsComponent | undefined = undefined;

  let currentValue = 0;
  let compiledExpressionInfo:
    | {
        script: string;
        bindings: any;
        payloadProperties: string[];
      }
    | undefined = undefined;
  const initializeCompute = () => {
    currentValue = 0;
    compiledExpressionInfo = undefined;
    return;
  };

  const compileExpression = (expression: string) => {
    if (!compiledExpressionInfo) {
      compiledExpressionInfo = compileExpressionAsInfo(expression);
    }
  };

  const compute = (
    input: string,
    loopIndex?: number,
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
      if (!compiledExpressionInfo) {
        return {
          result: undefined,
          followPath: undefined,
        };
      }
      const expression = node?.nodeInfo?.formValues?.['expression'] ?? 'input';
      const inputType = node?.nodeInfo?.formValues?.['inputType'] ?? 'number';
      const expressionFunction = (
        new Function(
          'payload',
          `${compiledExpressionInfo.script}`
        ) as unknown as (payload?: any) => any
      ).bind(compiledExpressionInfo.bindings);

      console.log(
        'compiledExpressionInfo.script',
        compiledExpressionInfo.script
      );

      let inputAsString =
        typeof input === 'object' ? '' : parseInput(input, inputType);
      let inputAsObject = {};
      if (Array.isArray(input)) {
        if (inputType === 'array') {
          inputAsString = input;
        } else {
          inputAsString = input.map((item) =>
            parseInput(item, inputType)
          ) as unknown as string; // dirty hack
        }
      } else if (typeof input === 'object') {
        inputAsObject = input;
      }
      const payloadForExpression = {
        input: inputAsString,
        currentValue: currentValue,
        value: currentValue,
        array: input,
        current: currentValue,
        last: currentValue,
        index: loopIndex ?? 0,
        runIteration: loopIndex ?? 0,
        random: Math.round(Math.random() * 100),
        ...payload,
        ...inputAsObject,
      };
      canvasAppInstance?.getVariableNames(scopeId).forEach((variableName) => {
        Object.defineProperties(payloadForExpression, {
          [variableName]: {
            get: () => {
              const getResult = canvasAppInstance?.getVariable(
                variableName,
                undefined,
                scopeId
              );

              console.log('get', variableName, getResult);
              return getResult;
            },
            set: (value) => {
              canvasAppInstance?.setVariable(variableName, value, scopeId);
            },
          },
        });
      });

      result = runExpression(
        expressionFunction,
        payloadForExpression,
        false, // when True ... this fails when expression contains array indexes...
        compiledExpressionInfo.payloadProperties
      );
      console.log(
        'expression result',
        result,
        compiledExpressionInfo.payloadProperties
      );
      // TODO : isNaN is not always correct .. for example when the output is an array
      //if (expression !== '' && (isNaN(result) || result === undefined)) {
      if (expression !== '' && result === undefined) {
        throw new Error("Expression couldn't be run");
      }
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
    compileExpression(node?.nodeInfo?.formValues?.['expression'] ?? '');
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
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      compiledExpressionInfo = undefined;
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
            compiledExpressionInfo = undefined;
            if (nodeFormComponent) {
              if (
                nodeFormComponent.formComponentId !==
                formComponent.formComponentId
              ) {
                nodeFormComponent.setValue('expression', value);
              }
            }
            if (updated) {
              updated();
            }
          },
        },
      ];

      const componentWrapper = createNodeElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      nodeFormComponent = FormComponent({
        rootElement: componentWrapper.domElement as HTMLElement,
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
        200,
        100,
        undefined,
        thumbs,
        componentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
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
      );

      //createNamedSignal(`expression${rect.nodeComponent.id}`, '');
      node = rect.nodeComponent;
      if (node.nodeInfo) {
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

              compiledExpressionInfo = undefined;
              if (updated) {
                updated();
              }
            },
          },
        ];
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.getDependencies = getDependencies;

        node.nodeInfo.compileInfo = {
          getCode: (input: any) => {
            compileExpression(node?.nodeInfo?.formValues?.['expression'] ?? '');
            if (!compiledExpressionInfo) {
              return 'input;';
            }
            return `\
((payload) => {\
${compiledExpressionInfo.script};\
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
      canvasApp: CanvasAppInstance<NodeInfo>,
      initalValues?: InitialValues,
      rootElement?: HTMLElement
    ) => {
      canvasAppInstance = canvasApp;
      compiledExpressionInfo = undefined;
      const initialValue = initalValues?.['expression'] ?? '';
      const decoratorNode = createNodeElement(
        'div',
        {
          class: `decorator-node text-white p-2 inline-block rounded text-center border-2 border-slate-200 border-solid`,
        },
        rootElement,
        initialValue
      ) as unknown as INodeComponent<NodeInfo>;

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
