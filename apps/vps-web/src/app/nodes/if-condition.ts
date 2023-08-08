import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import {
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  trackNamedSignal,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/form-component';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

export const getIfCondition = (updated?: () => void) => {
  let node: INodeComponent<NodeInfo>;

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
    if (node.nodeInfo.formValues?.['Mode'] === 'expression') {
      let result: any = false;
      try {
        const expression = node.nodeInfo.formValues?.['expression'] ?? '';
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
        // (errorNode.domElement as unknown as HTMLElement).classList.remove(
        //   'hidden'
        // );
        // (errorNode.domElement as unknown as HTMLElement).textContent =
        //   error?.toString() ?? 'Error';
        console.log('expression error', error);
      }
      if (result) {
        currentValue = result;
      }
      return {
        result: input,
        followPath: result ? 'success' : 'failure',
      };
    }
    return {
      result: input,
      followPath: Math.random() < 0.5 ? 'success' : 'failure',
    };
  };
  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      mode?: string,
      expression?: string
    ) => {
      const formElements = [
        {
          fieldType: FormFieldType.Select,
          fieldName: 'Mode',
          value: mode ?? '',
          options: [
            { value: 'random', label: 'Random' },
            { value: 'expression', label: 'Expression' },
          ],
          onChange: (value: string) => {
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              Mode: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Text,
          fieldName: 'expression',
          value: expression ?? '',
          onChange: (value: string) => {
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              expression: value,
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
          class:
            'flex text-center items-center justify-center w-[150px] h-[150px] overflow-hidden bg-slate-500 rounded',
          style: {
            'clip-path': 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%',
          },
        },
        undefined,
        mode === 'random' ? 'random' : expression ?? 'expression'
        // FormComponent({
        //   id: 'test',
        //   formElements: [],
        //   hasSubmitButton: false,
        //   onSave: (formValues) => {
        //     //
        //   },
        //}) as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      console.log('trackNamedSignal register if-condition', id);

      let currentMode = mode;
      let currentValue = expression ?? '';

      trackNamedSignal(`${id}_Mode`, (value) => {
        console.log('trackNamedSignal if-condition', id, value);
        currentMode = value;
        jsxComponentWrapper.domElement.textContent =
          currentMode === 'random' ? 'random' : currentValue ?? 'expression';
      });

      trackNamedSignal(`${id}_expression`, (value) => {
        console.log('trackNamedSignal if-condition', id, value);
        currentValue = value;
        jsxComponentWrapper.domElement.textContent =
          currentMode === 'random' ? 'random' : currentValue ?? 'expression';
      });

      const rect = canvasApp.createRect(
        x,
        y,
        150,
        150,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorTop,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            pathName: 'success',
            color: 'rgba(95,204,37,1)',
            label: '#',
            thumbConstraint: 'value',
            name: 'success',
          },
          {
            thumbType: ThumbType.StartConnectorBottom,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            pathName: 'failure',
            color: 'rgba(204,37,37,1)',
            label: '#',
            thumbConstraint: 'value',
            name: 'failure',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
            name: 'input',
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
          formElements: [],
          type: 'if',
          formValues: {
            Mode: mode ?? 'random',
            expression: expression ?? '',
          },
        }
      );

      //createNamedSignal(`if${rect.nodeComponent.id}`, '');

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.formElements = formElements;
    },
  };
};
