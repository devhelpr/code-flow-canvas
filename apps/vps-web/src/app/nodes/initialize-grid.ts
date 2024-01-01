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
import { thumbConstraints } from '../node-task-registry/thumbConstraints';

const fieldName = 'variableName';
export const initializeGridVariableNodeName = 'initialize-grid-variable';

export const initializeGridVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  const values = {
    columns: undefined,
    rows: undefined,
  } as {
    columns: undefined | number;
    rows: undefined | number;
  };

  const initializeCompute = () => {
    values.columns = undefined;
    values.rows = undefined;
    return;
  };

  const compute = (
    input: string,
    _pathExecution?: RunNodeResult<NodeInfo>[],
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (thumbName === 'columns') {
      values.columns =
        typeof input === 'number' ? input : parseInt(input) ?? undefined;
    } else if (thumbName === 'rows') {
      values.rows =
        typeof input === 'number' ? input : parseInt(input) ?? undefined;
    }

    if (values.rows === undefined || values.columns === undefined) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }

    if (contextInstance) {
      const variableName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      console.log('setDictionaryVariable', variableName, input);
      if (variableName) {
        contextInstance.initializeVariableDataStructure(
          variableName,
          {
            columnCount: values.columns,
            rowCount: values.rows,
          },
          scopeId
        );
      }
    }
    values.rows = undefined;
    values.columns = undefined;

    return {
      result: '',
      output: '',
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
    initializeGridVariableNodeName,
    'Initialize grid',
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
        prefixLabel: 'rows',
        name: 'rows',
        maxConnections: 1,
        thumbConstraint: thumbConstraints.value,
      },
      {
        thumbType: ThumbType.EndConnectorLeft,
        thumbIndex: 1,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        prefixLabel: 'columns',
        name: 'columns',
        maxConnections: 1,
        thumbConstraint: thumbConstraints.value,
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
        textNode.innerHTML = `Initialize grid<br />'${node.nodeInfo?.formValues?.[fieldName]}'`;
      }
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
    }
  );
};
