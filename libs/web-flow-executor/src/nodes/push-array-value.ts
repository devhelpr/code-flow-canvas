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
  IComputeResult,
  Theme,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

const fieldName = 'variableName';
export const pushValueToArrayVariableNodeName = 'push-value-to-array-variable';

export const pushArrayVariable: NodeTaskFactory<NodeInfo> = (
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
    scopeId?: string
  ) => {
    return new Promise<IComputeResult>((resolve) => {
      if (contextInstance) {
        const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
        if (variableName) {
          let shouldPush = false;
          if (Array.isArray(input)) {
            shouldPush = input.length > 0;
          } else {
            shouldPush = input !== undefined && input !== '' && input !== null;
          }
          if (shouldPush) {
            contextInstance
              .setVariable(variableName, { push: input }, scopeId)
              .then((_result) => {
                resolve({
                  result: input,
                  output: input,
                  followPath: undefined,
                });
              });
            return;
          }
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
    pushValueToArrayVariableNodeName,
    'Push value to array',
    'flow-canvas',
    'variableName',
    computeAsync,
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
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        //prefixLabel: 'value',
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
      if (domElement) {
        const textNode = domElement?.querySelector('.inner-node .node-content');
        if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
          textNode.innerHTML = `Push to '${node.nodeInfo?.formValues?.[fieldName]}' array`;
        }
      }
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
      category: 'variables-array',
      backgroundColorClassName:
        theme?.referenceVariableBackgroundColorClassName,
    },
    undefined,
    true
  );
};
