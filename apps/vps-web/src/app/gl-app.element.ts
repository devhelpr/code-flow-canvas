import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
import {
  createElement,
  IElementNode,
  INodeComponent,
  createEffect,
  getSelectedNode,
  setSelectNode,
  CanvasAppInstance,
  IRectNodeComponent,
  Flow,
  updateNamedSignal,
  NodeType,
  SelectedNodeInfo,
  FlowNode,
  IDOMElement,
  Composition,
  IConnectionNodeComponent,
  getThumbNodeByIdentifierWithinNode,
  createCanvasApp,
  ThumbConnectionType,
  getThumbNodeByName,
  mapConnectionToFlowNode,
  mapShapeNodeToFlowNode,
} from '@devhelpr/visual-programming-system';

import { registerCustomFunction } from '@devhelpr/expression-compiler';

import { FormComponent } from './components/form-component';

import {
  createIndexedDBStorageProvider,
  FlowrunnerIndexedDbStorageProvider,
} from './storage/indexeddb-storage-provider';
import { GLNavbarMenu } from './components/gl-navbar-components';
import {
  menubarClasses,
  menubarContainerClasses,
  navBarButton,
  navBarOutlineButton,
} from './consts/classes';
import {
  serializeCompositions,
  serializeElementsMap,
} from './storage/serialize-canvas';
import { importCompositions, importToCanvas } from './storage/import-to-canvas';
import { AppElement } from './app.element';
import {
  getGLNodeFactoryNames,
  getGLNodeTaskFactory,
  registerComposition,
  registerCompositionNodes,
  removeAllCompositions,
  setupGLNodeTaskRegistry,
} from './node-task-registry/gl-node-task-registry';
import {
  setCameraAnimation,
  setPositionTargetCameraAnimation,
  setTargetCameraAnimation,
} from './follow-path/animate-path';
import { registerCommands } from './command-handlers/register-commands';
import { setupGLTasksInDropdown } from './node-task-registry/setup-select-node-types-dropdown';
import { GLNodeInfo } from './types/gl-node-info';
import { getGLSLFunctions } from './nodes-gl/custom-glsl-functions-registry';

export class GLAppElement extends AppElement<GLNodeInfo> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  storageProvider: FlowrunnerIndexedDbStorageProvider | undefined = undefined;

  scopeNodeDomElement: HTMLElement | undefined = undefined;

  formElement: IDOMElement | undefined = undefined;
  selectedNodeLabel: IDOMElement | undefined = undefined;

  focusedNode: IRectNodeComponent<GLNodeInfo> | undefined = undefined;
  runButton: IDOMElement | undefined = undefined;
  selectNodeType: IDOMElement | undefined = undefined;
  resetStateButton: IDOMElement | undefined = undefined;
  clearCanvasButton: IDOMElement | undefined = undefined;
  compositionEditButton: IDOMElement | undefined = undefined;
  compositionEditExitButton: IDOMElement | undefined = undefined;
  canvasUpdated: (() => void) | undefined = undefined;

  constructor(appRootSelector: string) {
    const template = document.createElement('template');
    template.innerHTML = `<div>
      <div class="min-h-dvh w-1/2 bg-slate-800 overflow-hidden touch-none" id="root" >
      </div>
      <canvas id="glcanvas" class="gl-canvas"></canvas></div>
    `;

    super(appRootSelector, template);

    if (!this.rootElement) {
      return;
    }
    if (!this.canvasApp) {
      return;
    }
    this.setupWindowResize();
    this.setupGLCanvas();
    this.canvasApp.setOnAddcomposition(this.onAddComposition);
    const canvasUpdated = () => {
      if (this.isStoring) {
        return;
      }
      this.flowTOGLCanvas();
      store();
      this.setTabOrderOfNodes();
    };
    this.canvasUpdated = canvasUpdated;
    this.canvasApp.setOnCanvasUpdated(() => {
      canvasUpdated();
    });
    this.canvasApp?.setOnWheelEvent((x, y, scale) => {
      setPositionTargetCameraAnimation(x, y, scale);
    });

    this.canvasApp?.setonDragCanvasEvent((x, y) => {
      setPositionTargetCameraAnimation(x, y);
    });

    setCameraAnimation(this.canvasApp);

    setupGLNodeTaskRegistry();
    createIndexedDBStorageProvider()
      .then((storageProvider) => {
        console.log('storageProvider', storageProvider);
        this.isStoring = true;
        this.storageProvider = storageProvider;

        this.initializeCommandHandlers();

        if (this.storageProvider && this.canvasApp && this.rootElement) {
          GLNavbarMenu({
            clearCanvas: this.clearCanvas,
            initializeNodes: initializeNodes,
            storageProvider: this.storageProvider,
            selectNodeType: this.selectNodeType
              ?.domElement as HTMLSelectElement,
            canvasUpdated: canvasUpdated,
            canvasApp: this.canvasApp,
            removeElement: this.removeElement,
            rootElement: menubarElement.domElement as HTMLElement,
            rootAppElement: this.rootElement as HTMLElement,
            setIsStoring: setIsStoring,
            importToCanvas: (
              nodesList: FlowNode<GLNodeInfo>[],
              canvasApp: CanvasAppInstance<GLNodeInfo>,
              canvasUpdated: () => void,
              containerNode?: IRectNodeComponent<GLNodeInfo>,
              nestedLevel?: number,
              getGLNodeTaskFactory?: (name: string) => any,
              compositions: Record<string, Composition<GLNodeInfo>> = {}
            ) => {
              this.isStoring = true;
              removeAllCompositions();
              importCompositions<GLNodeInfo>(compositions, canvasApp);
              registerCompositionNodes(
                this.canvasApp?.compositons?.getAllCompositions() ?? {}
              );
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel,
                getGLNodeTaskFactory
              );
              this.isStoring = false;
              canvasUpdated();

              setupGLTasksInDropdown(
                this.selectNodeType?.domElement as HTMLSelectElement
              );
            },
          }) as unknown as HTMLElement;

          this.resetStateButton = createElement(
            'button',
            {
              class: navBarButton,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                initializeNodes();
                return false;
              },
            },
            menubarElement.domElement,
            'Reset state'
          );

          this.clearCanvasButton = createElement(
            'button',
            {
              class: navBarOutlineButton,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (confirm('Are you sure you want to clear the canvas?')) {
                  this.clearCanvas();
                  store();
                }
                return false;
              },
            },
            menubarElement.domElement,
            'Clear canvas'
          );

          this.compositionEditButton = createElement(
            'button',
            {
              class: `${navBarButton} hidden`,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.editComposition();
                return false;
              },
            },
            menubarElement.domElement,
            'Edit composition'
          );

          this.compositionEditExitButton = createElement(
            'button',
            {
              class: `${navBarButton} hidden`,
            },
            menubarElement.domElement,
            'Exit Edit composition'
          );

          this.selectedNodeLabel = createElement(
            'div',
            {
              id: 'selectedNode',
              class: 'text-white',
            },
            menubarElement.domElement
          );

          registerCommands<GLNodeInfo>({
            rootElement: this.rootElement,
            canvasApp: this.canvasApp,
            canvasUpdated,
            removeElement: this.removeElement,
            getNodeTaskFactory: getGLNodeTaskFactory,
            commandRegistry: this.commandRegistry,
            setupTasksInDropdown: setupGLTasksInDropdown,
          });
        }

        this.clearCanvas();
        storageProvider
          .getFlow('gl')
          .then((flow) => {
            if (!this.canvasApp) {
              throw new Error('canvasApp not defined');
            }
            removeAllCompositions();
            importCompositions<GLNodeInfo>(flow.compositions, this.canvasApp);
            registerCompositionNodes(
              this.canvasApp.compositons.getAllCompositions()
            );
            importToCanvas(
              flow.flows.flow.nodes,
              this.canvasApp,
              canvasUpdated,
              undefined,
              0,
              getGLNodeTaskFactory
            );
            this.canvasApp.centerCamera();
            initializeNodes();
            this.flowTOGLCanvas();
            this.setTabOrderOfNodes();

            setupGLTasksInDropdown(
              this.selectNodeType?.domElement as HTMLSelectElement
            );
            this.isStoring = false;
          })
          .catch((error) => {
            console.log('error', error);
            this.isStoring = false;
          });
      })
      .catch((error) => {
        console.log('error', error);
      });

    const store = () => {
      if (this.storageProvider) {
        const nodesList = serializeFlow();
        if (!nodesList) {
          return;
        }
        console.log('nodesList', nodesList);
        const compositions = getSerializeCompositions() || {};
        console.log('compositions', compositions);
        const flow: Flow<GLNodeInfo> = {
          schemaType: 'flow',
          schemaVersion: '0.0.1',
          id: 'gl',
          flows: {
            flow: {
              flowType: 'flow',
              nodes: nodesList,
            },
          },
          compositions: compositions,
        };
        this.storageProvider.saveFlow('gl', flow);
      }
    };

    const setIsStoring = (isStoring: boolean) => {
      this.isStoring = isStoring;
    };

    this.canvasApp.setOnCanvasClick(() => {
      console.log('OnCanvasClick');
      setSelectNode(undefined);
    });

    const menubarContainerElement = createElement(
      'div',
      {
        class: menubarClasses,
      },
      this.rootElement
    );

    const menubarElement = createElement(
      'div',
      {
        class: menubarContainerClasses,
      },
      menubarContainerElement.domElement
    );

    const initializeNodes = () => {
      if (!this.rootElement) {
        return;
      }
      const elements = this.rootElement.querySelectorAll('.state-active');
      elements.forEach((element) => {
        element.classList.remove('state-active');
      });

      this.canvasApp?.elements.forEach((node) => {
        const nodeComponent = node as unknown as INodeComponent<GLNodeInfo>;
        if (nodeComponent.nodeType !== NodeType.Connection) {
          if (nodeComponent?.nodeInfo?.initializeCompute) {
            nodeComponent.nodeInfo.initializeCompute();
          }
        }
      });
    };

    const serializeFlow = () => {
      if (!this.canvasApp) {
        return;
      }
      return serializeElementsMap(this.canvasApp.elements);
    };

    const getSerializeCompositions = () => {
      if (!this.canvasApp) {
        return;
      }
      return serializeCompositions<GLNodeInfo>(
        this.canvasApp.compositons.getAllCompositions()
      );
    };

    const createOption = (
      selectElement: HTMLSelectElement,
      value: string,
      text: string,
      categoryName: string
    ) => {
      let category = selectElement.querySelector(
        "[data-category='" + categoryName + "']"
      );
      if (!category) {
        const optgroup = createElement(
          'optgroup',
          {
            label: categoryName,
            'data-category': categoryName,
          },
          selectElement
        );
        category = optgroup.domElement as HTMLElement;
      }
      const option = createElement(
        'option',
        {
          value: value,
        },
        category as HTMLElement,
        text
      );
      return option;
    };

    this.selectNodeType = createElement(
      'select',
      {
        type: 'select',
        class: 'p-2 m-2 relative max-w-[220px]', //top-[60px]',
        name: 'select-node-type',
        change: (_event) => {
          //
        },
      },
      menubarElement.domElement,
      ''
    );

    const setupTasksForContainerTaskInDropdown = (
      allowedNodeTasks: string[]
    ) => {
      if (this.selectNodeType?.domElement) {
        (this.selectNodeType?.domElement as HTMLSelectElement).innerHTML = '';

        const nodeTasks = getGLNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getGLNodeTaskFactory(nodeTask);
          if (factory) {
            const node = factory(canvasUpdated);
            if (allowedNodeTasks.indexOf(node.name) < 0) {
              return;
            }
          }
          createOption(
            this.selectNodeType?.domElement as HTMLSelectElement,
            nodeTask,
            nodeTask,
            ''
          );
        });
      }
    };
    setupGLTasksInDropdown(
      this.selectNodeType?.domElement as HTMLSelectElement
    );

    let currentSelectedNode: SelectedNodeInfo | undefined = undefined;

    const removeFormElement = () => {
      if (this.formElement) {
        // this.canvasApp?.deleteElementFromNode(
        //   this.editPopupContainer as INodeComponent<GLNodeInfo>,
        //   this.formElement
        // );
        this.formElement.domElement.remove();
        this.formElement = undefined;
      }
    };

    createEffect(() => {
      const selectedNodeInfo = getSelectedNode();
      console.log('selected nodeElement...', selectedNodeInfo);
      if (!this.rootElement) {
        return;
      }

      if (this.compositionEditButton?.domElement) {
        (
          this.compositionEditButton?.domElement as HTMLButtonElement
        ).classList.add('hidden');
      }

      this.rootElement.querySelectorAll('.selected').forEach((element) => {
        element.classList.remove('selected');
      });

      if (
        currentSelectedNode &&
        (!selectedNodeInfo || selectedNodeInfo.id !== currentSelectedNode.id)
      ) {
        const node = (
          currentSelectedNode?.containerNode
            ? (currentSelectedNode?.containerNode?.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.canvasApp?.elements
        )?.get(currentSelectedNode.id);
        if (node) {
          if (node.nodeType === NodeType.Connection) {
            node.connectorWrapper?.classList?.remove('selected');
          } else {
            node.domElement.classList.remove('selected');
          }
        }
      }

      removeFormElement();
      if (selectedNodeInfo && this.selectedNodeLabel) {
        this.selectedNodeLabel.domElement.textContent = 'NODE'; //`${selectedNodeInfo.id}`;
        const node = (
          selectedNodeInfo?.containerNode
            ? (selectedNodeInfo?.containerNode?.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.canvasApp?.elements
        )?.get(selectedNodeInfo.id);

        if (!node) {
          return;
        }

        if (node.nodeInfo?.isComposition) {
          (
            this.compositionEditButton?.domElement as HTMLButtonElement
          ).classList.remove('hidden');
        }

        if (node.nodeType === NodeType.Connection) {
          console.log('selected connection', node);
          node.connectorWrapper?.domElement?.classList?.add('selected');
        } else {
          node.domElement.classList.add('selected');
        }
        const nodeInfo: any = node?.nodeInfo ?? {};
        if (
          node &&
          (node as INodeComponent<GLNodeInfo>).nodeType === NodeType.Connection
        ) {
          (
            this.editPopupContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');
          (
            this.editPopupLineContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');

          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.add('hidden');

          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.remove('editing-node-indicator');

          return;
        }

        console.log('nodeInfo', nodeInfo);

        const factory = getGLNodeTaskFactory(nodeInfo.type);
        if (factory) {
          const nodeTask = factory(() => undefined);
          if ((nodeTask.childNodeTasks || []).length > 0) {
            setupTasksForContainerTaskInDropdown(nodeTask.childNodeTasks ?? []);
          } else {
            setupGLTasksInDropdown(
              this.selectNodeType?.domElement as HTMLSelectElement
            );
          }
        }

        if (((nodeInfo as any)?.formElements ?? []).length <= 1) {
          (
            this.editPopupContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');
          (
            this.editPopupLineContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');
          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.add('hidden');

          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.remove('editing-node-indicator');

          return;
        }

        const formElementInstance = createElement(
          'div',
          {},
          this.editPopupContainer?.domElement,
          undefined
        );
        this.formElement = formElementInstance;

        FormComponent({
          rootElement: this.formElement.domElement as HTMLElement,
          id: selectedNodeInfo.id,
          hasSubmitButton: false,
          onSave: (values: any) => {
            console.log('onSave', values);

            this.rootElement
              ?.querySelectorAll('.selected')
              .forEach((element) => {
                element.classList.remove('selected');
              });

            const node = (
              selectedNodeInfo?.containerNode
                ? (selectedNodeInfo?.containerNode.nodeInfo as any)
                    ?.canvasAppInstance?.elements
                : this.canvasApp?.elements
            )?.get(selectedNodeInfo.id);
            if (node) {
              if ((node.nodeInfo as any).formElements) {
                (node.nodeInfo as any).formValues = values;
                Object.entries(values).forEach(([key, value]) => {
                  console.log(
                    'updateNamedSignal',
                    selectedNodeInfo.id + '_' + key,
                    value
                  );
                  updateNamedSignal(
                    selectedNodeInfo.id + '_' + key,
                    value as unknown as string
                  );
                });
              } else {
                node.nodeInfo = values;
              }
            }

            removeFormElement();
            currentSelectedNode = undefined;

            if (this.selectedNodeLabel) {
              this.selectedNodeLabel.domElement.textContent = '';
            }
            (
              this.editPopupContainer?.domElement as unknown as HTMLElement
            ).classList.add('hidden');
            (
              this.editPopupLineContainer?.domElement as unknown as HTMLElement
            ).classList.add('hidden');

            (
              this.editPopupEditingNodeIndicator
                ?.domElement as unknown as HTMLElement
            ).classList.add('hidden');

            (
              this.editPopupEditingNodeIndicator
                ?.domElement as unknown as HTMLElement
            ).classList.remove('editing-node-indicator');
          },
          formElements: ((node?.nodeInfo as any)?.formElements ?? []).map(
            (item: any) => {
              return {
                ...item,
                value: ((node?.nodeInfo as any)?.formValues ?? {})[
                  item.fieldName
                ],
              };
            }
          ),
        }) as unknown as HTMLElement;
        console.log('before positionPopup1');
        this.positionPopup(node);
      } else {
        if (this.selectedNodeLabel) {
          this.selectedNodeLabel.domElement.textContent = '';
        }
        (
          this.editPopupContainer?.domElement as unknown as HTMLElement
        ).classList.add('hidden');
        (
          this.editPopupLineContainer?.domElement as unknown as HTMLElement
        ).classList.add('hidden');
        (
          this.editPopupEditingNodeIndicator
            ?.domElement as unknown as HTMLElement
        ).classList.add('hidden');

        (
          this.editPopupEditingNodeIndicator
            ?.domElement as unknown as HTMLElement
        ).classList.remove('editing-node-indicator');

        setupGLTasksInDropdown(
          this.selectNodeType?.domElement as HTMLSelectElement
        );

        if (getSelectedNode()) {
          setSelectNode(undefined);
        }
      }

      currentSelectedNode = selectedNodeInfo;
    });

    registerCustomFunction('log', [], (message: any) => {
      console.log('log', message);
    });
  }

  onAddComposition = (
    composition: Composition<GLNodeInfo>,
    connections: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<GLNodeInfo>;
    }[]
  ) => {
    if (!this.canvasApp) {
      return;
    }
    console.log('REGISTER COMPOSITION', composition);
    registerComposition(composition);

    const nodeType = `composition-${composition.id}`;

    let minX = -1;
    let minY = -1;
    let maxX = -1;
    let maxY = -1;
    composition.nodes.forEach((node) => {
      if (node.x < minX || minX === -1) {
        minX = node.x;
      }
      if (node.y < minY || minY === -1) {
        minY = node.y;
      }
      if (node.x + (node.width ?? 0) > maxX || maxX === -1) {
        maxX = node.x;
      }
      if (node.y + (node.height ?? 0) > maxY || maxY === -1) {
        maxY = node.y;
      }
    });
    minX = minX === -1 ? minX : composition.nodes[0]?.x ?? 0;
    minY = minY === -1 ? minY : composition.nodes[0]?.y ?? 0;
    const x = (minX + maxX) / 2 - 100;
    const y = (minY + maxY) / 2 - 100;

    const factory = getGLNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(() => undefined);

      const node = nodeTask.createVisualNode(this.canvasApp, x, y);
      if (node && node.nodeInfo) {
        // TODO : IMPROVE THIS
        (node.nodeInfo as any).taskType = nodeType;
      }

      connections.forEach((connection) => {
        if (!connection.connection.startNode) {
          connection.connection.startNode = node;

          connection.connection.startNodeThumb =
            getThumbNodeByIdentifierWithinNode<GLNodeInfo>(
              connection.thumbIdentifierWithinNode,
              node,
              {
                start: true,
                end: false,
              }
            ) || undefined;

          node.connections.push(connection.connection);
          connection.connection.update?.();
        }
        if (!connection.connection.endNode) {
          connection.connection.endNode = node;

          connection.connection.endNodeThumb =
            getThumbNodeByIdentifierWithinNode<GLNodeInfo>(
              connection.thumbIdentifierWithinNode,
              node,
              {
                start: false,
                end: true,
              }
            ) || undefined;
          node.connections.push(connection.connection);
          connection.connection.update?.();
        }
      });

      node?.update?.();
    }
  };

  editComposition = () => {
    const selectedNodeInfo = getSelectedNode();
    if (!selectedNodeInfo) {
      return;
    }
    const node = (
      selectedNodeInfo?.containerNode
        ? (selectedNodeInfo?.containerNode?.nodeInfo as any)?.canvasAppInstance
            ?.elements
        : this.canvasApp?.elements
    )?.get(selectedNodeInfo.id);

    if (!node) {
      return;
    }

    if (
      node.nodeInfo?.isComposition &&
      this.rootElement &&
      node.nodeInfo.compositionId
    ) {
      (this.compositionEditButton?.domElement as HTMLElement).classList.add(
        'hidden'
      );
      (
        this.compositionEditExitButton?.domElement as HTMLElement
      ).classList.remove('hidden');

      (this.clearCanvasButton?.domElement as HTMLElement).classList.add(
        'hidden'
      );
      (this.resetStateButton?.domElement as HTMLElement).classList.add(
        'hidden'
      );

      this.canvasApp?.setDisableInteraction(true);

      (this.canvas?.domElement as HTMLElement).classList.add('hidden');
      (this.canvas?.domElement as HTMLElement).classList.add(
        'pointer-events-none'
      );
      const composition = this.canvasApp?.compositons?.getComposition(
        node.nodeInfo.compositionId
      );
      if (!composition) {
        return;
      }
      this.canvasApp?.setIsCameraFollowingPaused(true);

      const canvasApp = createCanvasApp<GLNodeInfo>(
        this.rootElement,
        undefined,
        undefined,
        undefined,
        undefined,
        'composition-canvas-' + node.nodeInfo.compositionId
      );
      canvasApp?.setCamera(0, 0, 1);

      importToCanvas(
        composition.nodes,
        canvasApp,
        () => {
          //
        },
        undefined,
        0,
        getGLNodeTaskFactory
      );

      let minX = -1;
      let minY = -1;
      let maxX = -1;
      let maxY = -1;
      composition.nodes.forEach((node) => {
        if (node.x < minX || minX === -1) {
          minX = node.x;
        }
        if (node.y < minY || minY === -1) {
          minY = node.y;
        }
        if (node.x + (node.width ?? 0) > maxX || maxX === -1) {
          maxX = node.x;
        }
        if (node.y + (node.height ?? 0) > maxY || maxY === -1) {
          maxY = node.y;
        }
      });

      const nodesIdsToIgnore: string[] = [];

      // inputs
      composition.thumbs?.forEach((thumb, index) => {
        if (thumb.connectionType === ThumbConnectionType.end && thumb.nodeId) {
          const factory = getGLNodeTaskFactory('thumb-input');
          const node = canvasApp?.elements.get(
            thumb.nodeId
          ) as IRectNodeComponent<GLNodeInfo>;
          if (factory && this.canvasUpdated && node && thumb.name) {
            const nodeTask = factory(() => {
              //
            });
            nodeTask.setTitle?.(thumb.name);
            const thumbInput = nodeTask.createVisualNode(
              canvasApp,
              minX - 100,
              minY - 100 + index * 75
            );
            nodesIdsToIgnore.push(thumbInput.id);
            const connection = canvasApp.createCubicBezier(
              thumbInput.x,
              thumbInput.y,
              thumbInput.x,
              thumbInput.y,
              thumbInput.x,
              thumbInput.y,
              thumbInput.x,
              thumbInput.y,
              false,
              undefined,
              undefined,
              undefined
            );
            if (connection && connection.nodeComponent) {
              nodesIdsToIgnore.push(connection.nodeComponent.id);
              connection.nodeComponent.isControlled = true;
              connection.nodeComponent.nodeInfo = {} as GLNodeInfo;
              connection.nodeComponent.layer = 1;

              connection.nodeComponent.startNode = thumbInput;
              connection.nodeComponent.startNodeThumb =
                getThumbNodeByName<GLNodeInfo>('output', thumbInput, {
                  start: true,
                  end: false,
                }) || undefined;

              connection.nodeComponent.endNode = node;

              connection.nodeComponent.endNodeThumb =
                getThumbNodeByName<GLNodeInfo>(thumb.name, node, {
                  start: false,
                  end: true,
                }) || undefined;

              node.connections?.push(connection.nodeComponent);

              if (connection.nodeComponent.update) {
                connection.nodeComponent.update();
              }

              if (node.update) {
                node.update(node, node.x, node.y, node);
              }
            }
          }
        }
      });

      // outputs
      composition.thumbs?.forEach((thumb, index) => {
        if (thumb.connectionType === ThumbConnectionType.start) {
          const factory = getGLNodeTaskFactory('thumb-output');
          if (factory && this.canvasUpdated && node && thumb.name) {
            const nodeTask = factory(() => {
              //
            });
            const thumbOutput = nodeTask.createVisualNode(
              canvasApp,
              maxX + 100,
              minY - 100 + index * 75
            );

            nodesIdsToIgnore.push(thumbOutput.id);

            const connection = canvasApp.createCubicBezier(
              thumbOutput.x,
              thumbOutput.y,
              thumbOutput.x,
              thumbOutput.y,
              thumbOutput.x,
              thumbOutput.y,
              thumbOutput.x,
              thumbOutput.y,
              false,
              undefined,
              undefined,
              undefined
            );
            if (connection && connection.nodeComponent) {
              nodesIdsToIgnore.push(connection.nodeComponent.id);
              connection.nodeComponent.isControlled = true;
              connection.nodeComponent.nodeInfo = {} as GLNodeInfo;
              connection.nodeComponent.layer = 1;

              connection.nodeComponent.startNode = node;

              connection.nodeComponent.startNodeThumb =
                getThumbNodeByName<GLNodeInfo>(thumb.name, node, {
                  start: false,
                  end: true,
                }) || undefined;

              connection.nodeComponent.endNode = thumbOutput;
              connection.nodeComponent.endNodeThumb =
                getThumbNodeByName<GLNodeInfo>('input', thumbOutput, {
                  start: true,
                  end: false,
                }) || undefined;

              node.connections?.push(connection.nodeComponent);

              if (connection.nodeComponent.update) {
                connection.nodeComponent.update();
              }

              if (node.update) {
                node.update(node, node.x, node.y, node);
              }
            }
          }
        }
      });

      const quitCameraSubscribtion = setCameraAnimation(canvasApp);
      canvasApp.setOnWheelEvent((x: number, y: number, scale: number) => {
        setPositionTargetCameraAnimation(x, y, scale);
      });
      canvasApp.setonDragCanvasEvent((x, y) => {
        setPositionTargetCameraAnimation(x, y);
      });

      canvasApp.centerCamera();
      const handler = () => {
        quitCameraSubscribtion();
        canvasApp?.elements.forEach((element) => {
          if (nodesIdsToIgnore.indexOf(element.id) >= 0) {
            const nodeHelper = element as unknown as INodeComponent<GLNodeInfo>;
            if (nodeHelper.nodeType === NodeType.Connection) {
              const connectionHelper =
                element as unknown as IConnectionNodeComponent<GLNodeInfo>;
              if (connectionHelper.startNode) {
                connectionHelper.startNode.connections =
                  connectionHelper.startNode?.connections?.filter(
                    (c) => c.id !== connectionHelper.id
                  );
              }
              if (connectionHelper.endNode) {
                connectionHelper.endNode.connections =
                  connectionHelper.endNode?.connections?.filter(
                    (c) => c.id !== connectionHelper.id
                  );
              }
            }

            element.domElement.remove();
            this.removeElement(element);
          }
        });
        nodesIdsToIgnore.forEach((id) => {
          canvasApp?.elements.delete(id);
        });

        // store changes to composition
        const nodesToStore = Array.from(canvasApp?.elements).map((element) => {
          const nodeToToConvert =
            element[1] as unknown as INodeComponent<GLNodeInfo>;
          if (nodeToToConvert.nodeType === NodeType.Connection) {
            return mapConnectionToFlowNode(
              nodeToToConvert as IConnectionNodeComponent<GLNodeInfo>
            );
          } else {
            return mapShapeNodeToFlowNode(
              nodeToToConvert as IRectNodeComponent<GLNodeInfo>
            );
          }
        });
        composition.nodes = nodesToStore;
        this.canvasApp?.compositons.setComposition(composition);

        // remove and cleanup temp canvas
        canvasApp?.elements.forEach((element) => {
          element.domElement.remove();
          this.removeElement(element);
        });
        canvasApp?.elements.clear();
        canvasApp?.setDisableInteraction(true);
        canvasApp.removeEvents();
        canvasApp.canvas?.domElement.remove();
        this.canvasApp?.elements.forEach((element) => {
          const node = element as INodeComponent<GLNodeInfo>;
          if (node.nodeInfo?.isComposition) {
            node.nodeInfo?.initializeCompute?.();
          }
        });
        //node.nodeInfo.initializeCompute();

        (this.canvas?.domElement as HTMLElement).classList.remove('hidden');
        (this.canvas?.domElement as HTMLElement).classList.remove(
          'pointer-events-none'
        );
        this.canvasApp?.setIsCameraFollowingPaused(false);
        this.canvasApp?.setDisableInteraction(false);
        this.canvasApp?.centerCamera();

        this.canvasUpdated?.();

        (
          this.compositionEditExitButton?.domElement as HTMLElement
        ).removeEventListener('click', handler);

        (
          this.compositionEditExitButton?.domElement as HTMLElement
        ).classList.add('hidden');

        (this.clearCanvasButton?.domElement as HTMLElement).classList.remove(
          'hidden'
        );
        (this.resetStateButton?.domElement as HTMLElement).classList.remove(
          'hidden'
        );
      };
      (
        this.compositionEditExitButton?.domElement as HTMLElement
      ).addEventListener('click', handler);
      //
    }
  };

  getSelectTaskElement = () => {
    return this.selectNodeType?.domElement as HTMLSelectElement;
  };
  onShouldPositionPopup = (node: IRectNodeComponent<GLNodeInfo>) => {
    const nodeInfo = node?.nodeInfo ?? {};
    if (node && node.nodeType === NodeType.Connection) {
      return false;
    }

    if ((nodeInfo?.formElements ?? []).length === 0) {
      return false;
    }
    if (!this.formElement) {
      return false;
    }
    return true;
  };

  onPreRemoveElement = (element: IElementNode<GLNodeInfo>) => {
    if (element.nodeInfo?.delete) {
      element.nodeInfo.delete();
    }
  };

  onPreclearCanvas = () => {
    //
  };
  setCameraTargetOnNode = (node: IRectNodeComponent<GLNodeInfo>) => {
    setTargetCameraAnimation(node.x, node.y, node.id, 1.0, true);
  };

  updateGLCanvasParameters = () => {
    this.pauseRender = true;
    if (
      this.fragmentShader &&
      this.vertexShader &&
      this.shaderProgram &&
      this.gl
    ) {
      console.log('SHADER RECREATION');

      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.detachShader(this.shaderProgram, this.fragmentShader);
      this.gl.detachShader(this.shaderProgram, this.vertexShader);
      this.gl.deleteProgram(this.shaderProgram);
    }
    if (this.gl) {
      this.u_timeUniformLocation = null;
      this.u_CanvasWidthUniformLocation = null;
      this.u_CanvasHeightUniformLocation = null;
      this.u_TestUniformLocation = null;
      this.setupShader(this.gl);
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.pauseRender = false;
    }
  };

  test = 1;
  glcanvas: HTMLCanvasElement | undefined = undefined;
  canvasSize: DOMRect | undefined = undefined;
  setupWindowResize = () => {
    window.addEventListener('resize', () => {
      if (!this.glcanvas) {
        return;
      }
      this.canvasSize = this.glcanvas?.getBoundingClientRect();
      this.glcanvas.width = this.canvasSize.width;
      this.glcanvas.height = this.canvasSize.height;
      console.log('resize', this.canvasSize.width, this.canvasSize.height);
      this.gl?.viewport(0, 0, this.canvasSize.width, this.canvasSize.height);
    });
  };
  gl: WebGLRenderingContext | null = null;
  fragmentShader: WebGLShader | null = null;
  vertexShader: WebGLShader | null = null;
  shaderProgram: WebGLProgram | null = null;
  u_timeUniformLocation: WebGLUniformLocation | null = null;
  u_CanvasWidthUniformLocation: WebGLUniformLocation | null = null;
  u_CanvasHeightUniformLocation: WebGLUniformLocation | null = null;
  u_TestUniformLocation: WebGLUniformLocation | null = null;
  vertexPositionAttribute = 0;

  shaderExtensions = '';
  createFragmentShader = (statements: string) => {
    return `
    precision mediump float;
    uniform float u_time;
    uniform float u_width;
    uniform float u_height;
    uniform float u_test;
    
    #define PI = 3.1415926535897932384626433832795;
    float metaball(vec2 p, vec2 center, float radius) {
      float r = radius * radius;
      float d = length(p - center);
      return r / (d * d);
    }

    vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
      return a + b*cos( 6.28318*(c*t+d) );  
    }

    vec3 palette2(float t) {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(0.263,0.416,0.557);

      return a + b*cos( 6.28318*(c*t+d) );
    }

    vec3 chooseColor(in float paletteOffset) {
      return palette(paletteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(2.0,1.0,0.0), vec3(0.5,0.20,0.25));
    }

    vec3 chooseColor2(in float paletteOffset) {
      return palette(paletteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.33,0.67));
    }
    
   

    ${this.shaderExtensions}
	
  
    void main() {
      float aspect = u_width/u_height;
      vec2 resolution = vec2(u_width, u_height);
      vec2 uv = (gl_FragCoord.xy / resolution.xy);      
      uv = uv * 2.0 - 1.0;
      uv.x *= aspect;

      vec3 backgroundColor = vec3(0.0, 0.0, 0.0);
      vec3 finalColor = vec3(0.0);
      vec3 totalcolinf = vec3(0.00);
      float totalInfluence = 0.0;

      ${statements}

      float threshold = 1.5;
      float threshold2 = 3.5;
      if (totalInfluence > threshold) {
          vec3 color = (totalcolinf) / totalInfluence;
          if (totalInfluence < threshold2) {
            color = mix(backgroundColor, color, (totalInfluence - threshold) / (threshold2 - threshold));
          }
          gl_FragColor = vec4(color, 1.0);
      } else {
          gl_FragColor = vec4(backgroundColor, 1.0);
      }          
    }
    `;
  };

  vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
          gl_Position = aVertexPosition;
      }
    `;

  createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('An error occurred creating the shaders');
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        'An error occurred compiling the shaders: ' +
          gl.getShaderInfoLog(shader)
      );
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  initShaderProgram = (
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
  ) => {
    this.vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    this.fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    this.shaderProgram = gl.createProgram();
    if (!this.shaderProgram) {
      console.error('Unable to create shader program');
      return null;
    }
    if (!this.vertexShader || !this.fragmentShader) {
      console.error('Unable to create vertex or fragment shader');
      return null;
    }
    gl.attachShader(this.shaderProgram, this.vertexShader);
    gl.attachShader(this.shaderProgram, this.fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.error(
        'Unable to initialize the shader program: ' +
          gl.getProgramInfoLog(this.shaderProgram)
      );
      return null;
    }

    return;
  };

  setupShader = (gl: WebGLRenderingContext) => {
    const fsSource = this.createFragmentShader(`
      ${this.shaderStatements}
    `);
    console.log('fsSource', fsSource);
    this.initShaderProgram(gl, this.vsSource, fsSource);
    if (!this.shaderProgram) {
      throw new Error('Unable to initialize the shader program');
    }
    this.u_timeUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_time'
    );
    this.u_CanvasWidthUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_width'
    );
    this.u_CanvasHeightUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_height'
    );
    this.u_TestUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_test'
    );

    this.vertexPositionAttribute = gl.getAttribLocation(
      this.shaderProgram,
      'aVertexPosition'
    );
  };

  shaderNodePreoutput = '';

  getNodeOutput = (
    node: IRectNodeComponent<GLNodeInfo>,
    thumbName: string,
    thumbIdentifierWithinNode?: string
  ) => {
    const inputs: Record<string, string> = {};
    if (node?.nodeInfo?.isComposition) {
      console.log('Composite node in getNodeOutput', node);
    }
    (node?.connections ?? []).forEach((connection) => {
      if (connection.endNode?.id === node.id) {
        // console.log(
        //   'getNodeOutput',
        //   connection.startNodeThumb?.thumbName ?? '',
        //   connection.startNodeThumb
        // );

        if (
          connection.endNodeThumb?.thumbIdentifierWithinNode &&
          node.nodeInfo?.isComposition
        ) {
          inputs[connection.endNodeThumb.thumbIdentifierWithinNode] =
            this.getNodeOutput(
              connection.startNode as IRectNodeComponent<GLNodeInfo>,
              connection.startNodeThumb?.thumbName ?? '',
              connection.startNodeThumb?.thumbIdentifierWithinNode ?? ''
            );
        } else if (connection.endNodeThumb?.thumbName) {
          inputs[connection.endNodeThumb.thumbName] = this.getNodeOutput(
            connection.startNode as IRectNodeComponent<GLNodeInfo>,
            connection.startNodeThumb?.thumbName ?? '',
            connection.startNodeThumb?.thumbIdentifierWithinNode ?? ''
          );
        }
      }
    });

    const result = node?.nodeInfo?.compute?.(
      0,
      0,
      inputs,
      thumbName,
      thumbIdentifierWithinNode
    );
    if ((result as any).preoutput) {
      this.shaderNodePreoutput += (result as any).preoutput;
    }
    return result?.result ?? '';
  };

  getInputsForNode = (node: IRectNodeComponent<GLNodeInfo>) => {
    const inputs: Record<string, string> = {};
    (node?.connections ?? []).forEach((connection) => {
      if (connection.endNode?.id === node.id) {
        if (
          connection.endNodeThumb?.thumbIdentifierWithinNode &&
          connection.startNode
        ) {
          inputs[connection.endNodeThumb.thumbIdentifierWithinNode] =
            this.getNodeOutput(
              connection.startNode,
              connection.startNodeThumb?.thumbName ?? '',
              connection.startNodeThumb?.thumbIdentifierWithinNode ?? ''
            );
        } else if (connection.endNodeThumb?.thumbName && connection.startNode) {
          inputs[connection.endNodeThumb.thumbName] = this.getNodeOutput(
            connection.startNode,
            connection.startNodeThumb?.thumbName ?? '',
            connection.startNodeThumb?.thumbIdentifierWithinNode ?? ''
          );
        }
      }
    });
    return inputs;
  };
  shaderStatements = '';
  flowTOGLCanvas = () => {
    console.log('flowTOGLCanvas');
    let sdfIndex = 1;
    this.shaderStatements = '';
    this.shaderExtensions = '';
    const nodeVisited: string[] = [];
    const glslFunctions = getGLSLFunctions();
    if (this.canvasApp) {
      const compositions = this.canvasApp.compositons.getAllCompositions();
      Object.entries(compositions).forEach(([_key, composition]) => {
        composition.nodes.forEach((node) => {
          if (node.nodeInfo?.type && glslFunctions[node.nodeInfo?.type]) {
            if (nodeVisited.indexOf(node.nodeType ?? '') < 0) {
              nodeVisited.push(node.nodeType ?? '');
              const glslFunction = glslFunctions[node.nodeInfo?.type];
              this.shaderExtensions += glslFunction;
            }
          }
        });
      });
      const visitedNodes: string[] = [];

      this.canvasApp.elements.forEach((element) => {
        const node = element as unknown as INodeComponent<GLNodeInfo>;
        if (node.nodeType === NodeType.Shape) {
          if (node.nodeType && glslFunctions[node.nodeType]) {
            if (nodeVisited.indexOf(node.nodeType ?? '') < 0) {
              nodeVisited.push(node.nodeType ?? '');
              const glslFunction = glslFunctions[node.nodeType];
              this.shaderExtensions += glslFunction;
            }
          }
          if (
            node.nodeInfo?.type === 'define-vec2-variable-node' ||
            node.nodeInfo?.type === 'define-color-variable-node'
          ) {
            const inputs = this.getInputsForNode(
              node as IRectNodeComponent<GLNodeInfo>
            );
            visitedNodes.push(node.id);
            const result = node.nodeInfo?.compute?.(0, sdfIndex, inputs);
            this.shaderStatements += result?.result ?? '';
            this.shaderStatements += `
`;
            sdfIndex++;
          }
        }
      });
      this.canvasApp.elements.forEach((element) => {
        this.shaderNodePreoutput = '';
        const node = element as unknown as INodeComponent<GLNodeInfo>;
        if (node.nodeType === NodeType.Shape) {
          if (visitedNodes.indexOf(node.id) < 0) {
            if (node.nodeType && glslFunctions[node.nodeType]) {
              if (nodeVisited.indexOf(node.nodeType ?? '') < 0) {
                nodeVisited.push(node.nodeType ?? '');
                const glslFunction = glslFunctions[node.nodeType];
                this.shaderExtensions += glslFunction;
              }
            }

            if (
              node.nodeInfo?.type === 'set-vec2-variable-node' ||
              node.nodeInfo?.type === 'set-color-variable-node' ||
              node.nodeInfo?.type === 'set-and-add-color-variable-node' ||
              node.nodeInfo?.isComposition
            ) {
              const inputs = this.getInputsForNode(
                node as IRectNodeComponent<GLNodeInfo>
              );
              const result = node.nodeInfo?.compute?.(
                0,
                sdfIndex,
                inputs,
                {} as any,
                node.nodeInfo?.isComposition ? 'test' : undefined
              );

              this.shaderStatements +=
                this.shaderNodePreoutput + result?.result ?? '';
              this.shaderStatements += `
`;
              sdfIndex++;
            }
          }
        }
      });

      this.canvasApp.elements.forEach((element) => {
        this.shaderNodePreoutput = '';
        const node = element as unknown as INodeComponent<GLNodeInfo>;
        if (node.nodeType === NodeType.Shape) {
          if (visitedNodes.indexOf(node.id) < 0) {
            if (node.nodeType && glslFunctions[node.nodeType]) {
              if (nodeVisited.indexOf(node.nodeType ?? '') < 0) {
                nodeVisited.push(node.nodeType ?? '');
                const glslFunction = glslFunctions[node.nodeType];
                this.shaderExtensions += glslFunction;
              }
            }
            if (
              node.nodeInfo?.type === 'circle-node' ||
              node.nodeInfo?.type === 'output-color-node'
            ) {
              const inputs = this.getInputsForNode(
                node as IRectNodeComponent<GLNodeInfo>
              );
              const result = node.nodeInfo?.compute?.(
                0,
                sdfIndex,
                inputs,
                {} as any,
                node.nodeInfo?.isComposition ? 'test' : undefined
              );

              this.shaderStatements +=
                this.shaderNodePreoutput + result?.result ?? '';
              this.shaderStatements += `
`;
              sdfIndex++;
            }
          }
        }
      });

      this.updateGLCanvasParameters();
    }
  };

  pauseRender = false;
  positionBuffer: WebGLBuffer | null = null;
  setupGLCanvas = () => {
    this.glcanvas = document.getElementById('glcanvas') as HTMLCanvasElement;
    this.canvasSize = this.glcanvas.getBoundingClientRect();
    this.glcanvas.width = this.canvasSize.width;
    this.glcanvas.height = this.canvasSize.height;

    const gl = this.glcanvas.getContext('webgl');
    this.gl?.viewport(0, 0, this.canvasSize.width, this.canvasSize.height);

    if (!gl) {
      console.error('WebGL not supported');
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    this.setupShader(gl);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    if (!this.positionBuffer) {
      throw new Error('Unable to create buffer');
    }
    this.timerCount = 0.0;
    this.rafId = requestAnimationFrame(this.renderLoop);
  };
  timerCount = 0.0;
  renderLoop = () => {
    if (
      this.pauseRender ||
      !this.gl ||
      !this.shaderProgram ||
      !this.glcanvas ||
      !this.positionBuffer
    ) {
      return;
    }

    const time = performance.now() * 0.001; // time in seconds

    this.drawScene(
      this.gl,
      this.shaderProgram,
      this.positionBuffer,
      time,
      this.glcanvas
    );
    this.timerCount = 0.0;
    requestAnimationFrame(this.renderLoop);
  };
  drawScene = (
    gl: WebGLRenderingContext,
    shaderProgram: WebGLProgram,
    positionBuffer: WebGLBuffer,
    time: number,
    glcanvas: HTMLCanvasElement
  ) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    gl.uniform1f(this.u_timeUniformLocation, time);
    gl.uniform1f(this.u_CanvasWidthUniformLocation, glcanvas.width);
    gl.uniform1f(this.u_CanvasHeightUniformLocation, glcanvas.height);
    gl.uniform1f(this.u_TestUniformLocation, this.test);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    let offset = 0;
    gl.vertexAttribPointer(
      this.vertexPositionAttribute,
      size,
      type,
      normalize,
      stride,
      offset
    );

    const primitiveType = gl.TRIANGLE_STRIP;
    offset = 0;
    const count = 4;
    gl.drawArrays(primitiveType, offset, count);
  };
  rafId = -1;
}
