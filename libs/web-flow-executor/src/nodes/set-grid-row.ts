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
export const setGridRowVariableNodeName = 'set-grid-row-variable';

export const setGridRowVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const values = {
    row: undefined,
    array: undefined,
  } as {
    row: undefined | number;
    array: undefined | any[];
  };

  const initializeCompute = () => {
    values.row = undefined;
    values.array = undefined;
    return;
  };

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (thumbName === 'row') {
      values.row =
        typeof input === 'number' ? input : parseInt(input) ?? undefined;
    } else if (thumbName === 'array') {
      if (Array.isArray(input)) {
        values.array = input ?? undefined;
      }
    }

    if (values.row === undefined || values.array === undefined) {
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
            row: values.row,
            array: values.array,
            setMode: 'fillRow',
          },
          scopeId
        );
      }
    }
    const value = values.array;
    values.array = undefined;
    values.row = undefined;

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
    setGridRowVariableNodeName,
    'Set grid row',
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
        label: '[]',
        name: 'array',
        maxConnections: 1,
        thumbConstraint: thumbConstraints.array,
      },
      {
        thumbType: ThumbType.EndConnectorLeft,
        thumbIndex: 1,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        prefixLabel: 'row',
        name: 'row',
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
      node = nodeInstance.node as any;
      contextInstance = nodeInstance.contextInstance;
      if (nodeInstance.node.nodeInfo) {
        nodeInstance.node.nodeInfo.getDependencies = getDependencies;
      }

      const domElement = nodeInstance.node.domElement as HTMLElement;
      const textNode = domElement.querySelector('.inner-node .node-content');
      if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
        textNode.innerHTML = `Set grid row in<br />'${node.nodeInfo?.formValues?.[fieldName]}'`;
      }
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
      category: 'variables-grid',
    }
  );
};
