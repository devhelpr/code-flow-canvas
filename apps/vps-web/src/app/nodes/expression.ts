import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

export const getExpression: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
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

  const compileExpression = () => {
    const expression = node?.nodeInfo?.formValues?.['expression'] ?? '';
    if (!compiledExpressionInfo) {
      compiledExpressionInfo = compileExpressionAsInfo(expression);
    }
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
    (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
    let result: any = false;
    try {
      compileExpression();
      if (!compiledExpressionInfo) {
        return {
          result: undefined,
          followPath: undefined,
        };
      }
      const expression = node?.nodeInfo?.formValues?.['expression'] ?? '';
      const expressionFunction = (
        new Function(
          'payload',
          `${compiledExpressionInfo.script}`
        ) as unknown as (payload?: any) => any
      ).bind(compiledExpressionInfo.bindings);
      //const variables = canvasAppInstance?.getVariables() ?? {};
      //console.log('expression canvas variables', variables, input);
      const inputAsString =
        typeof input === 'object' ? '' : parseFloat(input) || 0;
      let inputAsObject = {};
      if (typeof input === 'object') {
        inputAsObject = input;
      }
      const payloadForExpression = {
        //...variables,
        input: inputAsString,
        currentValue: currentValue,
        value: currentValue,
        current: currentValue,
        last: currentValue,
        index: loopIndex ?? 0,
        runIteration: loopIndex ?? 0,
        random: Math.round(Math.random() * 100),
        ...payload,
        ...inputAsObject,
      };
      canvasAppInstance?.getVariableNames().forEach((variableName) => {
        Object.defineProperties(payloadForExpression, {
          [variableName]: {
            get: () => {
              console.log('get', variableName);
              return parseFloat(canvasAppInstance?.getVariable(variableName));
            },
            set: (value) => {
              canvasAppInstance?.setVariable(variableName, value);
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

      if (expression !== '' && (isNaN(result) || result === undefined)) {
        throw new Error("Expression couldn't be run");
      }
    } catch (error) {
      result = undefined;
      (errorNode.domElement as unknown as HTMLElement).classList.remove(
        'hidden'
      );
      (errorNode.domElement as unknown as HTMLElement).textContent =
        error?.toString() ?? 'Error';
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
    compileExpression();
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
    isContainer: false,
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

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'expression',
          value: initialValue ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              expression: value,
            };
            console.log('onChange', node.nodeInfo);
            compiledExpressionInfo = undefined;
            if (updated) {
              updated();
            }
          },
        },
      ];

      const componentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      FormComponent({
        rootElement: componentWrapper.domElement as HTMLElement,
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
            label: '#',
            thumbConstraint: 'value',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            //thumbConstraint: 'value',
          },
          // {
          //   thumbType: ThumbType.StartConnectorBottom,
          //   thumbIndex: 0,
          //   connectionType: ThumbConnectionType.start,
          //   color: 'yellow',
          //   label: '#',
          //   thumbConstraint: 'value',
          //   isDataPort: true,
          //   name: 'data-output',
          // },
          // {
          //   thumbType: ThumbType.EndConnectorTop,
          //   thumbIndex: 0,
          //   connectionType: ThumbConnectionType.end,
          //   color: 'yellow',
          //   label: '#',
          //   thumbConstraint: 'value',
          //   isDataPort: true,
          //   name: 'data-input',
          // },
        ],
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
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.getDependencies = getDependencies;
      }
      return node;
    },
  };
};
