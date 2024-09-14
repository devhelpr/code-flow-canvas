import {
  FlowCanvas,
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

const fieldName = 'thumb-input';
const labelName = 'Thumb input';
const nodeName = 'thumb-input';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
];

export const getThumbInputNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void,
  theme?: Theme
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasApp: FlowCanvas<NodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, _payload?: any) => {
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    nodeName,
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
      const initialInputType = values?.['valueType'] ?? 'value';
      return [
        {
          fieldType: FormFieldType.Select,
          fieldName: 'valueType',
          value: initialInputType,
          options: [
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
              node.thumbConnectors[0].thumbConstraint = value;
              if (node.connections) {
                node.connections = node.connections.filter((c) => {
                  if (c.endNodeThumb?.thumbConstraint !== value && c.endNode) {
                    c.endNode.connections = c.endNode?.connections?.filter(
                      (con) => con !== c
                    );
                    c.endNodeThumb = undefined;
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
          value: values?.['thumbName'] ?? 'input',
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
        theme?.compositionThumbInputNodeBackground ?? 'bg-yellow-300',
      textColorClassName: theme?.compositionThumbInputNodeText ?? 'text-black',
      category: 'Compositions',
    },
    undefined,
    undefined,
    undefined,
    true
  ) as unknown as NodeTask<NodeInfo>;
};
