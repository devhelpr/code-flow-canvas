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
export const getDictionarySizeNodeName = 'get-dictionary-size';

export const getDictionarySize: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };

  const compute = (
    _input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if (contextInstance) {
      const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      if (!variableName) {
        return {
          result: undefined,
          output: undefined,
          stop: true,
          followPath: undefined,
        };
      }
      if (variableName) {
        const data = contextInstance.getVariableInfo(variableName, scopeId);
        if (data && data.data) {
          const dictionarySize = Object.keys(data.data).length;
          return {
            result: dictionarySize,
            output: dictionarySize,
            followPath: undefined,
          };
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
    getDictionarySizeNodeName,
    'Dictionary size',
    'flow-canvas',
    'variableName',
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
        maxConnections: 1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
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
        textNode.innerHTML = `'${node.nodeInfo?.formValues?.[fieldName]}' dictionary<br /> size`;
      }
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
      category: 'variables-dictionary',
    }
  );
};
