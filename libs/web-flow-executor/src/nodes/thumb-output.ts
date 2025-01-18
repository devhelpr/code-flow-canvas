import {
  IFlowCanvasBase,
  FormField,
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Theme,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

const fieldName = 'thumb-output';
const labelName = 'Output';
const nodeName = 'thumb-output';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
];

export const getThumbOutputNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void,
  theme?: Theme
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasApp: IFlowCanvasBase<NodeInfo>;
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
    const nodeInfo: any = node.nodeInfo;
    if (nodeInfo?.onFinish) {
      nodeInfo.onFinish(input, payload, node, scopeId);
    }
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  const result = visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    100,
    100,
    thumbs,
    (values?: InitialValues): FormField[] => {
      const initialInputType = values?.['valueType'] ?? 'value';
      return [
        {
          fieldType: FormFieldType.Select,
          fieldName: 'valueType',
          value: initialInputType,
          options: [
            { value: 'default', label: 'default' },
            { value: 'value', label: 'value' },
            { value: 'array', label: 'array' },
            { value: 'object', label: 'object' },
            { value: 'number', label: 'number' },
            { value: 'string', label: 'string' },
            { value: 'set', label: 'set' },
            { value: 'range', label: 'range' },
          ],
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['valueType']: value,
            };

            if (node.thumbConnectors?.[0]) {
              node.thumbConnectors[0].thumbConstraint =
                value === 'default' ? '' : value;
              if (node.connections) {
                node.connections = node.connections.filter((c) => {
                  if (
                    (c.startNodeThumb?.thumbConstraint === 'default'
                      ? ''
                      : c.startNodeThumb?.thumbConstraint) !== value &&
                    c.startNode
                  ) {
                    c.startNode.connections = c.startNode?.connections?.filter(
                      (con) => con.id !== c.id
                    );
                    c.startNodeThumb = undefined;
                    if (canvasApp) {
                      canvasApp.elements.delete(c.id);
                      c.domElement.remove();
                    }
                    return false;
                  }

                  return true;
                });
              }
            }
            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Text,
          fieldName: 'thumbName',
          value: values?.['thumbName'] ?? 'output',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['thumbName']: value,
            };

            if (updated) {
              updated();
            }
          },
        },
      ];
    },
    (nodeInstance) => {
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      canvasApp = nodeInstance.contextInstance;
    },
    {
      hasTitlebar: false,
      hideFromNodeTypeSelector: true,
      backgroundColorClassName:
        theme?.compositionThumbOutputNodeBackground ?? 'bg-yellow-500',
      textColorClassName: theme?.compositionThumbOutputNodeText ?? 'text-black',
      category: 'Compositions',
      hasSettingsPopup: false,
      hasFormInPopup: true,
      additionalInnerNodeClassNames: 'rounded-full items-center justify-center',
      hasStaticWidthHeight: true,
      noFlexAutoInNodeContentWrapper: true,
      additionalClassNames:
        'rounded-full bg-yellow-500 border-[black] border-2 border-solid h-[90px] w-[90px] flex-[0_0_auto]',
    },
    undefined,
    undefined,
    undefined,
    true
  ) as unknown as NodeTask<NodeInfo>;

  return result;
};
