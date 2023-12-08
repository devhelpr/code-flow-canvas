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

const fieldName = 'stringMap';
export const replaceStringMapNodeName = 'replace-string-map';

export const replaceStringMap: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
    let output = (input ?? '').toString();
    let continueLoop = true;
    const stringMap = node?.nodeInfo?.formValues?.[fieldName] ?? '';
    const map = stringMap.split('\n');

    while (continueLoop) {
      let replaceIndex = -1;
      let findWord = '';
      let replaceBy = '';
      map.forEach((line: string, mapIndex: number) => {
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
      ];
      return formElements;
    },
    (nodeInstance) => {
      contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node;
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
    }
  );
};
