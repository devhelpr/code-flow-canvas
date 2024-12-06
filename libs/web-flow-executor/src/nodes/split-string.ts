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

const fieldName = 'splitBy';
export const splitStringNodeName = 'split-string';
export const splitString: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, _payload?: any) => {
    let splitBy = node?.nodeInfo?.formValues?.[fieldName] ?? '';
    if (!splitBy) {
      const array = Array.from(input);
      return {
        result: array,
        output: array,
        followPath: undefined,
      };
    }
    if (splitBy.toUpperCase() === 'SPACE') {
      splitBy = ' ';
    } else if (splitBy.toUpperCase() === 'COMMA') {
      splitBy = ',';
    } else if (splitBy.toUpperCase() === 'NEWLINE') {
      splitBy = '\n';
    } else if (splitBy.toUpperCase() === 'DOUBLENEWLINE') {
      splitBy = '\n\n';
    } else if (splitBy.toUpperCase() === 'TAB') {
      splitBy = '\t';
    } else if (splitBy.toUpperCase() === 'PIPE') {
      splitBy = '|';
    } else if (splitBy.toUpperCase() === 'CRLF') {
      splitBy = '\r\n';
    } else if (splitBy.toUpperCase() === 'WHITESPACE') {
      splitBy = /\s+/;
    }
    const splitLines = (input ?? '').toString().trim().split(splitBy);

    if (splitLines) {
      return {
        result: splitLines,
        output: splitLines,
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
    splitStringNodeName,
    'Split String',
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
        label: '[]',
        thumbConstraint: thumbConstraints.array,
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        //thumbConstraint: thumbConstraints.value,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          label: 'Split by',
          value: values?.[fieldName] ?? '',
          settings: {
            showLabel: true,
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
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
    },
    {
      category: 'string',
    }
  );
};
