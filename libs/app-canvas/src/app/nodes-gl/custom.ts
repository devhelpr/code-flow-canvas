import {
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';

import { GLNodeInfo } from '../types/gl-node-info';

// this is the escape hatch

const fieldName = 'custom';
const labelName = 'Custom';
const nodeName = 'custom-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    //thumbConstraint: thumbConstraint,
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: 'a',

    name: 'value',
    thumbConstraint: thumbConstraint,
    prefixLabel: ' ',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: 'b',

    name: 'z',
    thumbConstraint: 'vec2',
    prefixLabel: ' ',
  },
];

export const getCustomNode: NodeTaskFactory<GLNodeInfo> = (
  updated: () => void
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    let custom = node?.nodeInfo?.formValues?.custom ?? '';
    const value = payload?.['value'];
    const z = payload?.['z'];
    custom = custom.replaceAll('$a', value);
    custom = custom.replaceAll('$b', z);
    console.log('custom', custom);
    // $a - log2(log2(dot($b,$b))) + 4.0
    return {
      //result: `${value} - log2(log2(dot(${z},${z}))) + 4.0`,
      result: custom,
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
    (values?: InitialValues) => {
      return [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          settings: {
            showLabel: false,
          },
          label: labelName,
          value: values?.['custom'] ?? '',
          onChange: (value: string) => {
            if (!node?.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              custom: value,
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
      node = nodeInstance.node as unknown as IRectNodeComponent<GLNodeInfo>;
    },
    {
      hasTitlebar: true,
      category: 'Custom',
    }
  );
};
