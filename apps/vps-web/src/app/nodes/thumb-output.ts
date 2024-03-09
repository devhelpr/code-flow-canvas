import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { NodeInfo } from '../types/node-info';
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

export const getThumbOutputNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasApp: CanvasAppInstance<NodeInfo>;
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
      ];
    },
    (nodeInstance) => {
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      canvasApp = nodeInstance.contextInstance;
    },
    {
      hasTitlebar: false,
      hideFromNodeTypeSelector: true,
      backgroundColorClassName: 'bg-yellow-500',
      textColorClassName: 'text-black',
      category: 'Compositions',
    },
    undefined,
    undefined,
    undefined,
    true
  );
};
