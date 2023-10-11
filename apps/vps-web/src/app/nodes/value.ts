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
import { replaceValues } from '../utils/replace-values';

export const getValue: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
    const result = replaceValues(node?.nodeInfo?.formValues?.['value'] ?? '', {
      value: input,
      currentValue: input,
      index: loopIndex ?? 0,
      payload: payload,
    });
    return {
      result,
      followPath: undefined,
    };
  };

  return {
    name: 'value',
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
      const initialValue = initalValues?.['value'] ?? '';

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'value',
          value: initialValue ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              value: value,
            };
            console.log('onChange', node.nodeInfo);
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
            label: ' ',
            //thumbConstraint: 'value',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
            //thumbConstraint: 'value',
          },
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
          type: 'value',
          formValues: {
            value: initialValue ?? '',
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
      }
      return node;
    },
  };
};
