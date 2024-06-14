import {
  CanvasAppInstance,
  IRectNodeComponent,
  Theme,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { FormField, FormFieldType } from '../components/FormField';

const fieldName = 'thumb-output';
const labelName = 'Thumb output';
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

export const getThumbOutputNode: NodeTaskFactory<GLNodeInfo> = (
  updated: () => void,
  theme?: Theme
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;
  let canvasApp: CanvasAppInstance<GLNodeInfo>;
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
            { value: 'vec2', label: 'vec2' },
            { value: 'vec3', label: 'vec3' },
            { value: 'constant-value', label: 'constant-value' },
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
                  if (
                    c.startNodeThumb?.thumbConstraint !== value &&
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
      node = nodeInstance.node as IRectNodeComponent<GLNodeInfo>;
      canvasApp = nodeInstance.contextInstance;
    },
    {
      hasTitlebar: false,
      hideFromNodeTypeSelector: true,
      backgroundColorClassName:
        theme?.compositionThumbOutputNodeBackground ?? 'bg-yellow-500',
      textColorClassName: theme?.compositionThumbOutputNodeText ?? 'text-black',
      category: 'Compositions',
    },
    undefined,
    undefined,
    undefined,
    true
  );
};
