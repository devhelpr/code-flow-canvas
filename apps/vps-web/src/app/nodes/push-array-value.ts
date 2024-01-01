import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';
import { visualNodeFactory } from '../node-task-registry/createRectNode';

const fieldName = 'variableName';
export const pushValueToArrayVariableNodeName = 'push-value-to-array-variable';

export const pushArrayVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };

  const compute = (
    input: string,
    _pathExecution?: RunNodeResult<NodeInfo>[],
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if (contextInstance) {
      const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      if (variableName) {
        contextInstance.setVariable(variableName, { push: input }, scopeId);
        console.log('pushArrayVariable', variableName, input);
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
    pushValueToArrayVariableNodeName,
    'Push value to array',
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
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.getDependencies = getDependencies;
      }

      const domElement = nodeInstance.node.domElement as HTMLElement;
      const textNode = domElement.querySelector('.inner-node');
      if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
        textNode.innerHTML = `Push to '${node.nodeInfo?.formValues?.[fieldName]}' array`;
      }
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
    }
  );
};
