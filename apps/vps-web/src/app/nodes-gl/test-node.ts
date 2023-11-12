import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';

const fieldName = 'test';

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

export const getTestNode: NodeTaskFactory<any> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<any>;
  let contextInstance: CanvasAppInstance<any> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
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
    'test-node',
    'Test node',
    'flow-canvas',
    'test',
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
        thumbConstraint: 'color',
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        // {
        //   fieldType: FormFieldType.Slider,
        //   fieldName: fieldName,
        //   value: values?.[fieldName] ?? '',
        //   settings: {
        //     showLabel: false,
        //   },
        //   onChange: (value: string) => {
        //     if (!node.nodeInfo) {
        //       return;
        //     }
        //     node.nodeInfo.formValues = {
        //       ...node.nodeInfo.formValues,
        //       [fieldName]: value,
        //     };
        //     if (updated) {
        //       updated();
        //     }
        //   },
        // },
        {
          fieldType: FormFieldType.Color,
          fieldName: 'color',
          value: values?.['color'] ?? '',

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
      contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node;
    }
  );
};
