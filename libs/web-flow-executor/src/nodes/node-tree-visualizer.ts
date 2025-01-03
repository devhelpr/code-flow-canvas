import {
  IFlowCanvasBase,
  createElement,
  createNodeElement,
  FormFieldType,
  getCamera,
  IDOMElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
const commandNameFieldName = 'commandHandlerName';

export const nodeTreeVisualizerNodeName = 'node-tree-visualizer';

export const getNodeTreeVisualizer = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let node: IRectNodeComponent<NodeInfo>;
  let componentWrapper: INodeComponent<NodeInfo> | undefined = undefined;
  let htmlNode: IDOMElement | undefined = undefined;
  let tagNode: IDOMElement | undefined = undefined;
  let commandName = '';
  let timeout: any = undefined;
  let isInitialized = false;
  let rootNode: IDOMElement | undefined = undefined;
  let initialDistance = 0;
  const execute = (command: string, payload: any) => {
    if (canvasAppInstance && canvasAppInstance.isContextOnly) {
      return;
    }
    if (command === 'reset' && htmlNode) {
      resetNodeTreeVisualizer();
    }
    if (isInitialized) {
      isInitialized = false;
      if (htmlNode && htmlNode.domElement) {
        (
          htmlNode.domElement as unknown as HTMLElement
        ).innerHTML = `<div class="node-tree grid justify-items-center justify-content-center items-start gap-2"></div>`;
      }
    }
    if (htmlNode && command !== 'reset') {
      let label = '';
      if (payload?.label) {
        label = `${payload?.label?.toString()}: `;
      }
      const nodeClass = payload?.nodeClass ?? '';
      let data = `${label}${(payload?.data ?? '-').toString()}`;
      if (
        payload?.data === undefined ||
        payload?.data === null ||
        (Array.isArray(payload?.data) && !payload?.data.length)
      ) {
        data = '-';
      }
      if (data) {
        const contentDataElement = createElement(
          'div',
          {
            class: `row-0 node-tree__value ${
              data
                ? ' border border-solid border-white p-2 rounded inline-block'
                : ''
            } ${nodeClass}`,
          },
          undefined,
          `${data}`
        );
        if (!rootNode) {
          rootNode = contentDataElement;
        }
        const contentElement = createElement(
          'div',
          {
            class: `node-tree__row row-0 ${
              data ? ' col-span-full whitespace-nowrap mb-4' : ''
            }`,
          },
          undefined,
          contentDataElement?.domElement as unknown as HTMLElement
        );

        createElement(
          'div',
          {
            class: `node-tree__value-helper`,
          },
          contentDataElement?.domElement
        );

        const element = createElement(
          'div',
          {
            class: 'node-tree__row-wrapper',
            //'grid justify-items-center justify-content-center row-1 p-4 items-start grid-3-columns',
            //id: `${node.id}-${payload?.childTreeNode || 'node'}`,
          },
          undefined,
          contentElement?.domElement as unknown as HTMLElement
        );

        // wrapperElement
        createElement(
          'div',
          {
            class:
              'node-tree__wrapper  grid justify-items-center justify-content-center row-1 items-start grid-3-columns gap-2 mx-2',
            id: `${node.id}-${payload?.childTreeNode || 'node'}`,
          },
          element?.domElement,
          undefined
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
                'node-tree__container grid justify-items-center justify-content-center row-0 p-4 items-start  gap-2 mx-2',
            },
            undefined
          );
          (
            htmlNode.domElement as unknown as HTMLElement
          ).firstChild?.appendChild(
            treeNode?.domElement as unknown as HTMLElement
          );
          nodeElement = treeNode?.domElement as unknown as HTMLElement;
        }
        nodeElement.appendChild(element?.domElement as unknown as HTMLElement);
        if (rootNode) {
          const boundingBox = (
            rootNode.domElement as HTMLElement
          ).getBoundingClientRect();
          const nodeBoundngBox = (
            node.domElement as HTMLElement
          ).getBoundingClientRect();
          if (boundingBox && node && nodeBoundngBox) {
            const camera = getCamera();

            const offsetX =
              boundingBox.left / camera.scale -
              nodeBoundngBox.left / camera.scale +
              initialDistance;
            (node.domElement as HTMLElement).style.left = `-${offsetX}px`;

            (node.domElement as HTMLElement).setAttribute(
              'data-xoffset',
              `${-offsetX}`
            );
          }
        }
      }
    }
    if (rect && rect.resize) {
      rect.resize();
    }
  };

  const getNodeStatedHandler = () => {
    if (!htmlNode) {
      return {
        data: '',
        id: node.id,
      };
    }

    return {
      data: {
        width: node.width,
        height: node.height,
        data: (htmlNode.domElement as unknown as HTMLElement).innerHTML,
      },
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    if (htmlNode) {
      (htmlNode.domElement as unknown as HTMLElement).innerHTML = data.data;
      if (node?.width !== undefined && node?.height !== undefined) {
        if (rect && (data.width > node?.width || data.height > node?.height)) {
          rect.resize(data.width);
        }
      }
    }
  };

  const updateVisual = (data: any) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    if (htmlNode) {
      (htmlNode.domElement as unknown as HTMLElement).innerHTML = data.data;
      if (node?.width !== undefined && node?.height !== undefined) {
        if (rect && (data.width > node?.width || data.height > node?.height)) {
          rect.resize(data.width);
        }
      }
    }
  };

  const resetNodeTreeVisualizer = () => {
    if (htmlNode && htmlNode.domElement) {
      (
        htmlNode.domElement as unknown as HTMLElement
      ).innerHTML = `<div>-----</div>`;
    }
    isInitialized = true;
    rootNode = undefined;
    if (rect && rect.resize) {
      rect.resize(120);
    }

    if (htmlNode && htmlNode.domElement) {
      (node.domElement as HTMLElement).style.left = `0px`;
      (node.domElement as HTMLElement).setAttribute('data-xoffset', '0');
      const boundingBox = (
        htmlNode.domElement as HTMLElement
      ).getBoundingClientRect();
      const nodeBoundngBox = (
        node.domElement as HTMLElement
      ).getBoundingClientRect();
      if (boundingBox && node && nodeBoundngBox) {
        const camera = getCamera();
        initialDistance =
          boundingBox.left / camera.scale - nodeBoundngBox.left / camera.scale;
      }
    }

    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (componentWrapper?.domElement) {
      (componentWrapper?.domElement as unknown as HTMLElement).classList.remove(
        'border-green-200'
      );
    }
  };

  const initializeCompute = () => {
    if (canvasAppInstance && canvasAppInstance.isContextOnly) {
      return;
    }
    resetNodeTreeVisualizer();
    return;
  };

  const compute = () => {
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
    category: 'visualization',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      commandName = initalValues?.[commandNameFieldName] ?? '';
      canvasAppInstance = canvasApp;
      if (id) {
        canvasApp.registerCommandHandler(commandName, {
          execute,
        });
        canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
        canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
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
            if (id) {
              canvasApp.unRegisteGetNodeStateHandler(id);
              canvasApp.unRegisteSetNodeStateHandler(id);
              canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
              canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
            }

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
      );

      if (htmlNode) {
        componentWrapper = createNodeElement(
          'div',
          {
            class: `border-[4px] border-solid border-transparent transition duration-500 ease-in-out inner-node 
          bg-fuchsia-600 text-white p-4 rounded text-center`,
          },
          undefined,
          htmlNode.domElement as unknown as HTMLElement
        ) as unknown as INodeComponent<NodeInfo>;
      }
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
            'absolute top-0 left-0 bg-fuchsia-400 text-white px-1 rounded -translate-y-2/4 translate-x-1',
        },
        rect.nodeComponent.domElement as unknown as HTMLElement,
        commandName
      );

      node = rect.nodeComponent;

      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.isVariable = true;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.updateVisual = updateVisual;
        node.nodeInfo.delete = () => {
          canvasApp.unregisterCommandHandler(commandName);
          (
            componentWrapper?.domElement as unknown as HTMLElement
          ).classList.remove('border-green-200');
          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
          if (node.id) {
            canvasApp.unRegisteGetNodeStateHandler(node.id);
            canvasApp.unRegisteSetNodeStateHandler(node.id);
          }
        };
        node.nodeInfo.showFormOnlyInPopup = true;
        node.nodeInfo.initializeOnStartFlow = true;
      }
      return node;
    },
  };
};
