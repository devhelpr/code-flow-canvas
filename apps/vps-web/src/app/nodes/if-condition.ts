import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
  trackNamedSignal,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const getIfCondition: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  let currentValue = 0;
  const initializeCompute = () => {
    currentValue = 0;
    return;
  };
  const compute = (
    input: string,
    loopIndex?: number,
    payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if (node?.nodeInfo?.formValues?.['Mode'] === 'expression') {
      const inputType = node?.nodeInfo?.formValues?.['inputType'] ?? 'number';
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

        const parseInput = (input: string) => {
          if (inputType === 'number') {
            return parseFloat(input) || 0;
          } else if (inputType === 'integer') {
            return parseInt(input) || 0;
          } else if (inputType === 'boolean') {
            return input === 'true' || input === '1' || Boolean(input)
              ? true
              : false;
          } else if (inputType === 'array') {
            return Array.isArray(input) ? input : [];
          } else {
            return (input ?? '').toString();
          }
        };

        let inputAsString = typeof input === 'object' ? '' : parseInput(input);
        let inputAsObject = {};
        if (Array.isArray(input)) {
          if (inputType === 'array') {
            inputAsString = input;
          } else {
            inputAsString = input.map((item) =>
              parseInput(item)
            ) as unknown as string; // dirty hack
          }
        } else if (typeof input === 'object') {
          inputAsObject = input;
        }
        const payloadForExpression = {
          //...variables,
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
                return canvasAppInstance?.getVariable(
                  variableName,
                  undefined,
                  scopeId
                );
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
          true,
          compiledExpressionInfo.payloadProperties
        );

        if (expression !== '' && (isNaN(result) || result === undefined)) {
          throw new Error("Expression couldn't be run");
        }
        console.log(
          'IFCondition result',
          result,
          input,
          expression,
          payloadForExpression
        );
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
        output: input,
        followPath: result ? 'success' : 'failure',
      };
    }
    return {
      result: input,
      output: input,
      followPath: Math.random() < 0.5 ? 'success' : 'failure',
    };
  };
  return {
    name: 'if-condition',
    family: 'flow-canvas',
    category: 'flow-control',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initialValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      const initialExpressionValue = initialValues?.['expression'] ?? '';
      const initialInputType = initialValues?.['inputType'] ?? 'number';
      console.log(
        'initialExpressionValue',
        initialExpressionValue,
        initialValues
      );
      const formElements = [
        {
          fieldType: FormFieldType.Select,
          fieldName: 'Mode',
          value: 'expression',
          options: [
            { value: 'random', label: 'Random' },
            { value: 'expression', label: 'Expression' },
          ],
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
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
          value: initialExpressionValue ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
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
            'inner-node flex text-center items-center justify-center w-[150px] h-[150px] overflow-hidden bg-slate-500 rounded',
          style: {
            'clip-path': 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%',
          },
        },
        undefined,
        initialExpressionValue ?? 'expression'
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

      let currentMode = 'expression';
      let currentValue = initialExpressionValue ?? '';

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
            label: ' ',
            //thumbConstraint: 'value',
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
          type: 'if-condition',
          formValues: {
            Mode: 'expression',
            expression: initialExpressionValue ?? '',
            inputType: initialInputType ?? 'number',
          },
        },
        containerNode
      );

      //createNamedSignal(`if${rect.nodeComponent.id}`, '');

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.formElements = formElements;
      }
      return node;
    },
  };
};
