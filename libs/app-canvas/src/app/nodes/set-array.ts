import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { thumbConstraints } from '../node-task-registry/thumbConstraints';
import { RangeValueType } from '../types/value-type';

const isInputOfRangeValueType = (input: RangeValueType) => {
  if (typeof input === 'object' && input) {
    return (
      input.min !== undefined &&
      input.max !== undefined &&
      input.step !== undefined &&
      typeof input.min === 'number' &&
      typeof input.max === 'number' &&
      typeof input.step === 'number' &&
      !isNaN(input.min) &&
      !isNaN(input.max) &&
      !isNaN(input.step)
    );
  }
  return false;
};

const fieldName = 'variableName';
export const setArrayNodeName = 'set-array-variable';

export const setArrayVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if (
      input === undefined ||
      (!Array.isArray(input) &&
        !isInputOfRangeValueType(input as unknown as RangeValueType))
    ) {
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
        let forEachLength = 0;
        let startIndex = 0;
        let step = 1;
        const rangeInput = input as unknown as RangeValueType;
        if (
          isInputOfRangeValueType(rangeInput) &&
          rangeInput.max !== undefined &&
          rangeInput.min !== undefined &&
          rangeInput.step !== undefined
        ) {
          startIndex = rangeInput.min;
          step = rangeInput.step;
          forEachLength = rangeInput.max;

          const rangeArray: number[] = [];
          for (let index = startIndex; index <= forEachLength; index += step) {
            rangeArray.push(index);
          }

          contextInstance.setVariable(variableName, rangeArray, scopeId);
          /*Math.floor(
            (rangeInput.max - rangeInput.min) / rangeInput.step
          );
          */
        } else {
          contextInstance.setVariable(variableName, [...input], scopeId);
        }
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
    setArrayNodeName,
    'Set array',
    'flow-canvas',
    'variableName',
    compute,
    initializeCompute,
    false,
    200,
    200,
    [
      {
        thumbType: ThumbType.StartConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.start,
        color: 'white',
        label: '[]',
        maxConnections: 1,
        thumbConstraint: thumbConstraints.array,
      },
      {
        thumbType: ThumbType.EndConnectorLeft,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: '[]',
        name: 'array',
        maxConnections: 1,
        thumbConstraint: ['array', 'range'],
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
      const textNode = domElement.querySelector('.inner-node .node-content');
      if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
        textNode.innerHTML = `Set array<br />'${node.nodeInfo?.formValues?.[fieldName]}'`;
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
