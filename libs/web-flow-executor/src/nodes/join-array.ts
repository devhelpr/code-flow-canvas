import {
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  thumbConstraints,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

const fieldName = 'joinChar';
export const joinArrayNodeName = 'join-array';
export const joinArray: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    if (!Array.isArray(input)) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const joinChar = node?.nodeInfo?.formValues?.[fieldName] ?? '';
    if (!joinChar) {
      const output = input.join('');
      return {
        result: output,
        output: output,
        followPath: undefined,
      };
    }
    const output = input.join(joinChar);

    return {
      result: output,
      output: output,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    joinArrayNodeName,
    'Join array',
    'flow-canvas',
    fieldName,
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
        thumbConstraint: thumbConstraints.value,
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: '[]',
        thumbConstraint: thumbConstraints.array,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          value: values?.[fieldName] ?? '',
          settings: {
            showLabel: false,
          },
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              [fieldName]: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];
      return formElements;
    },
    (_nodeInstance) => {
      //
    },
    {
      category: 'variables-array',
    }
  );
};
