import {
  FlowChangeType,
  FormField,
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Rect,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { registerCustomFunction } from '@devhelpr/expression-compiler';
import { setClearExpressionCache } from './expression';

const fieldName = 'testt-input';
const labelName = 'Register Expression Function';
export const registerExpressionFunctionNodeName =
  'register-expression-function-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
  },
];

export const getRegisterExpressionFunctionNode: NodeTaskFactory<NodeInfo> = (
  updated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let rect: Rect<NodeInfo> | undefined;
  let textElement: HTMLElement | undefined;

  const initializeCompute = () => {
    return;
  };

  const registerFunction = () => {
    const functionName = node.nodeInfo?.formValues?.['functionName'] ?? '';
    const customFunctionCode =
      node.nodeInfo?.formValues?.['customFunctionCode'] ?? '';
    if (functionName && customFunctionCode) {
      const customFunction = new Function(`return ${customFunctionCode}`);

      registerCustomFunction(functionName, [], customFunction() as any);
      setClearExpressionCache();
    }
  };
  const compute = (_input: string, _loopIndex?: number, _payload?: any) => {
    registerFunction();
    return {
      result: false,
      output: false,
      stop: true,
      followPath: undefined,
    };
  };

  const Text = () => (
    <div
      class="text-white text-center font-bold text-4xl p-4"
      getElement={(element: HTMLElement) => {
        textElement = element;
      }}
    >
      {node?.nodeInfo?.formValues?.['functionName'] ?? ''}
    </div>
  );

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
            if (textElement) {
              textElement.textContent = value;
            }

            if (rect && rect.resize) {
              rect?.resize();
            }

            if (updated) {
              updated(undefined, undefined, FlowChangeType.UpdateNode);
            }

            registerFunction();
          },
        },
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'customFunctionCode',
          label: 'Code',
          editorLanguage: 'javascript',
          value:
            values?.['customFunctionCode'] ??
            `() => {
};`,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['customFunctionCode']: value,
            };

            if (updated) {
              updated(undefined, undefined, FlowChangeType.UpdateNode);
            }

            registerFunction();
          },
        },
      ];
    },
    (nodeInstance) => {
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.isRunOnStart = true;
      }
      rect = nodeInstance.rect;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (rect && rect.resize) {
        rect?.resize();
      }
      if (node.nodeInfo && !node.nodeInfo.formValues?.['customFunctionCode']) {
        node.nodeInfo.formValues = {
          ...node.nodeInfo.formValues,
          ['customFunctionCode']: `() => {
  return 42;
};`,
        };
      }
      if (textElement) {
        textElement.textContent =
          node.nodeInfo?.formValues?.['functionName'] ?? '';
      }
    },
    {
      category: 'expression',
      adjustToFormContent: true,
      hasFormInPopup: true,
      hasTitlebar: true,
      nodeCannotBeReplaced: true,
      keepPopupOpenAfterUpdate: true,
    },
    <Text />
  );
};
