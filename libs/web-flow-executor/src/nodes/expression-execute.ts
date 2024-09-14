import {
  FlowCanvas,
  createElement,
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

export const getExpressionExecute: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let errorNode: INodeComponent<NodeInfo>;
  let jsxComponentWrapper: INodeComponent<NodeInfo>;
  let currentValue = 0;
  const initializeCompute = () => {
    currentValue = 0;
    return;
  };
  const compute = (input: string, loopIndex?: number, payload?: any) => {
    (errorNode.domElement as unknown as HTMLElement).classList.add('hidden');
    let result: any = false;
    try {
      const expression =
        input.at(0) === '=' ? `${input.substring(1)}` : `value ${input ?? ''}`;
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
      if (jsxComponentWrapper) {
        jsxComponentWrapper.domElement.textContent = `${currentValue}`;
      }
    }
    return {
      result,
      followPath: undefined,
    };
  };

  return {
    name: 'expression-execute',
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: (
      canvasApp: FlowCanvas<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const initialValue = initalValues?.['expression'] ?? '';

      jsxComponentWrapper = createElement(
        'div',
        {
          class: `inner-node shape-circle bg-slate-500 p-4 rounded h-[60px] text-center`,
          style: {
            'clip-path': 'circle(50%)',
          },
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        60,
        60,
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
            label: '~',
            thumbConstraint: 'expression-chain',
            maxConnections: -1,
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-transparent p-4 rounded`,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          type: 'expression-execute',
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
        node.nodeInfo.formElements = [];
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
