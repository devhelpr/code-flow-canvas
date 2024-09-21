import {
  FormField,
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Rect,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { registerCustomFunction } from '@devhelpr/expression-compiler';

const fieldName = 'testt-input';
const labelName = 'Register Expression Function';
export const registerExpressionFunctionNodeName =
  'register-expression-function-node';
const familyName = 'flow-canvas';
const thumbs: any[] = [];

export const getRegisterExpressionFunctionNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let rect: Rect<NodeInfo> | undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, _loopIndex?: number, _payload?: any) => {
    const functionName = node.nodeInfo?.formValues?.['functionName'] ?? '';
    const customFunctionCode =
      node.nodeInfo?.formValues?.['customFunctionCode'] ?? '';
    if (functionName && customFunctionCode) {
      const customFunction = new Function(`return ${customFunctionCode}`);

      console.log(
        'registering custom function',
        functionName,
        customFunction()
      );
      registerCustomFunction(functionName, [], customFunction() as any);
    }
    return {
      result: true,
      output: true,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    registerExpressionFunctionNodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    100,
    thumbs,
    (values?: InitialValues): FormField[] => {
      const initialFunctionName = values?.['functionName'] ?? '';
      return [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'functionName',
          label: 'Custom Expression Function',
          value: initialFunctionName,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['functionName']: value,
            };

            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'customFunctionCode',
          label: 'Code',
          value: values?.['customFunctionCode'] ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['customFunctionCode']: value,
            };

            if (updated) {
              updated();
            }
          },
        },
      ];
    },
    (nodeInstance) => {
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.isRunOnStart = true;
        nodeInstance.node.nodeInfo.isSettingsPopup = true;
      }
      rect = nodeInstance.rect;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (rect && rect.resize) {
        rect?.resize();
      }
    },
    {
      category: familyName,
      adjustToFormContent: true,
      hasFormInPopup: true,
      hasTitlebar: true,
    }
  );
};
