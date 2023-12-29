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
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';

const fieldName = 'commandHandlerName';

export const sendNodeToNodeTreeNodeName = 'send-node-to-node-tree';

export const sendNodeToNodeTree: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (node && node.nodeInfo && contextInstance) {
      const commandHandlerName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      const expression = node?.nodeInfo?.formValues?.['expression'] ?? '';
      if (expression) {
        const info = compileExpressionAsInfo(expression);
        if (info) {
          const expressionFunction = (
            new Function('payload', `${info.script}`) as unknown as (
              payload?: any
            ) => any
          ).bind(info.bindings);

          let inputAsString = typeof input === 'object' ? '' : input.toString();
          let inputAsObject = {};
          if (Array.isArray(input)) {
            if (input.length > 0) {
              inputAsString = input.map((item) =>
                item.toString()
              ) as unknown as string; // dirty hack
            } else {
              inputAsString = ['------'] as unknown as string; // dirty hack
            }
          } else if (typeof input === 'object') {
            inputAsObject = input;
          }
          const payloadForExpression = {
            input: inputAsString,
            array: input,
            index: loopIndex ?? 0,
            runIteration: loopIndex ?? 0,
            random: Math.round(Math.random() * 100),
            ...payload,
            ...inputAsObject,
          };
          contextInstance?.getVariableNames(scopeId).forEach((variableName) => {
            Object.defineProperties(payloadForExpression, {
              [variableName]: {
                get: () => {
                  console.log('get', variableName);
                  return contextInstance?.getVariable(
                    variableName,
                    undefined,
                    scopeId
                  );
                },
                set: (value) => {
                  contextInstance?.setVariable(variableName, value, scopeId);
                },
              },
            });
          });

          input =
            runExpression(
              expressionFunction,
              payloadForExpression,
              false,
              info.payloadProperties
            ) || '-';
        }
      }
      console.log('commandHandlerName', commandHandlerName, input);

      if (commandHandlerName) {
        const varTreeNode = contextInstance?.getVariable(
          'parentTreeNode',
          undefined,
          scopeId
        );
        let childTreeNode =
          contextInstance?.getVariable('childTreeNode', undefined, scopeId) ||
          node?.nodeInfo?.formValues?.['childTreeNode'] ||
          'node';

        const addToId = node?.nodeInfo?.formValues?.['addToId'] ?? '';
        childTreeNode += addToId;

        const treeNode =
          varTreeNode || node?.nodeInfo?.formValues?.['treeNode'] || 'node';
        console.log(
          'treeNode',
          treeNode,
          varTreeNode,
          node?.nodeInfo?.formValues?.['treeNode'],
          childTreeNode,
          node?.nodeInfo?.formValues?.['childTreeNode']
        );
        contextInstance.executeCommandOnCommandHandler(
          commandHandlerName,
          'add',
          {
            parentTreeNode: treeNode,
            childTreeNode: childTreeNode,
            data: input,
            label: `${node?.nodeInfo?.formValues?.['label'] ?? ''}`,
          }
        );
      }
    }
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    sendNodeToNodeTreeNodeName,
    'Send node to node tree',
    'flow-canvas',
    fieldName,
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
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          value: values?.[fieldName] ?? '',
          label: 'Command handler',
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
        {
          fieldType: FormFieldType.Text,
          fieldName: 'expression',
          value: values?.['expression'] ?? '',

          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              expression: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Text,
          fieldName: 'treeNode',
          value: values?.['treeNode'] ?? '',

          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              treeNode: value,
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
      if (node.nodeInfo) {
        //node.nodeInfo.canvasAppInstance = nodeInstance.contextInstance;
      }
    },
    {
      decoratorTitle: `Send to node tree`,
    },
    undefined,
    undefined,
    true
  );
};
