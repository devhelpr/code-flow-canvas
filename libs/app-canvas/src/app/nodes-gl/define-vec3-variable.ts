import {
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
import { GLNodeInfo } from '../types/gl-node-info';
import { FormFieldType } from '../components/FormField';
import { vec3Type } from '../gl-types/float-vec2-vec3';

const fieldName = 'variableName';
const labelName = 'Variable';
const nodeName = 'define-color-variable-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: 'v3',
    thumbConstraint: 'vec3',
    name: 'vector',
    prefixLabel: '',
  },
];

export const getDefineColorVariableNode: NodeTaskFactory<GLNodeInfo> = (
  updated: () => void
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, _loopIndex?: number, payload?: any) => {
    const variableName = node?.nodeInfo?.formValues?.variableName ?? '';
    const vector = payload?.['vector'] ?? `${vec3Type}(0., 0., 0.)`;
    const shaderCode = `vec3 ${variableName} = ${vector};`;
    return {
      result: shaderCode,
      output: shaderCode,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    nodeName,
    'Define color variable',
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    150,
    thumbs,
    (values?: InitialValues) => {
      return [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          settings: {
            showLabel: false,
          },
          label: labelName,
          value: values?.['variableName'] ?? '',
          onChange: (value: string) => {
            if (!node?.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              variableName: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];
    },
    (nodeInstance) => {
      node = nodeInstance.node as IRectNodeComponent<GLNodeInfo>;
    },
    {
      hasTitlebar: true,
      category: 'variables',
    }
  );
};
