import {
  IRectNodeComponent,
  Rect,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormField, FormFieldType } from '../components/FormField';

import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { registerGLSLFunction } from './custom-glsl-functions-registry';

registerGLSLFunction(
  'gradient-color-node',
  `struct Gradient {
    float percentage;
    vec3 color;
  };`
);
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
let gradientId = 0;
export const getGradientColorNode: NodeTaskFactory<GLNodeInfo> = (
  updated: () => void
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;
  let rect: Rect<GLNodeInfo> | undefined;
  const localGradientId = gradientId;
  gradientId++;
  let isDefined = false;
  const initializeCompute = () => {
    isDefined = false;
    return;
  };
  const compute = (_input: string, _loopIndex?: number, payload?: any) => {
    const gradients = node.nodeInfo?.formValues?.['gradients'];

    const startcolor = hexToRgb(
      node.nodeInfo?.formValues?.['startcolor'] ?? '#000000',
      {
        r: 0,
        g: 0,
        b: 0,
      }
    );
    const startColorVec3 = `vec3(${startcolor?.r / 256},${
      startcolor?.g / 256
    },${startcolor?.b / 256})`;

    let preoutput = '';
    let result = 'vec3(0.0)';
    if (Array.isArray(gradients) && gradients.length > 0) {
      result = '';
      const value = payload['value'] ?? '0.'; // 0..1
      if (!isDefined) {
        preoutput = `const Gradient gradient${localGradientId}[${gradients.length}] = Gradient[](`;

        // localGradientId
        gradients.forEach((gradient: any, index: number) => {
          const color = hexToRgb(gradient.color, {
            r: 0,
            g: 0,
            b: 0,
          });
          let percentage = gradient.percentage;
          if (percentage.indexOf('.') < 0) {
            percentage = `${percentage}.0`;
          }
          preoutput += `Gradient(${percentage},vec3(${color.r / 256},${
            color.g / 256
          },${color.b / 256}))`;
          if (index < gradients.length - 1) {
            preoutput += ',';
          }
        });
        preoutput += `);`;
        preoutput += `vec3 getGradientColor${localGradientId}(float percentage) {
        vec3 startColor = ${startColorVec3};

        float totalPerc = 0.;
        for (int i = 0; i < ${gradients.length}; i++) {
              totalPerc += gradient${localGradientId}[i].percentage;          
         }

        vec3 currentColor = startColor;
        vec3 lastColor = startColor;
        float usePerc = (percentage/100.) * totalPerc;
        float currentPerc = 0.;
        for (int i = 0; i < ${gradients.length}; i++) {
          if (usePerc >= currentPerc && usePerc <= currentPerc+gradient${localGradientId}[i].percentage) {
            
            currentColor = gradient${localGradientId}[i].color;
            float mixFactor = (usePerc - currentPerc) / ((gradient${localGradientId}[i].percentage));
            currentColor = mix(lastColor, currentColor, mixFactor);
        
            break;
          }
          lastColor = gradient${localGradientId}[i].color;
          currentPerc += gradient${localGradientId}[i].percentage;       
        }
        if (percentage >= 100.) {
          if (${gradients.length} > 0) {
            currentColor = gradient${localGradientId}[${gradients.length}-1].color;
          } else {
            currentColor = startColor;
          }
        }
        return vec3(currentColor);
      }
      `;
        isDefined = true;
      }
      result = `getGradientColor${localGradientId}(${value} * 100.)`;
    }

    return {
      result: result,
      output: result,
      preoutput: preoutput,
      hasPreStatement: true,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    'gradient-color-node',
    'Gradient node',
    'flow-canvas',
    'color',
    compute,
    initializeCompute,
    false,
    200,
    100,
    [
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        name: 'value',
        thumbConstraint: 'value',
      },
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
      const initialInputType = values?.['gradients'] ?? [];
      const formElements: FormField[] = [
        {
          fieldType: FormFieldType.Color,
          fieldName: 'startcolor',
          value: values?.['startcolor'] ?? '#000000',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            console.log('color value', value);
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['startcolor']: value,
            };
            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Array,
          fieldName: 'gradients',
          value: initialInputType,
          values: initialInputType,
          formElements: [
            {
              fieldType: FormFieldType.Slider,
              fieldName: 'percentage',
              value: '',
            },
            {
              fieldType: FormFieldType.Color,
              fieldName: 'color',
              value: '',
            },
          ],
          onChange: (values: unknown[]) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['gradients']: [...values],
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
      return formElements;
    },
    (nodeInstance) => {
      rect = nodeInstance.rect;
      node = nodeInstance.node as IRectNodeComponent<GLNodeInfo>;
      if (node.nodeInfo) {
        node.nodeInfo.initializeOnCompile = true;
      }
    },
    {
      category: 'UI',
    }
  );
};
