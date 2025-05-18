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
  createFormDialog,
  FormFieldType,
  IFormsComponent,
} from '@devhelpr/visual-programming-system';
import {
  getFollowNodeExecution,
  setFollowNodeExecution,
} from '../follow-path/followNodeExecution';
import {
  canvasNodeTaskRegistryLabels,
  FlowEngine,
  getNodeFactoryNames,
  NodeInfo,
} from '@devhelpr/web-flow-executor';

export class NodeSidebarMenuComponent extends Component<
  AppNavComponentsProps<NodeInfo, FlowEngine>
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
  getNodeFactory: (name: string) => NodeTaskFactory<NodeInfo, FlowEngine>;

  constructor(
    parent: BaseComponent | null,
    props: AppNavComponentsProps<NodeInfo, FlowEngine>
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
        this.initNodeTaskbar();
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

  private taskbarContainer: HTMLElement | null = null;
  initNodeTaskbar = (isInComposition?: boolean, compositionId?: string) => {
    if (!this.rootElement) {
      return;
    }
    let taskbar: HTMLElement | null = null;

    if (this.taskbarContainer) {
      this.taskbarContainer.remove();
      this.taskbarContainer = null;
    }

    const categorizedNodeTasks = new Map<
      string,
      { label: string; nodeType: string }[]
    >();
    const nodeTasks = getNodeFactoryNames();
    nodeTasks.forEach((nodeTask) => {
      const factory = this.getNodeFactory(nodeTask);
      let categoryName = 'Default';
      if (factory) {
        const node = factory(
          this.props.canvasUpdated,
          undefined,
          undefined,
          this.props.flowEngine
        );

        if (node.isContained) {
          return;
        }
        if (node.hideFromNodeTypeSelector) {
          if (
            !isInComposition ||
            (isInComposition && !node.useInCompositionOnly)
          ) {
            return;
          }
        }
        if (
          isInComposition &&
          nodeTask === `composition-${compositionId}` &&
          compositionId
        ) {
          return;
        }

        categoryName = node.category || 'uncategorized';
        // if (node.useInCompositionOnly) {
        //   return;
        // }
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
        class={`taskbar-container
          absolute left-0 top-[108px] 
          w-[182px] 
          h-[100vh]
          max-h-[calc(100vh-208px)] 
          transition-transform
          z-[20050]
          hidden 
          md:flex flex-col           
          bg-slate-700  
          rounded-r-md      
          `}
        getElement={(element: HTMLElement) => {
          this.taskbarContainer = element;

          renderElement(
            <div
              class={`absolute w-full z-[20150] top-0 p-4 flex flex-col pb-2 bg-slate-700 `}
            >
              <input
                type="text"
                class="rounded p-2 bg-slate-500 text-white border border-slate-50"
                input={(event: InputEvent) => {
                  const value = (event.target as HTMLInputElement).value;
                  if (taskbar) {
                    taskbar
                      .querySelectorAll('.taskbar__node-type')
                      .forEach((node) => {
                        if (node) {
                          const title = node.getAttribute?.('title');
                          if (title) {
                            if (title.toLowerCase().includes(value)) {
                              node.classList.remove('hidden');
                            } else {
                              node.classList.add('hidden');
                            }
                          }
                        }
                      });

                    taskbar
                      .querySelectorAll('.taskbar__category')
                      .forEach((node) => {
                        if (node && taskbar) {
                          const category = (node as HTMLElement).innerText;
                          if (
                            taskbar.querySelectorAll(
                              `[data-category="${category}"]:not(.hidden)`
                            ).length > 0
                          ) {
                            node.classList.remove('hidden');
                          } else {
                            node.classList.add('hidden');
                          }
                        }
                      });
                  }
                }}
                placeholder="Search"
              />
            </div>,
            this.taskbarContainer
          );
        }}
      >
        <div
          class={`
            absolute 
            flex flex-col 
            top-0 left-0 right-0
            z-[20050]
            pt-[60px]
            bottom-0

          `}
        >
          <div
            class={`
              taskbar-container__scroll
              grid
              grid-cols-1
              grid-rows-1
              grid-rows-[1fr]
              grid-cols-[1fr]
            
              top-0 left-0
              z-[20050]
              overflow-y-scroll
              px-4 py-2 
              max-h-[calc(100vh-208px)] 
              w-full
              h-min
            `}
          >
            <div
              class={`overflow-visible flex flex-col gap-2 relative pt-2 pb-2`}
              getElement={(element: HTMLElement) => {
                taskbar = element;

                sortedCategories.forEach((categoryName) => {
                  const category = categorizedNodeTasks.get(categoryName);
                  if (categoryName === 'deprecated') {
                    return;
                  }
                  renderElement(
                    <h2 class={`text-white py-2 taskbar__category`}>
                      {categoryName}
                    </h2>,
                    taskbar
                  );

                  category?.forEach((nodeTask) => {
                    const label =
                      canvasNodeTaskRegistryLabels[nodeTask.nodeType] ||
                      nodeTask.nodeType;

                    renderElement(
                      <div
                        class={`taskbar__node-type cursor-pointer 
                          bg-slate-500
                          text-white 
                          rounded 
                          px-4 py-2 mb-2 
                          max-w-[150px] 
                          whitespace-nowrap overflow-hidden text-ellipsis`}
                        pointerdown={(event: PointerEvent) => {
                          this.startDragNode(event, taskbar, nodeTask.nodeType);
                        }}
                        title={label}
                        data-category={categoryName}
                      >
                        {label}
                      </div>,
                      taskbar
                    );
                  });
                });
              }}
            ></div>
          </div>
        </div>
        <div
          class="taskbar-container-before
            pointer-events-none
            absolute
            left-0             
            w-[182px]
            top-[60px]
            h-4
            bg-gradient-to-b
            from-slate-700
            to-transparent
            z-[20051]"
        ></div>
        <div
          class="taskbar-container-after
            pointer-events-none
            absolute            
            left-0              
            w-[182px]
            bottom-0
            h-4
            bg-gradient-to-t
            from-slate-700
            to-transparent
            z-[20051]"
        ></div>
      </div>,

      this.rootElement
    );
    this.rootElement.addEventListener('pointerup', (_event) => {
      if (this.taskbarContainer) {
        this.taskbarContainer.classList.remove('-translate-x-[100%]');
        this.taskbarContainer.classList.remove('dragging');
      }
    });
  };

  startDragNode = (
    event: PointerEvent,
    taskbar: HTMLElement | null,
    nodeType: string
  ) => {
    const factory = this.getNodeFactory(nodeType);
    const canvasApp = this.props.getCanvasApp();

    if (factory && canvasApp && taskbar && this.taskbarContainer) {
      const { pointerXPos, pointerYPos, rootX, rootY } = getPointerPos(
        canvasApp.canvas.domElement as HTMLElement,
        canvasApp.rootElement,
        event
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos - (window?.visualViewport?.offsetTop ?? 0)
      );

      this.taskbarContainer.classList.add('-translate-x-[100%]');
      this.taskbarContainer.classList.add('dragging');
      const nodeTask = factory(
        this.props.canvasUpdated,
        canvasApp.theme,
        undefined,
        this.props.flowEngine
      );
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
        // TODO : IMPROVE THIS (should be handled by the internals behind createVisualNode )
        (node.nodeInfo as any).taskType = nodeType;

        const elementRect = (
          node.domElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();

        const rect = transformCameraSpaceToWorldSpace(
          elementRect.x - rootX,
          elementRect.y - rootY
        );

        (node.domElement as HTMLElement).setPointerCapture(event.pointerId);
        pointerDown(
          x - rect.x + (node.width ?? 0) / 2,
          y - rect.y + (node.height ?? 0) / 2,
          node,
          canvasApp.canvas,
          canvasApp.interactionStateMachine
        );

        // sets the initial position of the node to the pointer position so that it centers around the pointer position
        node.update?.(
          node,
          node.x - (node.width ?? 0) / 2,
          node.y - (node.height ?? 0) / 2,
          node
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
    const googleGeminiAIKey = canvasApp.getTempData('googleGeminiAI-key') ?? '';
    const isStoredInSessionStorage =
      sessionStorage.getItem('openai-key') ||
      sessionStorage.getItem('googleGeminiAI-key')
        ? 'true'
        : 'false';
    createFormDialog(
      [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'openAIAPIKey',
          label: 'OpenAI API Key',
          value: openAIKey ?? '',
          enablePassword: true,
          onChange: (_value: string, _formComponent: IFormsComponent) => {
            //
          },
        },
        {
          fieldType: FormFieldType.Text,
          fieldName: 'googleGeminiAPIKey',
          label: 'Google Gemini API Key',
          value: googleGeminiAIKey ?? '',
          enablePassword: true,
          onChange: (_value: string, _formComponent: IFormsComponent) => {
            //
          },
        },
        {
          fieldType: FormFieldType.Checkbox,
          fieldName: 'storeInSessionStorage',
          label: 'Store in browser session storage',
          value: isStoredInSessionStorage,
          onChange: (_value: boolean, _formComponent: IFormsComponent) => {
            //
          },
        },
      ],
      this.rootAppElement
    ).then((values: Record<string, string>) => {
      console.log('form values', values);
      if (!values) {
        return;
      }
      canvasApp.setTempData('openai-key', values['openAIAPIKey']);
      canvasApp.setTempData('googleGeminiAI-key', values['googleGeminiAPIKey']);
      if (values['storeInSessionStorage']) {
        sessionStorage.setItem('openai-key', values['openAIAPIKey']);
        sessionStorage.setItem(
          'googleGeminiAI-key',
          values['googleGeminiAPIKey']
        );
      }
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
  props: AppNavComponentsProps<NodeInfo, FlowEngine>
) => {
  return new NodeSidebarMenuComponent(null, {
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
    flowEngine: props.flowEngine,
  });
};
