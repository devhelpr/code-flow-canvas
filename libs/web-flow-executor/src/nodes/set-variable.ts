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
  IComputeResult,
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
  const computeAsync = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => {
    return new Promise<IComputeResult>((resolve) => {
      if (contextInstance) {
        const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
        if (variableName) {
          contextInstance
            .setVariable(variableName, input, scopeId, runCounter)
            .then((result) => {
              if (result) {
                resolve({
                  result: input,
                  output: input,
                  followPath: undefined,
                });
              } else {
                resolve({
                  result: input,
                  output: input,
                  followPath: undefined,
                  stop: true,
                });
              }
            });

          return;
        }
      }
      resolve({
        result: input,
        output: input,
        followPath: undefined,
      });
    });
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
    computeAsync,
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
        maxConnections: -1,
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
    },
    undefined,
    true
  );
};
