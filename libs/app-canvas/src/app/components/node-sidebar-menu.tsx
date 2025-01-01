import {
  navBarButtonNomargin,
  invertedNavBarButtonNomargin,
} from '../consts/classes';

import {
  BaseComponent,
  Component,
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { AppNavComponentsProps } from '../component-interface/app-nav-component';
import {
  NodeType,
  IConnectionNodeComponent,
  IRectNodeComponent,
  INodeComponent,
  getSelectedNode,
  renderElement,
  createJSXElement,
  NodeTaskFactory,
  transformCameraSpaceToWorldSpace,
  getPointerPos,
  pointerDown,
} from '@devhelpr/visual-programming-system';
import {
  getFollowNodeExecution,
  setFollowNodeExecution,
} from '../follow-path/followNodeExecution';
import {
  canvasNodeTaskRegistryLabels,
  getNodeFactoryNames,
  NodeInfo,
} from '@devhelpr/web-flow-executor';
import { createInputDialog } from '../utils/create-input-dialog';

export class NodeSidebarMenuComponent extends Component<
  AppNavComponentsProps<NodeInfo>
> {
  oldProps: AppNavComponentsProps<NodeInfo> | null = null;

  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  settingsNodeButton: HTMLButtonElement | null = null;
  rootAppElement: HTMLElement | null = null;

  placeOnLayer1Button: HTMLButtonElement | null = null;
  placeOnLayer2Button: HTMLButtonElement | null = null;
  switchLayerButton: HTMLButtonElement | null = null;
  toggleDependencyConnections: HTMLButtonElement | null = null;
  followNodeExecution: HTMLButtonElement | null = null;
  apikeysButton: HTMLButtonElement | null = null;
  showDependencyConnections = false;
  getNodeFactory: (name: string) => NodeTaskFactory<NodeInfo>;

  constructor(
    parent: BaseComponent | null,
    props: AppNavComponentsProps<NodeInfo>
  ) {
    super(parent, props);
    this.getNodeFactory = props.getNodeFactory;
    this.template = createTemplate(
      `<div class="z-20 flex flex-col absolute right-0 top-1/2 bg-slate-700 -translate-y-1/2 p-[4px] rounded-l-lg">
      <button title="Node properties" class="${navBarButtonNomargin} flex  w-[32px] h-[32px] mb-1"><span class="icon icon-tune text-[16px]"></span></button>
      <button title="Assign node to layer1" class="${navBarButtonNomargin} flex items-center w-[32px] h-[32px] mb-1">L1</button>
      <button title="Assign node to layer2" class="${navBarButtonNomargin} flex items-center w-[32px] h-[32px] mb-1">L2</button>
      <button title="Toggle between layer 1 and 2" class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px] mb-1"><span class="icon icon-layers text-[22px]"></span></button>
      <button title="Show node dependencies" class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px] mb-1"><span class="icon icon-arrow_forward text-[22px]"></span></button>
      <button title="Follow node execution" class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px] hidden">F</button>
      <button title="API Keys(just openai for now)" class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px] mb-1"><span class="icon icon-vpn_key text-[22px]"></span></button>

		  <children></children>
		</div>`
    );
    this.rootElement = props.rootElement;
    this.rootAppElement = props.rootAppElement;
    this.mount();
  }
  mount() {
    super.mount();
    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.element = createElementFromTemplate(this.template);

      if (this.element) {
        this.element.remove();
        this.settingsNodeButton = this.element.firstChild as HTMLButtonElement;

        this.placeOnLayer1Button = this.settingsNodeButton
          ?.nextSibling as HTMLButtonElement;
        this.placeOnLayer2Button = this.placeOnLayer1Button
          ?.nextSibling as HTMLButtonElement;
        this.switchLayerButton = this.placeOnLayer2Button
          ?.nextSibling as HTMLButtonElement;
        this.toggleDependencyConnections = this.switchLayerButton
          ?.nextSibling as HTMLButtonElement;
        this.followNodeExecution = this.toggleDependencyConnections
          ?.nextSibling as HTMLButtonElement;

        this.apikeysButton = this.followNodeExecution
          ?.nextSibling as HTMLButtonElement;

        this.settingsNodeButton.addEventListener(
          'click',
          this.onClickSettingsNode
        );

        this.placeOnLayer1Button.addEventListener(
          'click',
          this.onClickPlaceOnLayer1
        );
        this.placeOnLayer2Button.addEventListener(
          'click',
          this.onClickPlaceOnLayer2
        );
        this.switchLayerButton.addEventListener(
          'click',
          this.onClickSwitchLayer
        );

        this.toggleDependencyConnections.addEventListener(
          'click',
          this.onClickToggleDependencyConnections
        );

        this.followNodeExecution.addEventListener(
          'click',
          this.onClickFollowNodeExecution
        );

        this.apikeysButton.addEventListener('click', this.onClickAPIKeys);

        this.renderList.push(
          this.settingsNodeButton,
          this.placeOnLayer1Button,
          this.placeOnLayer2Button,
          this.switchLayerButton,
          this.toggleDependencyConnections,
          this.followNodeExecution,
          this.apikeysButton
        );
        this.rootElement.append(this.element);
        let taskbar: HTMLElement | null = null;
        let taskbarContainer: HTMLElement | null = null;

        const categorizedNodeTasks = new Map<
          string,
          { label: string; nodeType: string }[]
        >();
        const nodeTasks = getNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = this.getNodeFactory(nodeTask);
          let categoryName = 'Default';
          if (factory) {
            const node = factory(this.props.canvasUpdated);
            categoryName = node.category || 'uncategorized';
            if (node.useInCompositionOnly) {
              return;
            }
          }
          const label = canvasNodeTaskRegistryLabels[nodeTask] || nodeTask;
          const category = categorizedNodeTasks.get(categoryName);
          if (category) {
            category.push({
              label,
              nodeType: nodeTask,
            });
          } else {
            categorizedNodeTasks.set(categoryName, [
              {
                label,
                nodeType: nodeTask,
              },
            ]);
          }
        });
        // sort the categories case-insensitive
        const sortedCategories = Array.from(categorizedNodeTasks.keys()).sort(
          (a, b) => {
            return a.localeCompare(b);
          }
        );

        // sort the tasks within the categories
        sortedCategories.forEach((categoryName) => {
          const category = categorizedNodeTasks.get(categoryName);
          if (category) {
            category.sort((a, b) => {
              return a.label.localeCompare(b.label);
            });
          }
        });

        renderElement(
          <div
            class={`taskbar-container transition-transform z-[20050] hidden md:flex flex-col absolute left-0 top-[58px] max-h-[calc(100vh-108px)] bg-slate-700  p-4 rounded-l-lg  overflow-y-scroll`}
            getElement={(element: HTMLElement) => {
              taskbarContainer = element;
            }}
          >
            <div
              class={`overflow-visible flex flex-col `}
              getElement={(element: HTMLElement) => {
                taskbar = element;
                sortedCategories.forEach((categoryName) => {
                  const category = categorizedNodeTasks.get(categoryName);
                  if (categoryName === 'deprecated') {
                    return;
                  }
                  renderElement(
                    <h2 class={`text-white py-2`}>{categoryName}</h2>,
                    taskbar
                  );

                  category?.forEach((nodeTask) => {
                    const label =
                      canvasNodeTaskRegistryLabels[nodeTask.nodeType] ||
                      nodeTask.nodeType;

                    renderElement(
                      <div
                        class={`cursor-pointer border border-white border-solid rounded px-4 py-2 mb-2 text-white max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis`}
                        pointerdown={(event: PointerEvent) => {
                          this.startDragNode(
                            event,
                            taskbar,
                            taskbarContainer,
                            nodeTask.nodeType
                          );
                        }}
                        title={label}
                      >
                        {label}
                      </div>,
                      taskbar
                    );
                  });
                });
              }}
            ></div>
          </div>,
          this.rootElement
        );
        this.rootElement.addEventListener('pointerup', (_event) => {
          if (taskbarContainer) {
            taskbarContainer.classList.remove('-translate-x-[100%]');
          }
        });
      }
    }
    this.isMounted = true;
  }
  unmount() {
    super.unmount();
    if (this.element && this.element.remove) {
      // remove only removes the connection between parent and node
      this.element.remove();
    }
    this.isMounted = false;
  }

  startDragNode = (
    event: PointerEvent,
    taskbar: HTMLElement | null,
    taskbarContainer: HTMLElement | null,
    nodeType: string
  ) => {
    const factory = this.getNodeFactory(nodeType);
    const canvasApp = this.props.getCanvasApp();

    if (factory && canvasApp && taskbar && taskbarContainer) {
      const { pointerXPos, pointerYPos, rootX, rootY } = getPointerPos(
        canvasApp.canvas.domElement as HTMLElement,
        canvasApp.rootElement,
        event
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos - (window?.visualViewport?.offsetTop ?? 0)
      );

      taskbarContainer.classList.add('-translate-x-[100%]');
      const nodeTask = factory(this.props.canvasUpdated, canvasApp.theme);
      const nodeInfo = undefined;
      const node = nodeTask.createVisualNode(
        canvasApp,
        x,
        y,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        nodeInfo
      );
      if (node && node.nodeInfo) {
        const elementRect = (
          node.domElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();

        const rect = transformCameraSpaceToWorldSpace(
          elementRect.x - rootX,
          elementRect.y - rootY
        );
        // TODO : IMPROVE THIS
        (node.nodeInfo as any).taskType = nodeType;
        (node.domElement as HTMLElement).setPointerCapture(event.pointerId);

        pointerDown(
          x - rect.x + (node.width ?? 0) / 2,
          y - rect.y + (node.height ?? 0) / 2,
          node,
          canvasApp.canvas,
          canvasApp.interactionStateMachine
        );
      }
    }
  };

  onClickSettingsNode = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();
    if (
      nodeInfo &&
      nodeInfo.node &&
      nodeInfo.node.nodeType === NodeType.Shape
    ) {
      this.props.showPopup(nodeInfo.node as IRectNodeComponent<NodeInfo>);
    }

    return false;
  };

  getSelectedNodeInfo = () => {
    const nodeElementId = getSelectedNode();
    if (nodeElementId) {
      const canvasApp = this.props.getCanvasApp();
      if (!canvasApp) {
        return false;
      }
      const node = nodeElementId.containerNode
        ? ((
            nodeElementId?.containerNode as unknown as IRectNodeComponent<NodeInfo>
          )?.nodeInfo?.canvasAppInstance?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>)
        : (canvasApp?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>);

      if (node) {
        return { selectedNodeInfo: nodeElementId, node };
      }
    }
    return false;
  };

  onClickPlaceOnLayer1 = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();

    if (nodeInfo) {
      const node = nodeInfo.node;
      if (node.nodeType === NodeType.Connection) {
        const connection = node as IConnectionNodeComponent<NodeInfo>;
        connection.layer = 1;
        connection.update?.();
        this.props.canvasUpdated();
      }
    }
    return false;
  };

  onClickPlaceOnLayer2 = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();

    if (nodeInfo) {
      const node = nodeInfo.node;
      if (node.nodeType === NodeType.Connection) {
        const connection = node as IConnectionNodeComponent<NodeInfo>;
        connection.layer = 2;
        connection.update?.();
        this.props.canvasUpdated();
      }
    }
    return false;
  };

  onClickSwitchLayer = (event: Event) => {
    event.preventDefault();
    if (this.rootAppElement?.classList.contains('active-layer2')) {
      this.rootAppElement?.classList.remove('active-layer2');
    } else {
      this.rootAppElement?.classList.add('active-layer2');
    }

    return false;
  };

  onClickToggleDependencyConnections = (event: Event) => {
    event.preventDefault();
    /*
      indien uitzetten ...
      - loop door alle connections (ook recursief in containers)..
      - indien het een isAnnotationConnection is ... dan verwijderen

      indien aanzetten:
      - loop door alle nodes
      - vraag aan de node of deze dependencies heeft (en geef die ook terug)
          ... nodeInfo.getDependencies() ... 
        
      - ... zo ja, dan benodigde annotation connections toevoegen   

    */
    this.props.setIsStoring(true);
    const canvasApp = this.props.getCanvasApp();
    if (!canvasApp) {
      return false;
    }

    this.showDependencyConnections = !this.showDependencyConnections;
    if (this.showDependencyConnections) {
      canvasApp.elements.forEach((element) => {
        if (element.nodeInfo?.getDependencies) {
          const dependencies = element.nodeInfo.getDependencies();
          console.log('getDependencies', dependencies);
          if (dependencies.length > 0) {
            dependencies.forEach((dependency) => {
              const startNode = canvasApp?.elements?.get(
                dependency.startNodeId
              ) as IRectNodeComponent<NodeInfo>;
              const endNode = canvasApp.elements?.get(
                dependency.endNodeId
              ) as IRectNodeComponent<NodeInfo>;

              if (startNode && endNode) {
                const connection = canvasApp.createLine(
                  startNode.x,
                  startNode.y,
                  endNode.x,
                  endNode.y,
                  true,
                  true
                );
                if (
                  connection &&
                  connection.nodeComponent &&
                  connection.nodeComponent.update
                ) {
                  (
                    connection.nodeComponent?.domElement as HTMLElement
                  )?.classList?.add('line-dependency-connection');
                  connection.nodeComponent.startNode = startNode;
                  connection.nodeComponent.endNode = endNode;

                  if (startNode) {
                    startNode.connections?.push(connection.nodeComponent);
                  }
                  if (endNode) {
                    endNode.connections?.push(connection.nodeComponent);
                  }

                  connection.nodeComponent.isAnnotationConnection = true;
                  connection.nodeComponent.layer = 1;
                  connection.nodeComponent.update();
                }
              }
            });
          }
        }
      });
    } else {
      canvasApp.elements.forEach((element) => {
        const node = element as INodeComponent<NodeInfo>;
        if (node.nodeType === NodeType.Connection) {
          const connection = node as IConnectionNodeComponent<NodeInfo>;
          if (connection.isAnnotationConnection) {
            this.props.removeElement(node);
            canvasApp.deleteElement(element.id);
          }
        }
      });
    }
    this.props.setIsStoring(false);

    return false;
  };

  removeClassListFromElement = (
    element: HTMLElement | null,
    classList: string
  ) => {
    if (element) {
      const index = element.className.indexOf(classList);
      if (index > -1) {
        const newClassName =
          element.className.substring(0, index) +
          element.className.substring(index + classList.length);
        element.className = newClassName;
      }
    }
  };
  addClassListToElement = (element: HTMLElement | null, classList: string) => {
    if (element) {
      const index = element.className.indexOf(classList);
      if (index === -1) {
        element.className += ' ' + classList;
      }
    }
  };

  onClickFollowNodeExecution = (event: Event) => {
    event.preventDefault();
    setFollowNodeExecution(!getFollowNodeExecution());
    if (getFollowNodeExecution()) {
      this.removeClassListFromElement(
        this.followNodeExecution,
        navBarButtonNomargin
      );
      this.addClassListToElement(
        this.followNodeExecution,
        invertedNavBarButtonNomargin
      );
    } else {
      this.removeClassListFromElement(
        this.followNodeExecution,
        invertedNavBarButtonNomargin
      );
      this.addClassListToElement(
        this.followNodeExecution,
        navBarButtonNomargin
      );
    }
    return false;
  };

  onClickAPIKeys = (event: Event) => {
    event.preventDefault();
    if (!this.rootAppElement) {
      return false;
    }
    const canvasApp = this.props.getCanvasApp();
    if (!canvasApp) {
      return false;
    }
    const openAIKey = canvasApp.getTempData('openai-key') ?? '';
    createInputDialog(
      this.rootAppElement,
      'Openai-key',
      openAIKey,
      (_name) => {
        return {
          valid: true,
        };
      },
      {
        isPassword: true,
      }
    ).then((value) => {
      if (value === false) {
        return;
      }
      const canvasApp = this.props.getCanvasApp();
      if (!canvasApp) {
        return;
      }
      canvasApp.setTempData('openai-key', value);
      console.log('openai-key value', value);
    });
    return false;
  };

  render() {
    super.render();

    if (!this.element) return;

    if (
      this.previousDoRenderChildren === null ||
      this.previousDoRenderChildren !== this.doRenderChildren
    ) {
      this.previousDoRenderChildren = this.doRenderChildren;
      this.renderList = [];
      const childElements = this.doRenderChildren
        ? this.getRenderableChildren()
        : [];

      this.renderElements(childElements);
    }
  }
}

export const NodeSidebarMenuComponents = (
  props: AppNavComponentsProps<NodeInfo>
) => {
  new NodeSidebarMenuComponent(null, {
    initializeNodes: props.initializeNodes,
    storageProvider: props.storageProvider,
    clearCanvas: props.clearCanvas,
    rootElement: props.rootElement,
    rootAppElement: props.rootAppElement,
    selectNodeType: props.selectNodeType,
    animatePath: props.animatePath,
    animatePathFromThumb: props.animatePathFromThumb,
    canvasUpdated: props.canvasUpdated,
    getCanvasApp: props.getCanvasApp,
    removeElement: props.removeElement,
    importToCanvas: props.importToCanvas,
    setIsStoring: props.setIsStoring,
    showPopup: props.showPopup,
    executeCommand: props.executeCommand,
    getNodeFactory: props.getNodeFactory,
  });
};
