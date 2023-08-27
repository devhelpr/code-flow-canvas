import {
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
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

export const getExpression: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;

  let currentValue = 0;
  const initializeCompute = () => {
    currentValue = 0;
    return;
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
        {
          input: input,
          currentValue: currentValue,
          value: currentValue,
          current: currentValue,
          last: currentValue,
          index: loopIndex ?? 0,
          random: Math.round(Math.random() * 100),
          ...payload,
        },
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
    if (result !== undefined) {
      currentValue = result;
    }
    return {
      result,
      followPath: undefined,
    };
  };

  return {
    name: 'expression',
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: <NodeInfo>(
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const initialValue = initalValues?.['expression'] ?? '';

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'expression',
          value: initialValue ?? '',
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
          class: `bg-slate-500 p-4 rounded`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      FormComponent({
        rootElement: jsxComponentWrapper.domElement as HTMLElement,
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
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
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
            expression: initialValue ?? '',
          },
        },
        containerNode
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
      return node;
    },
  };
};
