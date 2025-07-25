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
import { transformJSON } from './json-utils/transform-json';
import { getVariablePayloadInputUtils } from './variable-payload-input-utils/variable-payload-input-utils';

const fieldName = 'testt-input';
const labelName = 'JSON';
export const jsonNodeName = 'json-node';
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

export const getRawJsonNode: NodeTaskFactory<NodeInfo> = (
  updated: (
    shouldClearExecutionHistory?: boolean,
    isStoreOnly?: boolean,
    flowChangeType?: FlowChangeType
  ) => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let rect: Rect<NodeInfo> | undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let setErrorMessage: undefined | ((message: string) => void) = undefined;
  let clearErrorMessage: undefined | (() => void) = undefined;
  let currentOutput: any = undefined;
  let currentSerializedInput: any = undefined;
  const initializeCompute = () => {
    return;
  };

  const compute = (
    input: string,
    _loopIndex?: number,
    payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    clearErrorMessage?.();
    if (!node.nodeInfo || !node.nodeInfo.formValues?.['json']) {
      return {
        result: false,
        output: false,
        stop: true,
        followPath: undefined,
      };
    }
    try {
      // const openAIKey = canvasAppInstance?.isContextOnly
      //   ? (typeof process !== 'undefined' &&
      //       process?.env?.['openai_api_key']) ??
      //     ''
      //   : canvasAppInstance?.getTempData('openai-key') ?? '';
      const openAIKey = canvasAppInstance?.getTempData('openai-key') ?? '';
      const googleGeminiAIKey =
        canvasAppInstance?.getTempData('googleGeminiAI-key') ?? '';
      const payloadForExpression = getVariablePayloadInputUtils(
        input,
        payload,
        'number', // TODO: what is the type of the input??? .. used to be 'string' .. but then expression can fail
        -1,
        -1,
        scopeId,
        canvasAppInstance
      );

      currentSerializedInput = structuredClone(payloadForExpression);

      canvasAppInstance?.getVariableNames(scopeId).forEach((variableName) => {
        const variableValue = canvasAppInstance?.getVariable(
          variableName,
          undefined,
          scopeId
        );
        currentSerializedInput[variableName] = variableValue;
      });

      const json = JSON.parse(
        node.nodeInfo.formValues['json']
          .replace('[openai-key]', openAIKey)
          .replace('[googleGeminiAI-key]', googleGeminiAIKey)
      );

      const transformedJson = transformJSON(
        json,
        undefined,
        '',
        payloadForExpression
      );

      currentOutput = transformedJson;

      return {
        result: transformedJson,
        output: transformedJson,
        followPath: undefined,
      };
    } catch (e: any) {
      setErrorMessage?.(e?.message ?? 'Error parsing JSON');
      return {
        result: false,
        output: false,
        stop: true,
        followPath: undefined,
      };
    }
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
    <div class="text-white text-center text-2xl p-4">JSON Mapper</div>
  );

  return visualNodeFactory(
    jsonNodeName,
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
          fieldName: 'json',
          label: 'Json',
          editorLanguage: 'json',
          value:
            values?.['json'] ??
            `{
}`,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['json']: value,
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

      setErrorMessage = nodeInstance.setError;
      clearErrorMessage = nodeInstance.clearError;

      if (rect && rect.resize) {
        rect?.resize();
      }
      if (node.nodeInfo && !node.nodeInfo.formValues?.['json']) {
        node.nodeInfo.formValues = {
          ...node.nodeInfo.formValues,
          ['json']: `{
}`,
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
