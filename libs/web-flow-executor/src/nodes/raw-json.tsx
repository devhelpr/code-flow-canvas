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
import { getVariablePayloadInputUtils } from './variable-payload-input-utils.ts/variable-payload-input-utils';

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
      const openAIKey = canvasAppInstance?.isContextOnly
        ? process.env?.['openai_api_key'] ?? ''
        : canvasAppInstance?.getTempData('openai-key') ?? '';

      const payloadForExpression = getVariablePayloadInputUtils(
        input,
        payload,
        'string',
        -1,
        -1,
        scopeId,
        canvasAppInstance
      );

      const json = JSON.parse(
        node.nodeInfo.formValues['json'].replace('[openai-key]', openAIKey)
      );

      const transformedJson = transformJSON(
        json,
        undefined,
        '',
        payloadForExpression
      );

      console.log('transformedJson', transformedJson);

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
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.isRunOnStart = true;
      }
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
