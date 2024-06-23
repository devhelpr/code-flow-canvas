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
import { NodeInfo } from '../types/node-info';

const fieldName = 'stringMap';
export const replaceStringMapNodeName = 'replace-string-map';

export const replaceStringMap: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    let output = (input ?? '').toString();
    let continueLoop = true;
    const stringMap = node?.nodeInfo?.formValues?.[fieldName] ?? '';
    const map = stringMap.split('\n');
    const mode = node?.nodeInfo?.formValues?.['replaceMode'] ?? '';
    if (mode === 'string') {
      map.forEach((line: string) => {
        const parts = line.split(':');
        if (parts.length === 2) {
          output = output.replaceAll(parts[0], parts[1]);
        }
      });
    } else {
      while (continueLoop) {
        let replaceIndex = -1;
        let findWord = '';
        let replaceBy = '';
        map.forEach((line: string) => {
          const parts = line.split(':');
          if (parts.length === 2) {
            const index = output.indexOf(parts[0]);
            if (index >= 0) {
              if (replaceIndex === -1 || index < replaceIndex) {
                replaceIndex = index;
                findWord = parts[0];
                replaceBy = parts[1];
              }
            }
          }
        });

        if (replaceIndex === -1) {
          continueLoop = false;
        } else {
          replaceIndex = -1;
          output = output.replace(new RegExp(findWord, 'g'), replaceBy);
        }
      }
    }
    return {
      result: output,
      output: output,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    replaceStringMapNodeName,
    'Replace string map ',
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
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.TextArea,
          fieldName: fieldName,
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
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Select,
          fieldName: 'replaceMode',
          value: values?.['replaceMode'] ?? '',
          options: [
            { value: 'sentence', label: 'Sentence' },
            { value: 'string', label: 'string' },
          ],
          settings: {
            showLabel: true,
          },
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['replaceMode']: value,
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
      if (node.nodeInfo) {
        node.nodeInfo.formValues = {
          ...node.nodeInfo.formValues,
          [fieldName]: node.nodeInfo.formValues[fieldName] ?? '',
        };
      }
    },
    {
      hasTitlebar: true,
      hasFormInPopup: true,
      category: 'string',
    }
  );
};
