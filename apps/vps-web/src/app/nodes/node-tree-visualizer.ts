import {
  CanvasAppInstance,
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues, NodeTask } from '../node-task-registry';
const commandNameFieldName = 'commandHandlerName';

export const nodeTreeVisualizerNodeName = 'node-tree-visualizer';

export const getNodeTreeVisualizer = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let canvasAppInstance: CanvasAppInstance<NodeInfo>;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;
  let node: IRectNodeComponent<NodeInfo>;
  let componentWrapper: IRectNodeComponent<NodeInfo>;
  let htmlNode: IElementNode<NodeInfo> | undefined = undefined;
  let tagNode: IElementNode<NodeInfo> | undefined = undefined;
  let commandName = '';
  let timeout: any = undefined;
  let isInitialized = false;
  const execute = (command: string, payload: any) => {
    if (isInitialized) {
      isInitialized = false;
      if (htmlNode) {
        (
          htmlNode.domElement as unknown as HTMLElement
        ).innerHTML = `<div class="grid justify-items-center justify-content-center items-start grid-3-columns gap-2"></div>`;
      }
    }

    if (htmlNode) {
      let label = '';
      if (payload?.label) {
        label = `${payload?.label?.toString()}: `;
      }
      const data = `${label}${(payload?.data ?? '').toString()}`;
      if (data) {
        const contentElement = createElement(
          'div',
          {
            class: `row-0 ${
              data
                ? 'border border-solid border-white rounded p-2  col-span-full'
                : ''
            }`,
          },
          undefined,
          `${data}`
        );
        const element = createElement(
          'div',
          {
            class:
              'grid justify-items-center justify-content-center row-1 p-4 items-start grid-3-columns gap-2 mx-2',
            id: `${node.id}-${payload?.childTreeNode || 'node'}`,
          },
          undefined,
          contentElement.domElement as unknown as HTMLElement
        );

        let nodeElement = (
          htmlNode.domElement as unknown as HTMLElement
        ).querySelector(
          `[id="${node.id}-${payload?.parentTreeNode || 'node'}"]`
        );

        if (!nodeElement) {
          const treeNode = createElement(
            'div',
            {
              id: `${node.id}-${payload?.parentTreeNode || 'node'}`,
              class:
                'grid justify-items-center justify-content-center row-0 p-4 items-start grid-3-columns gap-2 mx-2',
            },
            undefined
          );
          (
            htmlNode.domElement as unknown as HTMLElement
          ).firstChild?.appendChild(
            treeNode.domElement as unknown as HTMLElement
          );
          nodeElement = treeNode.domElement as unknown as HTMLElement;
        }
        nodeElement.appendChild(element.domElement as unknown as HTMLElement);
      }
    }
    if (rect) {
      rect.resize();
    }
  };

  const initializeCompute = () => {
    if (htmlNode) {
      (
        htmlNode.domElement as unknown as HTMLElement
      ).innerHTML = `<div>-----</div>`;
    }
    isInitialized = true;
    if (rect) {
      rect.resize(120);
    }

    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    (componentWrapper.domElement as unknown as HTMLElement).classList.remove(
      'border-green-200'
    );

    return;
  };

  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number
  ) => {
    return {
      result: false,
      stop: true,
      followPath: undefined,
    };
  };

  return {
    name: nodeTreeVisualizerNodeName,
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      commandName = initalValues?.[commandNameFieldName] ?? '';

      if (id) {
        canvasApp.registerCommandHandler(commandName, {
          execute,
        });
      }
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: commandNameFieldName,
          value: initalValues?.[commandNameFieldName] ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              [commandNameFieldName]: value,
            };
            canvasApp.unregisterCommandHandler(commandName);
            commandName = value;
            (tagNode?.domElement as HTMLElement).textContent = commandName;
            canvasApp.registerCommandHandler(commandName, {
              execute,
            });
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];

      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        '-'
      ) as unknown as INodeComponent<NodeInfo>;

      componentWrapper = createElement(
        'div',
        {
          class: `border-[4px] border-solid border-transparent transition duration-500 ease-in-out inner-node bg-slate-600 text-white p-4 rounded text-center`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as IRectNodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        100,
        100,
        undefined,
        [],
        componentWrapper,
        {
          classNames: `p-4 rounded`,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          type: nodeTreeVisualizerNodeName,
          formValues: {
            [commandNameFieldName]: commandName,
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      tagNode = createElement(
        'div',
        {
          class:
            'absolute top-0 left-0 bg-slate-700 text-white px-1 rounded -translate-y-2/4 translate-x-1',
        },
        rect.nodeComponent.domElement as unknown as HTMLElement,
        commandName
      ) as unknown as INodeComponent<NodeInfo>;

      node = rect.nodeComponent;

      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.isVariable = true;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.delete = () => {
          canvasApp.unregisterCommandHandler(commandName);
          (
            componentWrapper?.domElement as unknown as HTMLElement
          ).classList.remove('border-green-200');
          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
        };
        node.nodeInfo.showFormOnlyInPopup = true;
      }
      return node;
    },
  };
};
