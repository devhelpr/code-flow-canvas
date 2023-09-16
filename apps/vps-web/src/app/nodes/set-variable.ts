import {
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const setVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: canvasAppReturnType | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
    if (canvasAppInstance) {
      const variableName = node.nodeInfo.formValues?.['variableName'] ?? '';
      if (variableName) {
        canvasAppInstance.setVariable(variableName, input);
      }
    }
    return {
      result: input,
      followPath: undefined,
    };
  };

  return {
    name: 'set-variable',
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
      canvasAppInstance = canvasApp;
      const initialValue = initalValues?.['variableName'] ?? '';

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'variableName',
          value: initialValue ?? '',
          onChange: (value: string) => {
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              variableName: value,
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
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
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
          type: 'set-variable',
          formValues: {
            variableName: initialValue ?? '',
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.nodeComponent.nodeInfo.formElements = formElements;

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      return node;
    },
  };
};
