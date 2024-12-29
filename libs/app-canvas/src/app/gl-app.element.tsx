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
  IRectNodeComponent,
  Flow,
  updateNamedSignal,
  NodeType,
  SelectedNodeInfo,
  FlowNode,
  IDOMElement,
  Composition,
  IConnectionNodeComponent,
  standardTheme,
  ElementNodeMap,
  createFlowCanvas,
  renderElement,
  createJSXElement,
  CanvasAction,
  setActionNode,
  FormComponent,
  importCompositions,
  importToCanvas,
  IFlowCanvasBase,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

import { registerCustomFunction } from '@devhelpr/expression-compiler';

import { createIndexedDBStorageProvider } from './storage/indexeddb-storage-provider';
import {
  GLNavbarComponent,
  GLNavbarMenu,
} from './components/gl-navbar-components';
import {
  menubarClasses,
  menubarContainerClasses,
  navBarButton,
  navBarIconButton,
  navBarIconButtonInnerElement,
  navBarOutlineButton,
  navBarPrimaryButton,
} from './consts/classes';
import {
  serializeCompositions,
  SerializedFlow,
  serializeElementsMap,
} from './storage/serialize-canvas';
import { AppElement } from './app.element';
import {
  getGLNodeFactoryNames,
  getGLNodeTaskFactory,
  glNodeTaskRegistryLabels,
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
import {
  executeCommand,
  registerCommands,
} from './command-handlers/register-commands';
import {
  createOptionGLGroups,
  getGLTaskList,
  setupGLTasksInDropdown,
} from './node-task-registry/setupGLTasksInDropdown';
import { GLNodeInfo } from './types/gl-node-info';
import { getGLSLFunctions } from './nodes-gl/custom-glsl-functions-registry';
import {
  floatType,
  vec2Type,
  vec3Type,
  vec4Type,
} from './gl-types/float-vec2-vec3';
import {
  addClasses,
  addClassesHTMLElement,
  removeClasses,
  removeClassesHTMLElement,
} from './utils/add-remove-classes';
import { getSortedNodes } from './utils/sort-nodes';
import { ShaderCompileHistory } from './interfaces/ShaderCompileHistory';
import {
  hideElement,
  hideHTMLElement,
  showElement,
  showHTMLElement,
} from './utils/show-hide-element';
import { Toolbar } from './components/toolbar';
import { exportTldraw } from './exporters/export-tldraw';
import { downloadFile } from './utils/create-download-link';
import { StorageProvider } from './storage/StorageProvider';

export class GLAppElement extends AppElement<GLNodeInfo> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  pathRange: IDOMElement | undefined = undefined;

  glNavbarComponent: GLNavbarComponent | undefined = undefined;
  scopeNodeDomElement: HTMLElement | undefined = undefined;
  menubarElement: IDOMElement | undefined = undefined;
  historyModeExitButton: IDOMElement | undefined = undefined;
  formElement: IDOMElement | undefined = undefined;
  selectedNodeLabel: IDOMElement | undefined = undefined;
  exportExternalButton: HTMLElement | undefined = undefined;

  focusedNode: IRectNodeComponent<GLNodeInfo> | undefined = undefined;
  runButton: IDOMElement | undefined = undefined;
  selectNodeType: IDOMElement | undefined = undefined;
  mouseX = 0;
  mouseY = 0;
  positionX = 0;
  positionY = 0;
  wheel = 1;
  isMovingGLCanvas = false;
  startGLCanvasDragX = 0;
  startGLCanvasDragY = 0;
  orgPositionX = 0;
  orgPositionY = 0;
  canvasUpdated: (() => void) | undefined = undefined;

  canvasAction: CanvasAction = CanvasAction.idle;
  canvasActionPayload: any = undefined;

  shaderCompileHistory: ShaderCompileHistory[] = [];
  addCompiledShaderToHistory = false;

  updateToolbarTaskList: (() => void) | undefined = undefined;

  constructor(
    appRootSelector: string,
    storageProvider?: StorageProvider<GLNodeInfo>,
    heightSpaceForHeaderFooterToolbars?: number,
    widthSpaceForSideToobars?: number
  ) {
    const template = document.createElement('template');
    template.innerHTML = `<div>
      <div class="min-h-dvh w-1/2 ${standardTheme.background} overflow-hidden touch-none" id="root" >
      </div>
      <canvas id="glcanvas" class="gl-canvas"></canvas></div>
    `;

    super(
      appRootSelector,
      template,
      standardTheme,
      storageProvider,
      undefined,
      heightSpaceForHeaderFooterToolbars,
      widthSpaceForSideToobars,
      getGLNodeTaskFactory
    );

    if (!this.rootElement) {
      return;
    }
    if (!this.canvasApp) {
      return;
    }
    this.canvasApp.setCanvasAction((action, payload?: any) => {
      this.canvasAction = action;
      this.canvasActionPayload = payload;
    });

    this.setupWindowResize();
    this.setupGLCanvas();
    const glcanvas = document.getElementById('glcanvas');

    let skipFirstPointerMoveOnTouch = false;
    let isZoomingViaTouch = false;
    let startDistance: null | number = null;
    let startCenterX = 0;
    let startCenterY = 0;

    document
      .getElementById('glcanvas')
      ?.addEventListener('pointerdown', (event) => {
        isZoomingViaTouch = false;
        if (event.pointerType === 'touch') {
          skipFirstPointerMoveOnTouch = true;
        }
        this.isMovingGLCanvas = true;
        if (glcanvas) {
          const canvasSize = glcanvas.getBoundingClientRect();
          const width = canvasSize.width;
          const height = canvasSize.height;

          const aspect = width / height;
          let uvx = event.offsetX / width;
          let uvy = event.offsetY / height;
          uvx = uvx * 2.0 - 1.0;
          uvy = uvy * 2.0 - 1.0;
          uvx *= aspect;
          this.startGLCanvasDragX = uvx;
          this.startGLCanvasDragY = uvy;
          this.orgPositionX = this.positionX;
          this.orgPositionY = this.positionY;
        }
      });

    document
      .getElementById('glcanvas')
      ?.addEventListener('pointermove', (event) => {
        if (skipFirstPointerMoveOnTouch) {
          skipFirstPointerMoveOnTouch = false;
          return;
        }
        if (isZoomingViaTouch) {
          return;
        }

        if (glcanvas) {
          const canvasSize = glcanvas.getBoundingClientRect();
          const width = canvasSize.width;
          const height = canvasSize.height;

          const aspect = width / height;
          let uvx = event.offsetX / width;
          let uvy = event.offsetY / height;

          uvx = uvx * 2.0 - 1.0;
          uvy = uvy * 2.0 - 1.0;
          uvx *= aspect;
          this.mouseX = uvx;
          this.mouseY = uvy;
          const uvNodes = document.querySelectorAll('.uv-node');
          uvNodes.forEach((node) => {
            node.innerHTML = `UV<br />${uvx.toFixed(2)} ${uvy.toFixed(2)}`;
          });

          if (this.isMovingGLCanvas) {
            const movedX = uvx - this.startGLCanvasDragX;
            const movedY = uvy - this.startGLCanvasDragY;
            this.positionX = this.orgPositionX + movedX;
            this.positionY = this.orgPositionY + movedY;
          }

          this.updateSceneParamsInNodes();
        }
      });

    document
      .getElementById('glcanvas')
      ?.addEventListener('pointerup', (_event) => {
        this.isMovingGLCanvas = false;
      });

    document
      .getElementById('glcanvas')
      ?.addEventListener('pointerleave', (_event) => {
        const uvNodes = document.querySelectorAll('.uv-node');
        uvNodes.forEach((node) => {
          node.textContent = 'UV';
        });
        this.isMovingGLCanvas = false;
      });

    const isMacOs =
      typeof navigator !== 'undefined' &&
      navigator?.userAgent?.indexOf('Mac') >= 0;

    const onGLCanvasWheelEvent = (event: WheelEvent) => {
      if (
        event.target &&
        (event.target as any).closest &&
        ((event.target as any).closest('.menu') ||
          (event.target as any).closest('.menu-container'))
      ) {
        return;
      }

      if (isZoomingViaTouch && !(event as any).viaTouch) {
        return;
      }

      if (!(event as any).viaTouch) {
        event.preventDefault();
      }

      const factor = event.ctrlKey
        ? isMacOs
          ? 350
          : 350
        : isMacOs
        ? 150
        : 150;

      const delta =
        -event.deltaY *
        (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
        factor;

      // Determine the scale factor for the zoom
      const scaleFactor = 1 + delta * 0.005;

      const scaleBy = scaleFactor;

      // const mousePointTo = {
      //   x: event.clientX / scaleCamera - xCamera / scaleCamera,
      //   y: event.clientY / scaleCamera - yCamera / scaleCamera,
      // };

      if (glcanvas) {
        const canvasSize = glcanvas.getBoundingClientRect();
        const width = canvasSize.width;
        const height = canvasSize.height;

        const aspect = width / height;
        let uvx = event.offsetX / width;
        let uvy = event.offsetY / height;

        uvx = uvx * 2.0 - 1.0;
        uvy = uvy * 2.0 - 1.0;
        uvx *= aspect;

        const mousePointTo = {
          x: uvx * this.wheel - this.positionX * this.wheel,
          y: uvy * this.wheel - this.positionY * this.wheel,
        };
        const newScale = this.wheel / scaleBy;

        const newPos = {
          x: -(mousePointTo.x - uvx * newScale) / newScale,
          y: -(mousePointTo.y - uvy * newScale) / newScale,
        };

        this.positionX = newPos.x;
        this.positionY = newPos.y;

        this.wheel = newScale;

        this.updateSceneParamsInNodes();
      }
    };

    document
      .getElementById('glcanvas')
      ?.addEventListener('wheel', onGLCanvasWheelEvent);

    document
      .getElementById('glcanvas')
      ?.addEventListener('touchmove', (event) => {
        if (
          event.target &&
          (event.target as any).closest &&
          ((event.target as any).closest('.menu') ||
            (event.target as any).closest('.menu-container'))
        ) {
          return;
        }

        if (glcanvas && event.touches.length == 2) {
          event.preventDefault();
          isZoomingViaTouch = true;
          event.stopPropagation();
          const touch1 = event.touches[0];
          const touch2 = event.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          );

          if (startDistance === null) {
            startDistance = distance;
            startCenterX = (touch1.clientX + touch2.clientX) / 2;
            startCenterY = (touch1.clientY + touch2.clientY) / 2;
          } else {
            startCenterX = (touch1.clientX + touch2.clientX) / 2;
            startCenterY = (touch1.clientY + touch2.clientY) / 2;
            // console.log(
            //   'touchzoom',
            //   touch1.clientX,
            //   touch1.clientY,
            //   touch2.clientX,
            //   touch2.clientY,
            //   startDistance,
            //   distance,
            //   startCenterX,
            //   startCenterY,
            //   glcanvas.offsetLeft,
            //   glcanvas.offsetTop
            // );
            onGLCanvasWheelEvent({
              deltaY: (distance - startDistance) * -0.55,
              target: event.target,
              viaTouch: true,
              offsetX: startCenterX - glcanvas.offsetLeft,
              offsetY: startCenterY - glcanvas.offsetTop,
            } as unknown as WheelEvent);
          }
          return false;
        }
        return true;
      });
    document
      .getElementById('glcanvas')
      ?.addEventListener('touchend', (_event) => {
        startDistance = null;
        isZoomingViaTouch = false;
      });
    document
      .getElementById('glcanvas')
      ?.addEventListener('touchcancel', (_event) => {
        startDistance = null;
        isZoomingViaTouch = false;
      });

    this.canvasApp.setOnAddcomposition(this.onAddGLComposition);
    const canvasUpdated = (_?: boolean, storeOnly?: boolean) => {
      if (this.isStoring) {
        return;
      }
      if (!storeOnly) {
        this.flowTOGLCanvas();
      }
      store();
      if (!storeOnly) {
        this.setTabOrderOfNodes();
      }
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

    setupGLNodeTaskRegistry(this.updateUniformValue);

    const storageProviderPromise = this.storageProvider
      ? Promise.resolve(this.storageProvider)
      : createIndexedDBStorageProvider<GLNodeInfo>();

    storageProviderPromise
      .then((storageProvider) => {
        console.log('storageProvider', storageProvider);
        this.isStoring = true;
        this.storageProvider = storageProvider;

        this.initializeCommandHandlers();

        if (
          this.storageProvider &&
          this.canvasApp &&
          this.rootElement &&
          this.menubarElement
        ) {
          this.glNavbarComponent = GLNavbarMenu({
            clearCanvas: this.clearCanvas,
            initializeNodes: initializeNodes,
            storageProvider: this.storageProvider,
            selectNodeType: this.selectNodeType
              ?.domElement as HTMLSelectElement,
            canvasUpdated: canvasUpdated,
            getCanvasApp: () => this.currentCanvasApp,
            removeElement: this.removeElement,
            rootElement: this.menubarElement.domElement as HTMLElement,
            rootAppElement: this.rootElement as HTMLElement,
            setIsStoring: setIsStoring,
            executeCommand: (
              command: string,
              parameter1: any,
              parameter2: any
            ) =>
              executeCommand(
                this.commandRegistry,
                command,
                parameter1,
                parameter2
              ),
            importToCanvas: (
              nodesList: FlowNode<GLNodeInfo>[],
              canvasApp: IFlowCanvasBase<GLNodeInfo>,
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
              this.updateToolbarTaskList?.();

              (this.pathRange?.domElement as HTMLElement).setAttribute(
                'value',
                '0'
              );
              (this.pathRange?.domElement as HTMLElement).setAttribute(
                'max',
                '0'
              );
              (
                this.pathRange?.domElement as unknown as HTMLInputElement
              ).value = '0';
            },
          });

          this.resetStateButton = createElement(
            'button',
            {
              class: navBarButton,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.wheel = 1.0;
                this.positionX = 0;
                this.positionY = 0;
                initializeNodes();
                return false;
              },
            },
            this.menubarElement.domElement,
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
            this.menubarElement.domElement,
            'Clear canvas'
          );

          this.compositionEditButton = createElement(
            'button',
            {
              class: `${navBarPrimaryButton} hidden`,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.editGLComposition();
                return false;
              },
            },
            this.menubarElement.domElement,
            'Edit composition'
          );

          this.compositionNameButton = createElement(
            'button',
            {
              class: `${navBarButton} hidden`,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.editCompositionName();
                return false;
              },
            },
            this.menubarElement.domElement,
            'Edit composition name'
          );

          this.compositionCreateButton = createElement(
            'button',
            {
              class: `${navBarButton}`,
              click: (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.createFlowComposition();
                return false;
              },
            },
            this.menubarElement.domElement,
            'Create composition'
          );

          renderElement(
            <button
              class={`${navBarIconButton}`}
              title="Export to external (work in progress - currently to tldraw)"
              click={() => {
                if (!this.canvasApp) {
                  return;
                }
                exportTldraw({
                  canvasApp: this.canvasApp,
                  downloadFile,
                });
              }}
              getElement={(element: HTMLElement) => {
                this.exportExternalButton = element;
              }}
            >
              <span
                class={`${navBarIconButtonInnerElement} icon-file_downloadget_app`}
              ></span>
            </button>,
            this.menubarElement.domElement as HTMLElement
          );

          this.compositionEditExitButton = createElement(
            'button',
            {
              class: `${navBarButton} hidden ml-auto`,
            },
            this.menubarElement.domElement,
            'Exit Edit composition'
          );

          this.historyModeExitButton = createElement(
            'button',
            {
              class: `${navBarButton} hidden ml-auto`,
            },
            this.menubarElement.domElement,
            'Exit history mode'
          );

          (
            this.historyModeExitButton?.domElement as HTMLElement
          ).addEventListener('click', this.exitHistoryMode);

          this.selectedNodeLabel = createElement(
            'div',
            {
              id: 'selectedNode',
              class: 'text-white',
            },
            this.menubarElement.domElement
          );

          registerCommands<GLNodeInfo>({
            rootElement: this.rootElement,
            getCanvasApp: () => this.currentCanvasApp,
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
            this.updateToolbarTaskList?.();

            (this.pathRange?.domElement as HTMLElement).setAttribute(
              'value',
              '0'
            );
            (this.pathRange?.domElement as HTMLElement).setAttribute(
              'max',
              '0'
            );
            (this.pathRange?.domElement as unknown as HTMLInputElement).value =
              '0';
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
        const nodesList = this.serializeFlow();
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
        this.storageProvider.saveFlow('gl', flow).then(() => {
          if (this.canvasAction === CanvasAction.newConnectionCreated) {
            if (
              this.canvasActionPayload &&
              this.canvasActionPayload.nodeComponent &&
              this.canvasActionPayload.nodeComponent.nodeType ===
                NodeType.Connection
            ) {
              setActionNode({
                id: (
                  this.canvasActionPayload
                    .nodeComponent as unknown as INodeComponent<GLNodeInfo>
                ).id,
                containerNode: (
                  this.canvasActionPayload
                    .nodeComponent as unknown as INodeComponent<BaseNodeInfo>
                ).containerNode,
              });
            }
          }
          this.canvasAction = CanvasAction.idle;
          this.canvasActionPayload = undefined;
        });
      }
    };

    const setIsStoring = (isStoring: boolean) => {
      this.isStoring = isStoring;
    };

    this.canvasApp.setOnCanvasClick(() => {
      console.log('OnCanvasClick');
      setSelectNode(undefined);
    });

    this.menubarContainerElement = createElement(
      'div',
      {
        class: menubarClasses,
      },
      this.rootElement
    );

    this.menubarElement = createElement(
      'div',
      {
        class: menubarContainerClasses,
      },
      this.menubarContainerElement?.domElement
    );

    renderElement(
      <Toolbar<GLNodeInfo>
        getTaskList={getGLTaskList}
        getUpdateToolbarTaskList={(updateToolbarTaskList) => {
          this.updateToolbarTaskList = updateToolbarTaskList;
        }}
        addNodeType={(nodeType: string) => {
          executeCommand(this.commandRegistry, 'add-node', nodeType);
        }}
        replaceNode={(
          nodeType: string,
          node: IRectNodeComponent<GLNodeInfo>
        ) => {
          executeCommand(this.commandRegistry, 'replace-node', nodeType, node);
        }}
        canvasAppInstance={this.canvasApp}
        getCanvasAction={() => this.canvasAction}
        getNode={(
          nodeId: string,
          containerNode?: IRectNodeComponent<GLNodeInfo> | undefined
        ) => {
          const node = (
            containerNode
              ? (containerNode.nodeInfo as any)?.canvasAppInstance?.elements
              : this.currentCanvasApp?.elements
          )?.get(nodeId);
          return { node };
        }}
      />,
      this.rootElement
    );

    const bgRange = createElement(
      'div',
      {
        class:
          'p-2 absolute bottom-[0px] w-full h-[50px] bg-slate-200 items-center z-[1050] flex', //flex',
        name: 'path-track-bg',
      },
      this.rootElement,
      ''
    );

    this.pathRange = createElement(
      'input',
      {
        type: 'range',
        class: 'p-2 m-2 relative w-full',
        name: 'path-track',
        min: '0',
        max: '100000',
        step: '1',
        //disabled: 'disabled',
        value: 1,
        input: (event) => {
          const value = parseInt((event.target as HTMLInputElement).value);
          if (!isNaN(value)) {
            this.showShaderHistoryItem(value);
          }
        },
      },
      bgRange?.domElement,
      ''
    );

    const labelPathRange = createElement(
      'label',
      {
        class: ' whitespace-nowrap text-black p-2',
        for: this.pathRange?.id ?? '',
      },
      bgRange?.domElement,
      'Create Flow History'
    );
    if (this.pathRange && labelPathRange) {
      this.pathRange.domElement.before(labelPathRange.domElement);
    }
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
        category = optgroup?.domElement as HTMLElement;
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
      this.menubarElement?.domElement,
      ''
    );

    const setupTasksForContainerTaskInDropdown = (
      allowedNodeTasks: string[],
      notAllowedChildNodeTasks: string[]
    ) => {
      if (this.selectNodeType?.domElement) {
        (this.selectNodeType?.domElement as HTMLSelectElement).innerHTML = '';

        createOptionGLGroups(
          this.selectNodeType?.domElement as HTMLSelectElement
        );
        const nodeTasks = getGLNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getGLNodeTaskFactory(nodeTask);
          let categoryName = 'Default';
          if (factory) {
            const node = factory(canvasUpdated);
            if (
              allowedNodeTasks.length > 0 &&
              allowedNodeTasks.indexOf(node.name) < 0
            ) {
              return;
            }
            if (notAllowedChildNodeTasks.indexOf(node.name) >= 0) {
              return;
            }

            categoryName = node.category || 'uncategorized';
          }
          const label = glNodeTaskRegistryLabels[nodeTask] || nodeTask;
          createOption(
            this.selectNodeType?.domElement as HTMLSelectElement,
            nodeTask,
            label,
            categoryName
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
      let nodeType = '';
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
        const node = (
          selectedNodeInfo?.containerNode
            ? (selectedNodeInfo?.containerNode?.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.currentCanvasApp?.elements
        )?.get(selectedNodeInfo.id);

        if (!node) {
          return;
        }

        nodeType = node.nodeInfo?.type;
        console.log('selected node', node);

        if (node.nodeInfo?.isComposition) {
          this.selectedNodeLabel.domElement.textContent = 'composition';
          (
            this.compositionEditButton?.domElement as HTMLButtonElement
          ).classList.remove('hidden');
        } else {
          this.selectedNodeLabel.domElement.textContent = nodeType || 'NODE'; //`${selectedNodeInfo.id}`;
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
          if ((nodeTask.childNodeTasks || []).length >= 0) {
            setupTasksForContainerTaskInDropdown(
              nodeTask.childNodeTasks ?? [],
              nodeTask.notAllowedChildNodeTasks ?? []
            );
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
          rootElement: this.formElement?.domElement as HTMLElement,
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

  onAddGLComposition = (
    composition: Composition<GLNodeInfo>,
    connections: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<GLNodeInfo>;
    }[]
  ) => {
    return this.onAddComposition(
      composition,
      connections,
      registerComposition,
      getGLNodeTaskFactory,
      setupGLTasksInDropdown,
      this.selectNodeType?.domElement as HTMLSelectElement
    );
  };

  editGLComposition = () => {
    if (this.canvasUpdated) {
      this.editComposition(
        getGLNodeTaskFactory,
        this.canvasUpdated,
        setupGLTasksInDropdown,
        this.selectNodeType?.domElement as HTMLSelectElement
      );
    }
  };

  onEditComposition() {
    super.onEditComposition();

    removeClasses(this.menubarContainerElement, ['bg-slate-700']);
    addClasses(this.menubarContainerElement, ['bg-sky-500']);

    this.glNavbarComponent?.onEditComposition();
    addClasses(this.clearCanvasButton, ['hidden']);
    addClasses(this.resetStateButton, ['hidden']);
    addClassesHTMLElement(this.exportExternalButton, ['hidden']);
  }

  onExitEditComposition() {
    super.onExitEditComposition();

    removeClasses(this.menubarContainerElement, ['bg-sky-500']);
    addClasses(this.menubarContainerElement, ['bg-slate-700']);

    this.glNavbarComponent?.onExitEditComposition();
    removeClasses(this.clearCanvasButton, ['hidden']);
    removeClasses(this.resetStateButton, ['hidden']);

    removeClassesHTMLElement(this.exportExternalButton, ['hidden']);
  }

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
    this.wheel = 1.0;
    this.positionX = 0;
    this.positionY = 0;
    this.shaderCompileHistory = [];
    this.currentShaderIndex = -1;

    (this.pathRange?.domElement as HTMLElement).setAttribute('value', '0');
    (this.pathRange?.domElement as HTMLElement).setAttribute('max', '0');
    (this.pathRange?.domElement as unknown as HTMLInputElement).value = '0';
    removeAllCompositions();
    this.updateToolbarTaskList?.();
  };
  onPostclearCanvas = () => {
    setupGLTasksInDropdown(
      this.selectNodeType?.domElement as HTMLSelectElement
    );
  };

  setCameraTargetOnNode = (node: IRectNodeComponent<GLNodeInfo>) => {
    setTargetCameraAnimation(node.x, node.y, node.id, 1.0, true);
  };

  updateGLCanvasParameters = (
    storeCompiledResultInHistory = true,
    shaderSource?: string
  ) => {
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
      this.u_MouseXUniformLocation = null;
      this.u_MouseYUniformLocation = null;
      this.u_wheelUniformLocation = null;

      this.u_PositionXUniformLocation = null;
      this.u_PositionYUniformLocation = null;

      this.setupShader(this.gl, storeCompiledResultInHistory, shaderSource);
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

  u_MouseXUniformLocation: WebGLUniformLocation | null = null;
  u_MouseYUniformLocation: WebGLUniformLocation | null = null;
  u_wheelUniformLocation: WebGLUniformLocation | null = null;
  u_PositionXUniformLocation: WebGLUniformLocation | null = null;
  u_PositionYUniformLocation: WebGLUniformLocation | null = null;

  vertexPositionAttribute = 0;

  valueParameterUniforms: {
    uniform?: WebGLUniformLocation | null;
    id: string;
    uniformName: string;
    value: number;
    node: IRectNodeComponent<GLNodeInfo>;
  }[] = [];

  shaderExtensions = '';
  createFragmentShader = (statements: string, prestatements: string) => {
    let shaderDynamicUniforms = '';
    this.valueParameterUniforms.forEach((uniform) => {
      shaderDynamicUniforms += `uniform ${floatType} ${uniform.uniformName.replaceAll(
        '-',
        ''
      )};\n`;
    });

    return `#version 300 es
    precision highp float;
    uniform ${floatType} u_time;
    uniform ${floatType} u_width;
    uniform ${floatType} u_height;
    uniform ${floatType} u_test;
    uniform ${floatType} u_mouseX;
    uniform ${floatType} u_mouseY;
    uniform ${floatType} u_wheel;
    uniform ${floatType} u_positionX;
    uniform ${floatType} u_positionY;

    ${shaderDynamicUniforms}

   
    
    #define PI = 3.1415926535897932384626433832795;
    ${floatType} metaball(${vec2Type} p, ${vec2Type} center, ${floatType} radius) {
      ${floatType} r = radius * radius;
      ${floatType} d = length(p - center);
      return r / (d * d);
    }

    ${this.shaderExtensions}	
    ${prestatements}

    out vec4 fragColor;
    void main() {
     
      ${floatType} aspect = u_width/u_height;
      ${vec2Type} resolution = ${vec2Type}(u_width, u_height);
      ${vec2Type} uv = (gl_FragCoord.xy / resolution.xy);      
      uv = uv * 2.0 - 1.0;
      uv.x *= aspect;

      ${vec3Type} backgroundColor = ${vec3Type}(0.0, 0.0, 0.0);
      ${vec3Type} finalColor = ${vec3Type}(0.0);
      ${vec3Type} totalcolinf = ${vec3Type}(0.00);
      ${floatType} totalInfluence = 0.0;

      ${statements}

      ${floatType} threshold = 1.5;
      ${floatType} threshold2 = 13.5;
      if (totalInfluence > threshold) {
        ${vec3Type} color = (totalcolinf) / totalInfluence;
          if (totalInfluence < threshold2) {
            color = mix(backgroundColor, color, (totalInfluence - threshold) / (threshold2 - threshold));
          }
          fragColor = ${vec4Type}(color, 1.0);
      } else {
        fragColor = ${vec4Type}(backgroundColor, 1.0);
      }          
    }
    `;
  };

  vsSource = `#version 300 es
      in ${vec4Type} aVertexPosition;
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

  shaderSource = '';
  setupShader = (
    gl: WebGLRenderingContext,
    storeCompiledResultInHistory = true,
    shaderSource?: string
  ) => {
    const fsSource =
      shaderSource ??
      this.createFragmentShader(
        `
      ${this.shaderStatements}
    `,
        this.shaderNodePreStatements
      );
    console.log('fsSource', fsSource);
    this.initShaderProgram(gl, this.vsSource, fsSource);
    this.shaderSource = fsSource;

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

    this.u_MouseXUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_mouseX'
    );
    this.u_MouseYUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_mouseY'
    );
    this.u_wheelUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_wheel'
    );
    this.u_PositionXUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_positionX'
    );
    this.u_PositionYUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_positionY'
    );

    this.vertexPositionAttribute = gl.getAttribLocation(
      this.shaderProgram,
      'aVertexPosition'
    );

    this.valueParameterUniforms.forEach((uniform) => {
      if (this.shaderProgram) {
        uniform.uniform = gl.getUniformLocation(
          this.shaderProgram,
          uniform.uniformName.replaceAll('-', '')
        );
      }
    });
    if (
      storeCompiledResultInHistory &&
      this.canvasApp &&
      this.canvasApp.elements.size > 0
    ) {
      this.addCompiledShaderToHistory = true;
    }
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
      if ((result as any).hasPreStatement) {
        this.shaderNodePreStatements += (result as any).preoutput;
      } else {
        this.shaderNodePreoutput += (result as any).preoutput;
      }
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
  shaderNodePreStatements = '';

  parseFLow = (
    elementMap: ElementNodeMap<GLNodeInfo>,
    nodeVisited: string[],
    glslFunctions: Record<string, string>
  ) => {
    let sdfIndex = 1;
    const visitedNodes: string[] = [];

    elementMap.forEach((node: IElementNode<GLNodeInfo>) => {
      if (node && node.nodeInfo && node.nodeInfo.initializeOnCompile) {
        node.nodeInfo?.initializeCompute?.();
      }
    });

    elementMap.forEach((element) => {
      const node = element as unknown as INodeComponent<GLNodeInfo>;
      if (node.nodeType === NodeType.Shape) {
        if (node?.nodeInfo?.type === 'value-node') {
          this.valueParameterUniforms.push({
            uniform: undefined,
            id: node.id,
            uniformName: `value_${node.id}`,
            value: 0,
            node: node as unknown as IRectNodeComponent<GLNodeInfo>,
          });
        }
        if (node?.nodeInfo?.type && glslFunctions[node?.nodeInfo?.type]) {
          if (nodeVisited.indexOf(node?.nodeInfo?.type ?? '') < 0) {
            nodeVisited.push(node?.nodeInfo?.type ?? '');
            const glslFunction = glslFunctions[node?.nodeInfo?.type];
            this.shaderExtensions += glslFunction;
          }
        }
        if (
          node.nodeInfo?.type === 'define-vec2-variable-node' ||
          node.nodeInfo?.type === 'define-color-variable-node' ||
          node.nodeInfo?.type === 'define-float-variable-node'
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

    const nodes = getSortedNodes(
      Array.from(elementMap).map(
        ([_key, value]) => value as INodeComponent<GLNodeInfo>
      )
    );
    console.log('sorted nodes', nodes);
    nodes.forEach((element) => {
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
            node.nodeInfo?.type === 'set-variable-node' ||
            node.nodeInfo?.type === 'set-and-add-color-variable-node' ||
            (node.nodeInfo?.isComposition &&
              (
                (node as IRectNodeComponent<GLNodeInfo>).connections || []
              ).filter((c) => c.startNode?.id === node.id).length === 0)
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
              this.shaderNodePreoutput + (result?.result ?? '');

            sdfIndex++;
          } else if (
            node.nodeInfo?.type === 'circle-node' ||
            node.nodeInfo?.type === 'output-color-node' ||
            node.nodeInfo?.type === 'break-node'
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
              this.shaderNodePreoutput + (result?.result ?? '');

            sdfIndex++;
          } else {
            if (
              node.nodeInfo?.type === 'for-node' ||
              node.nodeInfo?.type === 'gate-node'
            ) {
              if (
                node.nodeInfo
                  ?.canvasAppInstance as unknown as IFlowCanvasBase<GLNodeInfo>
              ) {
                const containerNodeVisited: string[] = [];
                const containerGslFunctions = getGLSLFunctions();

                // TODO: this should return a string of code
                //
                //  (call getInputsForNode)
                //
                //  ... and add it as a child of forNode.compute ....
                //   .. the container should use the variables from its root parent
                //   .. the container should use getGLSLFunctions from the root parent

                const current = this.shaderStatements;

                const inputs = this.getInputsForNode(
                  node as IRectNodeComponent<GLNodeInfo>
                );
                this.shaderStatements = '';

                this.parseFLow(
                  (
                    node.nodeInfo
                      ?.canvasAppInstance as unknown as IFlowCanvasBase<GLNodeInfo>
                  ).elements,
                  containerNodeVisited,
                  containerGslFunctions
                );

                console.log('for-node block', this.shaderStatements);

                const result = node.nodeInfo?.compute?.(
                  0,
                  sdfIndex,
                  {
                    ...inputs,
                    block: this.shaderStatements,
                  } as any,
                  undefined
                );

                this.shaderStatements = `${current}${result?.result ?? ''}`;
              }
            }
          }
        }
      }
    });
  };

  flowTOGLCanvas = () => {
    try {
      this.valueParameterUniforms.forEach((uniform) => {
        if (this.shaderProgram) {
          uniform.uniform = null;
        }
      });
      this.valueParameterUniforms = [];
      console.log('flowTOGLCanvas');

      this.shaderStatements = '';
      this.shaderExtensions = '';
      this.shaderNodePreStatements = '';
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

        this.parseFLow(this.canvasApp.elements, nodeVisited, glslFunctions);

        this.updateGLCanvasParameters();
      }
    } catch (error) {
      console.log('error in compiling to GLSL', error);
    }
  };

  pauseRender = false;
  positionBuffer: WebGLBuffer | null = null;
  isWheelEventSet = false;
  setupGLCanvas = () => {
    this.glcanvas = document.getElementById('glcanvas') as HTMLCanvasElement;
    this.isWheelEventSet = true;

    this.canvasSize = this.glcanvas.getBoundingClientRect();
    this.glcanvas.width = this.canvasSize.width;
    this.glcanvas.height = this.canvasSize.height;
    this.valueParameterUniforms = [];
    const gl = this.glcanvas.getContext('webgl2');
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

    if (this.addCompiledShaderToHistory) {
      const nodesList = this.serializeFlow();
      if (!nodesList) {
        return;
      }
      console.log(
        'this.shaderCompileHistory.push',
        this.shaderCompileHistory.length + 1
      );
      this.shaderCompileHistory.push({
        type: 'shader',
        shaderCode: this.shaderSource,
        nodes: nodesList,
        valueParameterUniforms: this.valueParameterUniforms.map((item) => {
          return { ...item, value: item.node.nodeInfo?.formValues.value };
        }),
      });

      (this.pathRange?.domElement as HTMLElement).setAttribute('value', '0');
      (this.pathRange?.domElement as HTMLElement).setAttribute(
        'max',
        (this.shaderCompileHistory.length - 1).toString()
      );
      (this.pathRange?.domElement as unknown as HTMLInputElement).value = (
        this.shaderCompileHistory.length - 1
      ).toString();

      this.addCompiledShaderToHistory = false;
    }
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
    gl.uniform1f(this.u_MouseXUniformLocation, this.mouseX);
    gl.uniform1f(this.u_MouseYUniformLocation, -this.mouseY);
    gl.uniform1f(this.u_wheelUniformLocation, this.wheel);
    gl.uniform1f(this.u_PositionXUniformLocation, -this.positionX);
    gl.uniform1f(this.u_PositionYUniformLocation, this.positionY);

    this.valueParameterUniforms.forEach((uniform) => {
      if (uniform.uniform) {
        gl.uniform1f(
          uniform.uniform,
          parseFloat(uniform.node.nodeInfo?.formValues.value ?? '0')
        );
      }
    });

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

  historyCanvasApp: IFlowCanvasBase<GLNodeInfo> | undefined;
  currentShaderIndex = -1;
  showShaderHistoryItem = (historyIndex: number) => {
    console.log('showShaderHistoryItem', historyIndex);
    if (historyIndex < 0) {
      return;
    }
    if (historyIndex >= this.shaderCompileHistory.length) {
      return;
    }
    if (this.menubarContainerElement) {
      const menuItems = (
        this.menubarContainerElement.domElement as unknown as HTMLElement
      ).querySelectorAll<HTMLElement>('select,button,input');
      menuItems.forEach((menuItem) => {
        hideHTMLElement(menuItem);
      });
    }

    showElement(this.historyModeExitButton);
    hideElement(this.selectedNodeLabel);

    const historyItem = this.shaderCompileHistory[historyIndex];
    if (
      historyItem.type === 'value' &&
      historyItem.valueParameterUniform &&
      historyItem.value !== undefined &&
      historyItem.valueParameterUniform.node?.nodeInfo?.formValues
    ) {
      /*

        - walk back in the history until a shader is found

        - check1: is the historyCanvas not created? create it and render canvas with the above shader
        - else check2: is the historyCanvas already created and does the current rendered step equal the found step above?          
          - if not:
            - update the historyCanvas and render canvas with the above shader
      

        - update all uniforms in between
        - update all the values in the slider as well

        #history-canvas [data-node-id=".."] .node-content input[type="range"].slider
        */
      let shaderIndex = historyIndex;
      let shader: ShaderCompileHistory | undefined = undefined;
      while (shaderIndex >= 0 && !shader) {
        const item = this.shaderCompileHistory[shaderIndex];
        if (item.type === 'shader') {
          shader = item;
        } else {
          shaderIndex--;
        }
      }
      if (!shader) {
        return;
      }
      if (!this.historyCanvasApp) {
        this.renderFlowNodesFromHistory(shader);
      } else if (
        this.currentShaderIndex === -1 ||
        this.currentShaderIndex !== shaderIndex
      ) {
        this.renderFlowNodesFromHistory(shader);
      }
      this.currentShaderIndex = shaderIndex;

      this.updateGLCanvasParameters(false, historyItem.shaderCode);

      // loop from shaderIndex to historyIndex
      let loop = shaderIndex;
      while (loop < historyIndex) {
        const item = this.shaderCompileHistory[loop];
        if (
          item?.value !== undefined &&
          item?.valueParameterUniform?.node?.nodeInfo?.formValues
        ) {
          item.valueParameterUniform.node.nodeInfo.formValues.value =
            item.value.toString();

          const sliderElement = document.querySelector<HTMLInputElement>(
            `#history-canvas [data-node-id="${historyItem.valueParameterUniform.id}"] .node-content input[type="range"].slider`
          );
          if (sliderElement) {
            sliderElement.value = item.value.toString();
          }
        }
        loop++;
      }

      historyItem.valueParameterUniform.node.nodeInfo.formValues.value =
        historyItem.value.toString();

      const sliderElement = document.querySelector<HTMLInputElement>(
        `#history-canvas [data-node-id="${historyItem.valueParameterUniform.id}"] .node-content input[type="range"].slider`
      );
      if (sliderElement) {
        sliderElement.value = historyItem.value.toString();
      }
    } else if (
      historyItem.type === 'shader' &&
      historyItem.shaderCode &&
      this.gl
    ) {
      /*
        render historyItem.nodes on dummy canvas without interaction:
        - disable current canvas
        - show exit "timeline mode"
        - hide all menu buttons
        - create dummy canvas if it doesnt exist .. otherwise use current
        - copy camera settings

        - render nodes
        - reset uniform values for current shader

        when exit "timeline mode":
        - hide exit button
        - remove dummy canvas
        - enable current canvas
        - show all menu buttons


        TODO : store a copy of the unifor values for this shader-source and
             use them
      */
      if (!this.rootElement) {
        return;
      }

      this.updateGLCanvasParameters(false, historyItem.shaderCode);
      (historyItem.valueParameterUniforms ?? []).forEach((uniform) => {
        if (
          uniform?.node?.nodeInfo?.formValues &&
          (uniform?.value || uniform?.value === 0)
        ) {
          uniform.node.nodeInfo.formValues.value = uniform.value.toString();
        }
      });

      this.renderFlowNodesFromHistory(historyItem);
    }
  };

  renderFlowNodesFromHistory = (historyItem: ShaderCompileHistory) => {
    if (!this.rootElement) {
      return;
    }
    if (!this.historyCanvasApp) {
      this.currentCanvasApp?.setDisableInteraction(true);

      hideElement(this.canvas);

      (this.canvas?.domElement as HTMLElement).classList.add(
        'pointer-events-none'
      );
      this.currentCanvasApp?.setIsCameraFollowingPaused(true);

      this.historyCanvasApp = createFlowCanvas<GLNodeInfo>(
        this.rootElement,
        undefined,
        undefined,
        undefined,
        'history-canvas',
        undefined,
        (): Promise<string | false> => Promise.resolve(false)
      );
      const camera = this.canvasApp?.getCamera();
      this.historyCanvasApp.setCamera(
        camera?.x ?? 0,
        camera?.y ?? 0,
        camera?.scale ?? 1
      );
      this.currentCanvasApp = this.historyCanvasApp;
      this.currentCanvasApp?.setDisableInteraction(true);
    }
    this.historyCanvasApp.elements.forEach((element) => {
      element.domElement.remove();
      this.removeElement(element);
    });

    this.historyCanvasApp.elements.clear();
    importToCanvas(
      historyItem.nodes ?? [],
      this.historyCanvasApp as unknown as IFlowCanvasBase<GLNodeInfo>,
      () => {
        //
      },
      undefined,
      0,
      getGLNodeTaskFactory
    );
  };

  exitHistoryMode = () => {
    this.currentShaderIndex = -1;
    if (this.menubarContainerElement) {
      const menuItems = (
        this.menubarContainerElement.domElement as unknown as HTMLElement
      ).querySelectorAll<HTMLElement>('select,button,input');
      menuItems.forEach((menuItem) => {
        showHTMLElement(menuItem);
      });
    }
    hideElement(this.compositionEditExitButton);
    hideElement(this.compositionEditButton);
    hideElement(this.compositionNameButton);
    hideElement(this.historyModeExitButton);
    showElement(this.selectedNodeLabel);

    if (this.historyCanvasApp) {
      this.historyCanvasApp.elements.forEach((element) => {
        element.domElement.remove();
        this.removeElement(element);
      });
      this.historyCanvasApp.elements.clear();
      this.historyCanvasApp.canvas.domElement.remove();
      this.historyCanvasApp = undefined;

      showElement(this.canvas);
      this.currentCanvasApp = this.canvasApp;
      this.currentCanvasApp?.setIsCameraFollowingPaused(false);
      this.currentCanvasApp?.setDisableInteraction(false);
      (this.canvas?.domElement as HTMLElement).classList.remove(
        'pointer-events-none'
      );
    }
  };

  updateUniformValue = (id: string, value: string) => {
    console.log('updateUniformValue', id, value);
    const uniform = this.valueParameterUniforms.find((u) => u.id === id);
    if (uniform && this.pathRange) {
      const historyItem: ShaderCompileHistory = {
        type: 'value',
        value: parseFloat(value),
        valueParameterUniform: uniform,
        valueUniformName: id,
      };
      this.shaderCompileHistory.push(historyItem);
      (this.pathRange.domElement as HTMLInputElement).setAttribute(
        'max',
        (this.shaderCompileHistory.length - 1).toString()
      );
      (this.pathRange?.domElement as unknown as HTMLInputElement).value = (
        this.shaderCompileHistory.length - 1
      ).toString();
    }
  };

  serializeFlow = (): SerializedFlow | false => {
    if (!this.canvasApp) {
      return false;
    }
    return serializeElementsMap(this.canvasApp.elements);
  };

  updateSceneParamsInNodes = () => {
    const positionNodes = document.querySelectorAll(
      '[data-node-type="position-node"] .node-content'
    );
    positionNodes.forEach((node) => {
      node.innerHTML = `Scene position<br />${this.positionX.toFixed(
        2
      )} ${this.positionY.toFixed(2)}`;
    });
    const zoomNodes = document.querySelectorAll(
      '[data-node-type="wheel-node"] .node-content'
    );
    zoomNodes.forEach((node) => {
      node.innerHTML = `Scene zoom ${this.wheel.toFixed(5)}`;
    });
  };
}
