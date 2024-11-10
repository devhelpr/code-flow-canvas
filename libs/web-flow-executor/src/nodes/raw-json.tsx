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

const fieldName = 'testt-input';
const labelName = 'JSON';
export const jsonNodeName = 'json-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'input',
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
  const initializeCompute = () => {
    return;
  };

  const compute = (_input: string, _loopIndex?: number, _payload?: any) => {
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

      const json = JSON.parse(
        node.nodeInfo.formValues['json'].replace('[openai-key]', openAIKey)
      );

      return {
        result: json,
        output: json,
        followPath: undefined,
      };
    } catch (e) {
      return {
        result: false,
        output: false,
        stop: true,
        followPath: undefined,
      };
    }
  };

  const Text = () => (
    <div class="text-white text-center font-bold text-4xl p-4">JSON</div>
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
      hasTitlebar: true,
      nodeCannotBeReplaced: true,
      keepPopupOpenAfterUpdate: true,
    },
    <Text />
  );
};
