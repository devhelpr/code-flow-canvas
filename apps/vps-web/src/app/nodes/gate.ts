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
import { FormFieldType } from '../components/form-component';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const getGate: NodeTaskFactory<NodeInfo> = (
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
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    console.log('Gate compute', loopIndex);
    //if (node.nodeInfo.formValues?.['Mode'] === 'expression') {
    let result: any = false;
    try {
      const expression = node.nodeInfo?.formValues?.['expression'] ?? '';
      const compiledExpressionInfo = compileExpressionAsInfo(expression);
      const expressionFunction = (
        new Function(
          'payload',
          `${compiledExpressionInfo.script}`
        ) as unknown as (payload?: any) => any
      ).bind(compiledExpressionInfo.bindings);

      const payloadForExpression = {
        input: input,
        currentValue: input,
        value: input,
        current: input,
        last: currentValue,
        index: loopIndex ?? 0,
        runIteration: loopIndex ?? 0,
        random: Math.round(Math.random() * 100),
        ...payload,
      };
      canvasAppInstance?.getVariableNames().forEach((variableName) => {
        Object.defineProperties(payloadForExpression, {
          [variableName]: {
            get: () => {
              console.log('get', variableName);
              return canvasAppInstance?.getVariable(variableName, scopeId);
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

      if (expression !== '' && (isNaN(result) || result === undefined)) {
        throw new Error("Expression couldn't be run");
      }
      console.log('Gate result', result, input, expression);
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
      stop: !result,
    };
    //}
    // return {
    //   result: input,
    //   stop: Math.random() < 0.5,
    // };
  };
  return {
    name: 'gate',
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
            if (!node?.nodeInfo?.formValues) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node?.nodeInfo?.formValues,
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
            if (!node?.nodeInfo?.formValues) {
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
      ];

      const parentElement = createElement('div', {
        class: 'inner-node select-outline-within',
      });
      const jsxComponentWrapper = createElement(
        'div',
        {
          class:
            ' p-3 pl-10 flex text-center items-center justify-center w-[150px] h-[150px] overflow-hidden bg-slate-500 rounded',
          style: {
            'clip-path': 'polygon(0 50%, 100% 0, 100% 100%)',
            // 'shape-inside:': 'polygon(0 50%, 100% 0, 100% 100%)', // no-browser-support yet...
            // 'shape-padding': '10px',
          },
        },
        parentElement.domElement,
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

      console.log('trackNamedSignal register gate', id);

      let currentMode = 'expression';
      let currentValue = initialExpressionValue ?? '';

      trackNamedSignal(`${id}_Mode`, (value) => {
        console.log('trackNamedSignal gate', id, value);
        currentMode = value;
        jsxComponentWrapper.domElement.textContent =
          currentMode === 'random' ? 'random' : currentValue ?? 'expression';
      });

      trackNamedSignal(`${id}_expression`, (value) => {
        console.log('trackNamedSignal gaten', id, value);
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
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'rgba(95,204,37,1)',
            label: ' ',
            //thumbConstraint: 'value',
            name: 'success',
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
        parentElement as INodeComponent<NodeInfo>,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          formElements: [],
          type: 'gate',
          formValues: {
            Mode: 'expression',
            expression: initialExpressionValue ?? '',
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
