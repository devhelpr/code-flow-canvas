import {
  IFlowCanvasBase,
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  Theme,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

const fieldName = 'variableName';

export const setVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void,
  theme?: Theme
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => {
    if (contextInstance) {
      const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      console.log('setVariable', variableName, input);
      if (variableName) {
        contextInstance.setVariable(variableName, input, scopeId, runCounter);
      }
    }
    return {
      result: input,
      output: input,
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
    'set-variable',
    'Set variable',
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
        name: 'output',
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        name: 'input',
        maxConnections: -1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          label: 'Set variable',
          value: values?.[fieldName] ?? '',
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
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.getDependencies = getDependencies;
      }
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
    },
    {
      category: 'variables',
      backgroundColorClassName:
        theme?.referenceVariableBackgroundColorClassName,
    }
  );
};
