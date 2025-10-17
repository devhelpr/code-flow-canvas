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

const fieldName = 'regex';
export const runRegexNodeName = 'regular-expression';
export const runRegularExpression: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    const regex = node?.nodeInfo?.formValues?.[fieldName] ?? '';
    if (!regex) {
      return {
        result: input,
        output: input,
        stop: true,
        followPath: undefined,
      };
    }
    const regexObj = new RegExp(regex);
    const result = input.match(regexObj);
    if (result) {
      const value = parseFloat(result[0]);

      return {
        result: value,
        output: value,
        followPath: undefined,
      };
    }

    return {
      result: input,
      output: input,
      stop: true,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    runRegexNodeName,
    'Regular expression',
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
        label: ' ',
        thumbConstraint: thumbConstraints.value,
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

            if (updated) {
              updated();
            }
          },
        },
      ];
      return formElements;
    },
    (nodeInstance) => {
      node = nodeInstance.node as any;
    },
    {
      category: 'string',
    }
  );
};
