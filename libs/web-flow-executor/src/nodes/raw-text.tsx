import {
  FlowChangeType,
  FormField,
  FormFieldType,
  IFlowCanvasBase,
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
import { getVariablePayloadInputUtils } from './variable-payload-input-utils/variable-payload-input-utils';
import { replaceVariablesInString } from '../utils/replace-variables-in-string';

const fieldName = 'testt-input';
const labelName = 'JSON';
export const textNodeName = 'text-node';
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
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    maxConnections: -1,
  },
];

export const getRawTextNode: NodeTaskFactory<NodeInfo> = (
  updated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let rect: Rect<NodeInfo> | undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  //let setErrorMessage: undefined | ((message: string) => void) = undefined;
  let clearErrorMessage: undefined | (() => void) = undefined;
  let currentOutput: any = undefined;
  let currentSerializedInput: any = undefined;
  const initializeCompute = () => {
    return;
  };

  const compute = (
    input: string,
    loopIndex?: number,
    payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    clearErrorMessage?.();
    if (!node.nodeInfo || !node.nodeInfo.formValues?.['text']) {
      return {
        result: false,
        output: false,
        stop: true,
        followPath: undefined,
      };
    }

    const variablePayload = getVariablePayloadInputUtils(
      input,
      payload,
      'string',
      0,
      loopIndex ?? 0,
      scopeId,
      canvasAppInstance
    );

    const text = replaceVariablesInString(
      node.nodeInfo.formValues['text'] ?? '',
      variablePayload
    );

    currentSerializedInput = text;
    return {
      result: text,
      output: text,
      followPath: undefined,
    };
  };

  const getNodeStatedHandler = () => {
    return {
      data: {
        input: currentSerializedInput,
        output: currentOutput,
      },
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    currentSerializedInput = data.input;
    currentOutput = data.output;
  };

  const Text = () => (
    <div class="text-white text-center text-2xl p-4">Text</div>
  );

  return visualNodeFactory(
    textNodeName,
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
      return [
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'text',
          label: 'Text',
          editorLanguage: 'text',
          value: values?.['text'] ?? ``,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['text']: value,
            };

            // if (updated) {
            //   updated(undefined, undefined, FlowChangeType.UpdateNode);
            // }
          },
        },
        {
          fieldType: FormFieldType.Button,
          fieldName: 'save',
          caption: 'Save',
          value: 'Save',
          onButtonClick: () => {
            if (updated) {
              updated(undefined, undefined, FlowChangeType.UpdateNode);
            }
          },
        },
      ];
    },
    (nodeInstance) => {
      // if (nodeInstance.node.nodeInfo) {
      //   nodeInstance.node.nodeInfo.isRunOnStart = true;
      // }
      canvasAppInstance = nodeInstance.contextInstance;
      rect = nodeInstance.rect;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;

      //setErrorMessage = nodeInstance.setError;
      clearErrorMessage = nodeInstance.clearError;

      if (rect && rect.resize) {
        rect?.resize();
      }
      if (node.nodeInfo && !node.nodeInfo.formValues?.['text']) {
        node.nodeInfo.formValues = {
          ...node.nodeInfo.formValues,
          ['text']: ``,
        };
      }
      if (node.nodeInfo) {
        node.nodeInfo.meta = [
          {
            type: 'json',
            propertyName: 'input',
            displayName: 'Input',
            getData: () => {
              return structuredClone(currentSerializedInput);
            },
          },
          {
            type: 'json',
            propertyName: 'output',
            displayName: 'Output',
            getData: () => {
              return structuredClone(currentOutput);
            },
          },
        ];

        if (nodeInstance.node.id) {
          const id = nodeInstance.node.id;
          canvasAppInstance.registeGetNodeStateHandler(
            id,
            getNodeStatedHandler
          );
          canvasAppInstance.registeSetNodeStateHandler(
            id,
            setNodeStatedHandler
          );
        }
      }
    },
    {
      category: 'data',
      adjustToFormContent: true,
      hasFormInPopup: true,
      hasTitlebar: false,
      hideTitle: true,
      nodeCannotBeReplaced: true,
      keepPopupOpenAfterUpdate: true,
    },
    <Text />
  );
};
