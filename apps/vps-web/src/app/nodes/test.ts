import {
  IRectNodeComponent,
  Rect,
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

const fieldName = 'testt-input';
const labelName = 'Test input';
const nodeName = 'test-node';
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

export const getTestNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let rect: Rect<NodeInfo> | undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, _loopIndex?: number, _payload?: any) => {
    const result = node.nodeInfo?.formValues?.['array'] ?? [];
    return {
      result: result,
      output: result,
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
      const initialInputType = values?.['array'] ?? [];
      return [
        {
          fieldType: FormFieldType.Array,
          fieldName: 'array',
          value: initialInputType,
          values: initialInputType,
          //[
          //   {
          //     testField: 'test',
          //     testField2: 'test2',
          //   },
          // ],
          formElements: [
            {
              fieldName: 'testField',
              fieldType: FormFieldType.Text,
              value: '',
            },
            {
              fieldName: 'testField2',
              fieldType: FormFieldType.Text,
              value: '',
            },
            {
              fieldName: 'color',
              fieldType: FormFieldType.Color,
              value: '',
            },
          ],
          onChange: (values: unknown[]) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['array']: [...values],
            };

            if (updated) {
              updated();
            }
            if (rect) {
              rect.resize();
            }
          },
        },
      ];
    },
    (nodeInstance) => {
      rect = nodeInstance.rect;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      rect?.resize();
    },
    {
      category: 'Test',
      adjustToFormContent: true,
    }
  );
};
