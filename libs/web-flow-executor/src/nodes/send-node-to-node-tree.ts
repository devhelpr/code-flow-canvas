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
  let contextInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    loopIndex?: number,
    payload?: any,
    _thumbName?: string,
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
                  //console.log('get', variableName);
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
            ) ?? '-';
        }
      }
      //console.log('commandHandlerName', commandHandlerName, input);

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
        // console.log(
        //   'treeNode',
        //   treeNode,
        //   varTreeNode,
        //   node?.nodeInfo?.formValues?.['treeNode'],
        //   childTreeNode,
        //   node?.nodeInfo?.formValues?.['childTreeNode']
        // );
        contextInstance.executeCommandOnCommandHandler(
          commandHandlerName,
          'add',
          {
            parentTreeNode: treeNode,
            childTreeNode: childTreeNode,
            data: input,
            label: `${node?.nodeInfo?.formValues?.['label'] ?? ''}`,
            nodeClass: `${node?.nodeInfo?.formValues?.['nodeClass'] ?? ''}`,
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
    (_values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (node.nodeInfo) {
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: fieldName,
            value: node.nodeInfo.formValues?.[fieldName] ?? '',
            label: 'Command handler',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                [fieldName]: value,
              };
              //console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'expression',
            value: node.nodeInfo.formValues?.['expression'] ?? '',

            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                expression: value,
              };
              //console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'treeNode',
            value: node.nodeInfo.formValues?.['treeNode'] ?? '',

            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                treeNode: value,
              };
              //console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'label',
            value: node.nodeInfo.formValues?.['label'] ?? '',

            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                label: value,
              };
              //console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'addToId',
            value: node.nodeInfo.formValues?.['addToId'] ?? '',

            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                addToId: value,
              };
              //console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'nodeClass',
            value: node.nodeInfo.formValues?.['nodeClass'] ?? '',

            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                nodeClass: value,
              };
              //console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
        ];
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.isSettingsPopup = true;
        //node.nodeInfo.canvasAppInstance = nodeInstance.contextInstance;

        const domElement = nodeInstance.node.domElement as HTMLElement;
        if (domElement) {
          const textNode = domElement.querySelector(
            '.inner-node .node-content'
          );
          if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
            textNode.innerHTML = `Send '${
              node.nodeInfo?.formValues?.['expression'] ?? 'node'
            }' to node tree`;
          }
        }
      }
    },
    {
      additionalClassNames: 'text-center',
      decoratorTitle: `Send to node tree`,
    },
    undefined,
    undefined,
    true
  );
};
