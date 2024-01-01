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

function hexToRgb(
  hex: string,
  defaultColor: { r: number; g: number; b: number }
) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: defaultColor.r,
        g: defaultColor.g,
        b: defaultColor.b,
      };
}

export const getColorNode: NodeTaskFactory<any> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<any>;

  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    const color = hexToRgb(node.nodeInfo?.formValues?.['color'] ?? '#000000', {
      r: 0,
      g: 0,
      b: 0,
    });

    return {
      result: `vec3(${color?.r / 256},${color?.g / 256},${color?.b / 256})`,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    'color-node',
    'Color node',
    'flow-canvas',
    'color',
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
        thumbConstraint: 'vec3',
        maxConnections: -1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Color,
          fieldName: 'color',
          value: values?.['color'] ?? '',
          settings: {
            showLabel: false,
          },
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            console.log('color value', value);
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['color']: value,
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
    }
  );
};
