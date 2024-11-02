import {
  IFlowCanvasBase,
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
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

const fieldName = 'variableName';
export const setArrayValueByIndexVariableNodeName =
  'set-array-variable-by-index';

export const setArrayValueByIndexVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const values = {
    index: undefined,
    value: undefined,
  } as {
    index: undefined | string;
    value: undefined | string;
  };

  const initializeCompute = () => {
    values.index = undefined;
    values.value = undefined;
    return;
  };

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (thumbName === 'index') {
      values.index = input ?? undefined;
    } else if (thumbName === 'value') {
      values.value = input ?? undefined;
    }

    if (values.index === undefined || values.value === undefined) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }

    if (contextInstance) {
      const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      if (variableName) {
        contextInstance.setVariable(
          variableName,
          {
            index: values.index,
            value: values.value,
          },
          scopeId
        );
      }
    }
    const value = values.value;
    values.index = undefined;
    values.value = undefined;

    return {
      result: value,
      output: value,
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
          startNodeId: node.id,
          endNodeId: variableNode.id,
        });
      }
    }
    return dependencies;
  };

  return visualNodeFactory(
    setArrayValueByIndexVariableNodeName,
    'Set array value by index',
    'flow-canvas',
    'variableName',
    compute,
    initializeCompute,
    false,
    280,
    200,
    [
      {
        thumbType: ThumbType.StartConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.start,
        color: 'white',
        label: ' ',
      },
      {
        thumbType: ThumbType.EndConnectorLeft,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        prefixLabel: 'index',
        name: 'index',
        maxConnections: 1,
      },
      {
        thumbType: ThumbType.EndConnectorLeft,
        thumbIndex: 1,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        prefixLabel: 'value',
        name: 'value',
        maxConnections: 1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          value: values?.[fieldName] ?? '',
          // settings: {
          //   showLabel: false,
          // },
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
      contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.getDependencies = getDependencies;
      }

      const domElement = nodeInstance.node.domElement as HTMLElement;
      const textNode = domElement.querySelector('.inner-node .node-content');
      if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
        textNode.innerHTML = `Set array value in<br />'${node.nodeInfo?.formValues?.[fieldName]}' array`;
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
