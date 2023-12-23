import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
  createElement,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { navBarButton } from '../consts/classes';

const fieldName = 'message';
export const dialogFormNodeName = 'dialog-form-node';

export const dialogFormNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };

  const computeAsync = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    return new Promise<IComputeResult>((resolve, reject) => {
      const template = createTemplate(
        `<div><p>Dialog form node</p>
        <p class="mb-4">${node?.nodeInfo?.formValues?.[fieldName]}</p>
        <form method="dialog">
          <button class="${navBarButton} m-0">Close and continue</button>
        </form></div>`
      );
      const formElement = createElementFromTemplate(template);

      const dialogFormNode = createElement(
        'dialog',
        {},
        document.body,
        formElement
      );
      const form = (dialogFormNode.domElement as HTMLElement).querySelector(
        'form'
      );
      (dialogFormNode.domElement as HTMLDialogElement).showModal();
      form?.addEventListener('submit', (event) => {
        event.preventDefault();
        (dialogFormNode.domElement as HTMLDialogElement).close();
        console.log('form submit', node.nodeInfo);
        resolve({ result: input, output: input, followPath: undefined });
      });
    });
  };

  return visualNodeFactory(
    dialogFormNodeName,
    'Dialog Form',
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
      },
      {
        thumbType: ThumbType.EndConnectorCenter,
        thumbIndex: 0,
        connectionType: ThumbConnectionType.end,
        color: 'white',
        label: ' ',
        maxConnections: 1,
      },
    ],
    (values?: InitialValues) => {
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: fieldName,
          value: values?.[fieldName] ?? '',
          settings: {
            showLabel: true,
          },
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
      node = nodeInstance.node;
    },
    {
      hasTitlebar: false,
      hasFormInPopup: true,
      additionalClassNames: 'text-center',
    },
    undefined,
    true
  );
};
