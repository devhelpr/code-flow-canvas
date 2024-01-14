import {
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';

export const getValueNode: NodeTaskFactory<any> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<any>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    let value = parseFloat(
      node.nodeInfo?.formValues?.['value'] ?? 0
    ).toString();
    if (value.indexOf('.') < 0) {
      value = `${value}.0`;
    }
    return {
      result: `${value}`,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    'value-node',
    'Value',
    'flow-canvas',
    'value',
    compute,
    initializeCompute,
    false,
    200,
    100,
    [
      {
        thumbType: ThumbType.StartConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.start,
        color: 'white',
        label: ' ',
        thumbConstraint: 'value',
        maxConnections: -1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Slider,
          fieldName: 'value',
          value: values?.['value'] ?? '',
          min: -1.0,
          max: 1.0,
          step: 0.01,
          settings: {
            showLabel: false,
          },
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['value']: value,
            };
            if (updated) {
              updated();
            }
          },
        },
      ];
      return formElements;
    },
    (nodeInstance) => {
      node = nodeInstance.node as IRectNodeComponent<any>;
    },
    {
      category: 'UI',
    }
  );
};
