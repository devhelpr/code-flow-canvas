import {
  FormField,
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Rect,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

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
          //values: initialInputType,
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
              conditions: {
                visibility: (values: any) => {
                  console.log('visibility values', values);
                  return values?.['testField2'] === 'on';
                },
              },
            },
            {
              fieldName: 'testField2',
              fieldType: FormFieldType.Text,
              value: '',
            },
            // {
            //   fieldName: 'color',
            //   fieldType: FormFieldType.Color,
            //   value: '',
            // },
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
        {
          fieldType: FormFieldType.Text,
          fieldName: 'testField',
          value: values?.['testField'] ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['testField']: value,
            };

            if (updated) {
              updated();
            }
          },
          conditions: {
            visibility: (values: any) => {
              console.log('visibility values', values);
              return values?.['testField2'] === true;
            },
          },
        },
        {
          fieldType: FormFieldType.Checkbox,
          fieldName: 'testField2',
          value: values?.['testField2'] ?? false,
          onChange: (value: boolean) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['testField2']: value,
            };

            if (updated) {
              updated();
            }
            rect?.resize();
          },
        },

        // {
        //   fieldType: FormFieldType.File,
        //   fieldName: 'media',
        //   value: '',
        //   onChange: (value: FileFieldValue) => {
        //     if (!node.nodeInfo) {
        //       return;
        //     }

        //     node.nodeInfo.formValues = {
        //       ...node.nodeInfo.formValues,
        //       ['media']: value,
        //     };

        //     if (updated) {
        //       updated();
        //     }
        //   },
        // },
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
