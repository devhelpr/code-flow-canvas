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

const fieldName = 'commandHandlerName';

export const sendResetToNodeTreeNodeName = 'send-reset-to-node-tree';

export const sendResetToNodeTree: NodeTaskFactory<NodeInfo> = (
  updated: () => void
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
    _scopeId?: string
  ) => {
    if (node && node.nodeInfo && contextInstance) {
      const commandHandlerName = node?.nodeInfo?.formValues?.[fieldName] ?? '';
      //console.log('commandHandlerName', commandHandlerName, input);

      if (commandHandlerName) {
        contextInstance.executeCommandOnCommandHandler(
          commandHandlerName,
          'reset',
          {}
        );
      }
    }
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  function setNodeText() {
    const domElement = node.domElement as HTMLElement;
    if (domElement) {
      const textNode = domElement.querySelector('.inner-node .node-content');
      if (textNode && node && node.nodeInfo?.formValues?.[fieldName]) {
        textNode.innerHTML = `Reset '${
          node.nodeInfo?.formValues?.[fieldName] ?? '----'
        }'`;
      }
    }
  }

  return visualNodeFactory(
    sendResetToNodeTreeNodeName,
    'Send reset to node tree',
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

              setNodeText();

              if (updated) {
                updated();
              }
            },
          },
        ];
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.isSettingsPopup = true;

        setNodeText();
      }
    },
    {
      additionalClassNames: 'text-center',
    },
    undefined,
    undefined
  );
};
