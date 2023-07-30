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

export const getExpression = (updated?: () => void) => {
  let node: INodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;

  let currentValue = 0;
  const initializeCompute = () => {
    currentValue = 0;
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number
  ) => {
    (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
    let result: any = false;
    try {
      const expression = node.nodeInfo.formValues?.['Expression'] ?? '';
      const compiledExpressionInfo = compileExpressionAsInfo(expression);
      const expressionFunction = (
        new Function(
          'payload',
          `${compiledExpressionInfo.script}`
        ) as unknown as (payload?: any) => any
      ).bind(compiledExpressionInfo.bindings);
      result = runExpression(
        expressionFunction,
        { input: input, currentValue: currentValue, index: loopIndex ?? 0 },
        true,
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
    if (result) {
      currentValue = result;
    }
    return {
      result,
      followPath: undefined,
    };
  };

  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      expression?: string,
      id?: string
    ) => {
      console.log('createVisualNode createNamedSignal', expression, id);
      //createNamedSignal(id + '_' + 'Expression', expression ?? '');

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'Expression',
          value: expression ?? '',
          onChange: (value: string) => {
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              Expression: value,
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
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
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
          type: 'expression',
          formValues: {
            Expression: expression ?? '',
          },
        }
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
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
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
