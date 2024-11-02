import {
  IFlowCanvasBase,
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
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

const fieldName = 'variableName';
export const popArrayVariableNodeName = 'pop-array-value';

export const popArrayValue: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let popMode = 'end';
  const initializeCompute = () => {
    popMode = node?.nodeInfo?.formValues?.['popMode'] ?? 'end';
    return;
  };

  const compute = (
    _input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    let data: any[] = [];
    if (contextInstance) {
      const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      if (variableName) {
        data = contextInstance.getVariable(
          variableName,
          undefined,
          scopeId
        ) as unknown as any[];
        let poppedItem: any | undefined = undefined;
        if (data.length > 0) {
          if (popMode === 'begin') {
            poppedItem = data.shift();
          } else {
            poppedItem = data.pop();
          }
          contextInstance.setVariable(variableName, data, scopeId);

          if (poppedItem !== undefined) {
            return {
              result: poppedItem,
              output: poppedItem,
              followPath: undefined,
            };
          }
        }
      }
    }
    return {
      result: undefined,
      output: undefined,
      stop: true,
      followPath: undefined,
    };
  };

  const getDependencies = (): { startNodeId: string; endNodeId: string }[] => {
    const dependencies: { startNodeId: string; endNodeId: string }[] = [];
    const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
    if (variableName && contextInstance) {
      const variableNode = getNodeByVariableName(variableName, contextInstance);
      if (variableNode) {
        dependencies.push({
          startNodeId: variableNode.id,
          endNodeId: node.id,
        });
      }
    }
    return dependencies;
  };

  return visualNodeFactory(
    popArrayVariableNodeName,
    `Pop value from array`,
    'flow-canvas',
    'variableName',
    compute,
    initializeCompute,
    false,
    300,
    100,
    [
      {
        thumbType: ThumbType.StartConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.start,
        color: 'white',
        label: ' ',
        thumbConstraint: thumbConstraints.value,
        maxConnections: 1,
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        maxConnections: 1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          value: values?.[fieldName] ?? '',
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
        {
          fieldType: FormFieldType.Select,
          fieldName: 'popMode',
          value: values?.['popMode'] ?? 'end',
          options: [
            {
              value: 'end',
              label: 'End',
            },
            {
              value: 'begin',
              label: 'Begin',
            },
          ],
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              popMode: value,
            };
            popMode = value;
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
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.getDependencies = getDependencies;
      }

      const domElement = nodeInstance.node.domElement as HTMLElement;
      if (domElement) {
        const textNode = domElement.querySelector('.inner-node .node-content');
        if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
          textNode.innerHTML = `Pop value from ${
            node.nodeInfo?.formValues?.['popMode'] ?? 'end'
          }<br />'${node.nodeInfo?.formValues?.[fieldName]}' array`;
        }
      }
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
      category: 'variables-array',
    }
  );
};
