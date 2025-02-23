import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
//import iconStyles from '../../public/icon-styles.css?inline';
import {
  createElement,
  IElementNode,
  INodeComponent,
  createEffect,
  getSelectedNode,
  setSelectNode,
  setActionNode,
  IRectNodeComponent,
  IThumbNodeComponent,
  Flow,
  updateNamedSignal,
  NodeType,
  SelectedNodeInfo,
  FlowNode,
  IDOMElement,
  IConnectionNodeComponent,
  Composition,
  standardTheme,
  renderElement,
  createJSXElement,
  CanvasAction,
  IRunCounter,
  FormComponent,
  OnNextNodeFunction,
  importCompositions,
  importToCanvas,
  BaseNodeInfo,
  IFormsComponent,
  FlowChangeType,
  IFlowCanvasBase,
  Theme,
  IThumb,
  GetNodeTaskFactory,
} from '@devhelpr/visual-programming-system';

import {
  compileExpressionAsInfo,
  registerCustomFunction,
  runExpression,
} from '@devhelpr/expression-compiler';

import {
  setSpeedMeter,
  animatePath as _animatePath,
  animatePathFromThumb as _animatePathFromThumb,
  setCameraAnimation,
  setTargetCameraAnimation,
  setPositionTargetCameraAnimation,
  setOnFrame,
  animatePathForNodeConnectionPairs,
  setStopAnimations,
  getIsStopAnimations,
} from './follow-path/animate-path';
import { getFollowNodeExecution } from './follow-path/followNodeExecution';
import { createIndexedDBStorageProvider } from './storage/indexeddb-storage-provider';
import { getPointOnConnection } from './follow-path/point-on-connection';
import { AppComponents } from './components/app-components';
import {
  NavbarComponent,
  NavbarComponents,
} from './components/navbar-components';
import {
  menubarClasses,
  navBarButton,
  navBarIconButtonInnerElement,
  navBarPrimaryIconButton,
  navBarOutlineButton,
  menubarContainerClasses,
  navBarPrimaryButton,
} from './consts/classes';

import {
  serializeCompositions,
  serializeElementsMap,
} from './storage/serialize-canvas';
import {
  NodeSidebarMenuComponent,
  NodeSidebarMenuComponents,
} from './components/node-sidebar-menu';
import { AppElement } from './app.element';
import {
  executeCommand,
  registerCommands,
} from './command-handlers/register-commands';
import {
  createOptionGroups,
  getTaskList,
  setupTasksInDropdown,
} from './node-task-registry/setup-select-node-types-dropdown';
import { createOption } from './node-task-registry/createOption';
import {
  addClasses,
  addClassesHTMLElement,
  removeClasses,
  removeClassesHTMLElement,
} from './utils/add-remove-classes';
import { createMediaLibrary, MediaLibrary } from '@devhelpr/media-library';
import { TestComponent } from './components/test-component';
import { Toolbar } from './components/toolbar';
import { StorageProvider } from './storage/StorageProvider';
import {
  NodeInfo,
  RegisterNodeFactoryFunction,
  RunCounter,
  canvasNodeTaskRegistryLabels,
  connectionExecuteHistory,
  getNodeFactoryNames,
  getNodeTaskFactory,
  getVariablePayloadInputUtils,
  increaseRunIndex,
  initFlowVariableScope,
  registerComposition,
  registerCompositionNodes,
  removeAllCompositions,
  resetRunIndex,
  run,
  runNode,
  runNodeFromThumb,
  runPath,
  runPathForNodeConnectionPairs,
  runPathFromThumb,
  setRunCounterUpdateElement,
  setupCanvasNodeTaskRegistry,
} from '@devhelpr/web-flow-executor';
import { PasteNodeCommand } from './command-handlers/paste-node-command/paste-node-command';
import { clearOCIF, getCurrentOCIF, setOCIF } from './importers/ocif-importer';

export type CreateRunCounterContext = (
  isRunViaRunButton: boolean,
  shouldResetConnectionSlider: boolean,
  onFlowFinished?: () => void
) => RunCounter;

export class CodeFlowWebAppCanvas {
  appRootSelector?: string;
  storageProvider?: StorageProvider<NodeInfo>;
  isReadOnly?: boolean;
  heightSpaceForHeaderFooterToolbars?: number;
  widthSpaceForSideToobars?: number;
  flowId?: string;
  clearPresetRegistry?: boolean;
  flowApp?: FlowAppElement;
  updateTheme() {
    //
  }
  onStoreFlow?: (
    flow: Flow<NodeInfo>,
    canvasApp: IFlowCanvasBase<BaseNodeInfo>,
    getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
  ) => void;
  registerExternalNodes?: (
    registerNodeFactory: RegisterNodeFactoryFunction,
    createRunCounterContext: CreateRunCounterContext
  ) => void;
  theme?: Theme;
  render() {
    if (!this.appRootSelector) {
      throw new Error('appRootSelector is required');
    }
    this.flowApp = new FlowAppElement(
      this.appRootSelector,
      this.storageProvider,
      this.isReadOnly,
      this.heightSpaceForHeaderFooterToolbars,
      this.widthSpaceForSideToobars,
      this.onStoreFlow,
      this.registerExternalNodes,
      this.flowId,
      this.clearPresetRegistry,
      undefined,
      undefined,
      this.theme
    );
  }
}

export class FlowAppElement extends AppElement<NodeInfo> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  navbarComponent: NavbarComponent | undefined = undefined;
  scopeNodeDomElement: HTMLElement | undefined = undefined;

  formElement: IDOMElement | undefined = undefined;
  selectedNodeLabel: IDOMElement | undefined = undefined;

  testCircle: IDOMElement | undefined = undefined;
  message: IDOMElement | undefined = undefined;
  messageText: IDOMElement | undefined = undefined;
  focusedNode: IRectNodeComponent<NodeInfo> | undefined = undefined;
  runButton: IDOMElement | undefined = undefined;
  pathRange: IDOMElement | undefined = undefined;
  speedMeterElement: IDOMElement | undefined = undefined;
  selectNodeType: IDOMElement | undefined = undefined;
  mediaLibary: MediaLibrary | undefined = undefined;
  nodeSidebarMenu: NodeSidebarMenuComponent | undefined = undefined;
  canvasUpdated:
    | ((
        shouldClearExecutionHistory?: boolean,
        isStoreOnly?: boolean,
        flowChangeType?: FlowChangeType,
        node?: IRectNodeComponent<NodeInfo>
      ) => void)
    | undefined = undefined;

  exportCodeButton: HTMLElement | undefined = undefined;
  canvasAction: CanvasAction = CanvasAction.idle;
  canvasActionPayload: any = undefined;
  cancelCameraAnimation: (() => void) | undefined = undefined;
  updateToolbarTaskList: (() => void) | undefined = undefined;
  hideFlowPresets = false;
  initializeNodes: (() => void) | undefined = undefined;
  flowId = '1234';

  onStoreFlow?: (
    flow: Flow<NodeInfo>,
    canvasApp: IFlowCanvasBase<BaseNodeInfo>,
    getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
  ) => void;

  createThumbNode = (_thumb: IThumb): false => {
    return false;
  };

  initAPIKey = () => {
    if (!this.canvasApp) {
      return;
    }
    const openAIKey = sessionStorage.getItem('openai-key');
    const googleGeminiAIKey = sessionStorage.getItem('googleGeminiAI-key');
    if (openAIKey) {
      this.canvasApp.setTempData('openai-key', openAIKey);
    }
    if (googleGeminiAIKey) {
      this.canvasApp.setTempData('googleGeminiAI-key', googleGeminiAIKey);
    }
  };

  constructor(
    appRootSelector: string,
    storageProvider?: StorageProvider<NodeInfo>,
    isReadOnly?: boolean,
    heightSpaceForHeaderFooterToolbars?: number,
    widthSpaceForSideToobars?: number,
    onStoreFlow?: (
      flow: Flow<NodeInfo>,
      canvasApp: IFlowCanvasBase<BaseNodeInfo>,
      getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
    ) => void,
    registerExternalNodes?: (
      registerNodeFactory: RegisterNodeFactoryFunction,
      createRunCounterContext: CreateRunCounterContext
    ) => void,
    flowId?: string,
    clearPresetRegistry?: boolean,
    apiUrlRoot?: string,
    hideFlowPresets?: boolean,
    theme?: Theme
  ) {
    super(
      appRootSelector,
      undefined,
      theme ?? standardTheme,
      storageProvider,
      isReadOnly,
      heightSpaceForHeaderFooterToolbars,
      widthSpaceForSideToobars,
      getNodeTaskFactory,
      {
        hasNodeTypeSideBar: true,
        nodeTypeSideBarSelector: '.taskbar-container',
      }
    );
    if (!this.rootElement) {
      return;
    }
    if (!this.canvasApp) {
      return;
    }
    if (flowId) {
      this.flowId = flowId;
    }
    this.hideFlowPresets = hideFlowPresets ?? false;
    this.onStoreFlow = onStoreFlow;
    this.canvasApp.setApiUrlRoot(apiUrlRoot ?? '');
    this.canvasApp.setCanvasAction((action, payload?: any) => {
      this.canvasAction = action;
      this.canvasActionPayload = payload;
    });

    // const debugInfoController = new DebugInfoController(this.rootElement);

    // this.canvasApp.setOnDebugInfoHandler((debugInfo) => {
    //   debugInfoController.sendDebugInfo(debugInfo);
    // });

    let intervalCancel: any = undefined;
    let intervalPreview: any = undefined;

    this.initAPIKey();

    this.canvasApp.setOnDraggingOverNode((node, draggedNode, isCancelling) => {
      const connection = draggedNode as IConnectionNodeComponent<NodeInfo>;
      if (connection.startNodeThumb) {
        console.log('draggedNode', draggedNode, isCancelling);
        const text = node.nodeInfo?.formValues?.annotation;
        if (
          text &&
          node &&
          node.nodeInfo?.type === 'annotation' &&
          connection &&
          connection.nodeType === NodeType.Connection &&
          connection.endNode &&
          connection.startNodeThumb &&
          this.canvasApp
        ) {
          const endNode = connection.endNode;

          if (isCancelling) {
            clearTimeout(intervalCancel);
            clearTimeout(intervalPreview);
            intervalPreview = undefined;
            console.log('CANCEL Preview!', getIsStopAnimations());
            resetRunIndex();
            (this.runButton?.domElement as HTMLButtonElement).disabled = false;
            setStopAnimations();
            // Wait until isStopAnimations is set to false
            intervalCancel = setInterval(() => {
              if (!getIsStopAnimations()) {
                clearInterval(intervalCancel);
                if (
                  endNode.nodeInfo?.supportsPreview &&
                  endNode.nodeInfo?.cancelPreview
                ) {
                  endNode.nodeInfo?.cancelPreview();
                }
              }
            }, 0);
          } else if (
            endNode.nodeInfo?.supportsPreview &&
            endNode.nodeInfo?.compute
          ) {
            clearTimeout(intervalPreview);

            console.log('TRIGGER Preview!', getIsStopAnimations());
            resetRunIndex();
            (this.runButton?.domElement as HTMLButtonElement).disabled = false;
            setStopAnimations();
            // Wait until isStopAnimations is set to false
            intervalPreview = setInterval(() => {
              if (!getIsStopAnimations()) {
                clearInterval(intervalPreview);
                if (endNode.nodeInfo?.compute) {
                  endNode.nodeInfo?.compute(
                    this.transformValueForNodeTrigger(text),
                    -1,
                    {
                      showPreview: true,
                    },
                    undefined,
                    undefined,
                    this.createRunCounterContext(false, false),
                    connection
                  );
                }
              }
            }, 0);
          }
        }
      }

      return false;
    });

    this.canvasApp.setOnDroppedOnNode((node, droppedNode) => {
      const connection = droppedNode as IConnectionNodeComponent<NodeInfo>;
      if (connection.startNodeThumb) {
        const text = node.nodeInfo?.formValues?.annotation;
        if (
          text &&
          node &&
          node.nodeInfo?.type === 'annotation' &&
          connection &&
          connection.nodeType === NodeType.Connection &&
          connection.endNode &&
          connection.startNodeThumb &&
          this.canvasApp
        ) {
          // Copy & paste clipboard to connection and trigger connection

          const canvasApp = this.canvasApp;
          const endNode = connection.endNode;
          const startNodeThumb = connection.startNodeThumb;

          let interval: any = undefined;
          clearTimeout(interval);
          console.log('TRIGGER FLOW!', getIsStopAnimations());
          resetRunIndex();
          (this.runButton?.domElement as HTMLButtonElement).disabled = false;
          setStopAnimations();
          // Wait until isStopAnimations is set to false
          interval = setInterval(() => {
            if (!getIsStopAnimations()) {
              clearInterval(interval);
              clearInterval(intervalPreview);
              intervalPreview = undefined;
              if (
                endNode.nodeInfo?.supportsPreview &&
                endNode.nodeInfo?.cancelPreview
              ) {
                endNode.nodeInfo?.cancelPreview();
              }
              runNodeFromThumb(
                startNodeThumb,
                canvasApp,
                () => {
                  //
                },
                this.transformValueForNodeTrigger(text),
                endNode,
                undefined,
                undefined,
                this.createRunCounterContext(false, false)
              );
            }
          }, 0);
        }
      }
    });

    this.canvasApp.setOnAddcomposition(this.onAddFlowComposition);
    this.mediaLibary = createMediaLibrary();
    this.canvasApp.setMediaLibrary(this.mediaLibary);

    const animatePath = (
      node: IRectNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: OnNextNodeFunction<NodeInfo>,
      onStopped?: (input: string | any[]) => void,
      input?: string | any[],
      followPathByName?: string, // normal, success, failure, "subflow",
      animatedNodes?: {
        node1?: IDOMElement;
        node2?: IDOMElement;
        node3?: IDOMElement;
      },
      offsetX?: number,
      offsetY?: number,
      followPathToEndThumb?: boolean,
      singleStep?: boolean,
      followThumb?: string,
      scopeId?: string,
      runCounter?: IRunCounter
    ) => {
      if (!this.currentCanvasApp) {
        throw new Error('canvasApp not defined');
      }
      return _animatePath(
        this.currentCanvasApp,
        node,
        color,
        onNextNode,
        onStopped,
        input,
        followPathByName,
        animatedNodes,
        offsetX,
        offsetY,
        followPathToEndThumb,
        singleStep,
        followThumb,
        scopeId,
        runCounter
      );
    };

    const animatePathFromThumb = (
      node: IThumbNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: OnNextNodeFunction<NodeInfo>,
      onStopped?: (input: string | any[], scopeId?: string) => void,
      input?: string | any[],
      followPathByName?: string, // normal, success, failure, "subflow",
      animatedNodes?: {
        node1?: IDOMElement;
        node2?: IDOMElement;
        node3?: IDOMElement;
      },
      offsetX?: number,
      offsetY?: number,
      followPathToEndThumb?: boolean,
      singleStep?: boolean,
      scopeId?: string,
      runCounter?: IRunCounter
    ) => {
      if (!this.currentCanvasApp) {
        throw new Error('canvasApp not defined');
      }
      return _animatePathFromThumb(
        this.currentCanvasApp,
        node,
        color,
        onNextNode,
        onStopped,
        input,
        followPathByName,
        animatedNodes,
        offsetX,
        offsetY,
        followPathToEndThumb,
        singleStep,
        scopeId,
        runCounter
      );
    };

    const runFlowPath = (
      node: IRectNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: OnNextNodeFunction<NodeInfo>,
      onStopped?: (input: string | any[]) => void,
      input?: string | any[],
      followPathByName?: string, // normal, success, failure, "subflow",
      animatedNodes?: {
        node1?: IDOMElement;
        node2?: IDOMElement;
        node3?: IDOMElement;
      },
      offsetX?: number,
      offsetY?: number,
      followPathToEndThumb?: boolean,
      singleStep?: boolean,
      followThumb?: string,
      scopeId?: string,
      runCounter?: IRunCounter
    ) => {
      if (!this.currentCanvasApp) {
        throw new Error('canvasApp not defined');
      }
      return runPath(
        this.currentCanvasApp,
        node,
        color,
        onNextNode,
        onStopped,
        input,
        followPathByName,
        animatedNodes,
        offsetX,
        offsetY,
        followPathToEndThumb,
        singleStep,
        followThumb,
        scopeId,
        runCounter
      );
    };
    const runPathFromThumbFlow = (
      node: IThumbNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: OnNextNodeFunction<NodeInfo>,
      onStopped?: (input: string | any[], scopeId?: string) => void,
      input?: string | any[],
      followPathByName?: string,
      animatedNodes?: {
        node1?: IDOMElement;
        node2?: IDOMElement;
        node3?: IDOMElement;
        cursorOnly?: boolean;
      },
      offsetX?: number,
      offsetY?: number,
      followPathToEndThumb?: boolean,
      singleStep?: boolean,
      scopeId?: string,
      runCounter?: IRunCounter
    ) => {
      if (!this.currentCanvasApp) {
        throw new Error('canvasApp not defined');
      }
      return runPathFromThumb(
        this.currentCanvasApp,
        node,
        color,
        onNextNode,
        onStopped,
        input,
        followPathByName,
        animatedNodes,
        offsetX,
        offsetY,
        followPathToEndThumb,
        singleStep,
        scopeId,
        runCounter
      );
    };
    this.canvasApp.setAnimationFunctions({
      animatePathFunction: animatePath,
      animatePathFromThumbFunction: animatePathFromThumb,
      animatePathFromConnectionPairFunction: animatePathForNodeConnectionPairs,
    });

    const canvasUpdated = (
      shouldClearExecutionHistory = false,
      _isStoreOnly?: boolean,
      flowChangeType: FlowChangeType = FlowChangeType.Unknown,
      node?: INodeComponent<NodeInfo>
    ) => {
      if (
        this.currentCanvasApp?.isContextOnly ||
        this.currentCanvasApp?.isComposition
      ) {
        return;
      }
      console.log('canvasUpdated', shouldClearExecutionHistory, flowChangeType);
      if (this.isStoring) {
        return;
      }
      if (shouldClearExecutionHistory) {
        this.resetConnectionSlider(shouldClearExecutionHistory);
      }
      if (
        //flowChangeType === FlowChangeType.AddNode ||
        flowChangeType === FlowChangeType.UpdateNode ||
        flowChangeType === FlowChangeType.AddConnection ||
        flowChangeType === FlowChangeType.UpdateConnection ||
        flowChangeType === FlowChangeType.TriggerNode
      ) {
        let interval: any = undefined;
        clearTimeout(interval);
        console.log('TRIGGER RUN!', getIsStopAnimations());
        resetRunIndex();
        (this.runButton?.domElement as HTMLButtonElement).disabled = false;
        setStopAnimations();
        // Wait until isStopAnimations is set to false
        interval = setInterval(() => {
          if (!getIsStopAnimations()) {
            clearInterval(interval);
            if (flowChangeType === FlowChangeType.TriggerNode) {
              if (node && this.canvasApp) {
                runNode(
                  node as IRectNodeComponent<NodeInfo>,
                  this.canvasApp,
                  (_input: string | any[]) => {
                    //
                  },
                  undefined,
                  0,
                  0,
                  undefined,
                  undefined,
                  undefined,
                  this.createRunCounterContext(false, false),
                  false,
                  {
                    triggerNode: true,
                  }
                );
              }
            } else {
              this.run();
            }
          }
        }, 0);
      }
      store();

      console.log('canvasUpdated before setTabOrderOfNodes');
      this.setTabOrderOfNodes();
    };
    this.canvasUpdated = canvasUpdated;
    this.canvasApp.setOnCanvasUpdated(
      (
        shouldClearExecutionHistory?: boolean,
        isStoreOnly?: boolean,
        flowChangeType?: FlowChangeType,
        node?: INodeComponent<NodeInfo>
      ) => {
        canvasUpdated(
          shouldClearExecutionHistory,
          isStoreOnly,
          flowChangeType,
          node
        );
      }
    );

    this.cancelCameraAnimation = setCameraAnimation(this.canvasApp);

    setupCanvasNodeTaskRegistry(
      this.createRunCounterContext,
      registerExternalNodes,
      clearPresetRegistry
    );

    const storageProviderPromise = this.storageProvider
      ? Promise.resolve(this.storageProvider)
      : createIndexedDBStorageProvider<NodeInfo>();
    storageProviderPromise
      .then((storageProvider) => {
        console.log('storageProvider', storageProvider);
        this.isStoring = true;
        this.storageProvider = storageProvider;

        this.initializeCommandHandlers();

        if (this.storageProvider && this.canvasApp && this.rootElement) {
          this.navbarComponent = NavbarComponents({
            isReadOnly: isReadOnly,
            getNodeFactory: getNodeTaskFactory,
            clearCanvas: this.clearCanvas,
            initializeNodes: initializeNodes,
            storageProvider: this.storageProvider,
            selectNodeType: this.selectNodeType
              ?.domElement as HTMLSelectElement,
            animatePath: animatePath,
            animatePathFromThumb: animatePathFromThumb,
            canvasUpdated: canvasUpdated,
            getCanvasApp: () => this.currentCanvasApp,
            removeElement: this.removeElement,
            rootElement: menubarElement!.domElement as HTMLElement,
            rootAppElement: this.rootElement as HTMLElement,
            setIsStoring: setIsStoring,
            showPopup: this.positionPopup,
            hideFlowPresets: this.hideFlowPresets,
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
              nodesList: FlowNode<NodeInfo>[],
              canvasApp: IFlowCanvasBase<NodeInfo>,
              canvasUpdated: () => void,
              containerNode?: IRectNodeComponent<NodeInfo>,
              nestedLevel?: number,
              getNodeTaskFactory?: (name: string) => any,
              compositions: Record<string, Composition<NodeInfo>> = {}
            ) => {
              this.isStoring = true;
              removeAllCompositions();
              importCompositions<NodeInfo>(compositions, canvasApp);
              registerCompositionNodes(
                this.canvasApp?.compositons?.getAllCompositions() ?? {}
              );
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel,
                getNodeTaskFactory,
                this.onImported
              );
              this.isStoring = false;
              setupTasksInDropdown(
                this.selectNodeType?.domElement as HTMLSelectElement
              );
              this.updateToolbarTaskList?.();
              canvasUpdated();
              this.initAPIKey();
            },
          });
          if (!isReadOnly) {
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
              menubarElement!.domElement,
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
                    setStopAnimations();
                    this.clearCanvas();
                    store();
                  }
                  return false;
                },
              },
              menubarElement!.domElement,
              'Clear canvas'
            );

            this.compositionEditButton = createElement(
              'button',
              {
                class: `${navBarPrimaryButton} hidden`,
                click: (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  this.editFlowComposition();
                  return false;
                },
              },
              menubarElement!.domElement,
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
              menubarElement!.domElement,
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
              menubarElement!.domElement,
              'Create composition'
            );

            // renderElement(
            //   <button
            //     class={`${navBarIconButton}`}
            //     title="Export to external (work in progress - currently to tldraw)"
            //     click={() => {
            //       if (!this.canvasApp) {
            //         return;
            //       }
            //       exportTldraw(
            //         {
            //           canvasApp: this.canvasApp,
            //           downloadFile,
            //         },
            //         getNodeTaskFactory
            //       );
            //     }}
            //     getElement={(element: HTMLElement) => {
            //       this.exportCodeButton = element;
            //     }}
            //   >
            //     <span
            //       class={`${navBarIconButtonInnerElement} icon-file_downloadget_app`}
            //     ></span>
            //   </button>,
            //   menubarElement!.domElement as HTMLElement
            // );

            // renderElement(
            //   <button
            //     class={`${navBarIconButton}`}
            //     title="Sync from external (work in progress - currently to tldraw)"
            //     click={() => {
            //       createUploadJSONFileInput()
            //         .then((data) => {
            //           if (!this.canvasApp) {
            //             return;
            //           }
            //           if (data) {
            //             console.log('data', data);
            //             syncFromTldraw(data, {
            //               canvasApp: this.canvasApp,
            //               downloadFile,
            //             });
            //           }
            //           //alert('File imported');
            //         })
            //         .catch(() => {
            //           // alert('Cancel or error importing file');
            //         });
            //     }}
            //     getElement={(_element: HTMLElement) => {
            //       //this.syncWithExternalButton = element;
            //     }}
            //   >
            //     <span
            //       class={`${navBarIconButtonInnerElement} icon-file_upload`}
            //     ></span>
            //   </button>,
            //   menubarElement!.domElement as HTMLElement
            // );
            this.compositionEditExitButton = createElement(
              'button',
              {
                class: `${navBarButton} ml-auto hidden`,
              },
              menubarElement!.domElement,
              'Exit Edit composition'
            );
          }
          this.selectedNodeLabel = createElement(
            'div',
            {
              id: 'selectedNode',
              class: 'text-white',
            },
            menubarElement!.domElement
          );

          if (!isReadOnly) {
            this.nodeSidebarMenu = NodeSidebarMenuComponents({
              clearCanvas: this.clearCanvas,
              getNodeFactory: getNodeTaskFactory,
              initializeNodes: initializeNodes,
              storageProvider: this.storageProvider,
              selectNodeType: this.selectNodeType
                ?.domElement as HTMLSelectElement,
              animatePath: animatePath,
              animatePathFromThumb: animatePathFromThumb,
              canvasUpdated: canvasUpdated,
              getCanvasApp: () => this.currentCanvasApp,
              removeElement: this.removeElement,
              rootElement: this.rootElement as HTMLElement,
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
              showPopup: (node: IRectNodeComponent<NodeInfo>) => {
                if (node.nodeInfo?.isSettingsPopup) {
                  const selectedNodeInfo = getSelectedNode();
                  if (selectedNodeInfo) {
                    this.showFormPopup(node, selectedNodeInfo);
                  }
                  return;
                }
                if (!node.nodeInfo?.showFormOnlyInPopup) {
                  return;
                }

                this.popupNode = node;

                if (this.currentCanvasApp) {
                  this.focusedNode = node;
                  this.popupNode = this.focusedNode;
                  this.currentCanvasApp.selectNode(this.focusedNode);
                }

                this.positionPopup(
                  this.focusedNode as IRectNodeComponent<NodeInfo>
                );
                const inputInPopup = document.querySelector(
                  '#textAreaContainer input, #textAreaContainer textarea, #textAreaContainer select'
                );
                if (inputInPopup) {
                  (inputInPopup as HTMLInputElement).focus();
                }

                this.focusedNode = node;
              },
              importToCanvas: (
                nodesList: FlowNode<NodeInfo>[],
                canvasApp: IFlowCanvasBase<NodeInfo>,
                canvasUpdated: () => void,
                containerNode?: IRectNodeComponent<NodeInfo>,
                nestedLevel?: number,
                getNodeTaskFactory?: (name: string) => any,
                compositions: Record<string, Composition<NodeInfo>> = {}
              ) => {
                this.isStoring = true;
                removeAllCompositions();
                importCompositions<NodeInfo>(compositions, canvasApp);
                registerCompositionNodes(
                  this.canvasApp?.compositons?.getAllCompositions() ?? {}
                );
                importToCanvas(
                  nodesList,
                  canvasApp,
                  canvasUpdated,
                  containerNode,
                  nestedLevel,
                  getNodeTaskFactory,
                  this.onImported
                );
                this.updateToolbarTaskList?.();
                this.isStoring = false;
                canvasUpdated();
                this.initAPIKey();
              },
            });

            registerCommands<NodeInfo>({
              rootElement: this.rootElement,
              getCanvasApp: () => this.currentCanvasApp,
              canvasUpdated: canvasUpdated,
              removeElement: this.removeElement,
              getNodeTaskFactory,
              commandRegistry: this.commandRegistry,
              setupTasksInDropdown,
              onBeforeExecuteCommand: this.onBeforeExecuteCommand,
            });
            this.clearCanvas();
          }
        }

        setOnFrame((_elapsed) => {
          if (connectionExecuteHistory.length > 0) {
            const value = parseInt(
              (this.pathRange?.domElement as HTMLInputElement).value
            );
            if (!isNaN(value)) {
              updateMessageBubble(value);
            }
          }
        });
        storageProvider
          .getFlow(this.flowId)
          .then((flow) => {
            if (!this.canvasApp) {
              throw new Error('canvasApp not defined');
            }
            clearOCIF();
            if (flow.ocif) {
              setOCIF(flow.ocif);
            }
            removeAllCompositions();
            importCompositions<NodeInfo>(flow.compositions, this.canvasApp);
            registerCompositionNodes(
              this.canvasApp.compositons.getAllCompositions()
            );
            importToCanvas(
              flow.flows.flow.nodes,
              this.canvasApp,
              canvasUpdated,
              undefined,
              0,
              getNodeTaskFactory,
              this.onImported
            );
            this.canvasApp.centerCamera();
            initializeNodes();
            this.setTabOrderOfNodes();
            setupTasksInDropdown(
              this.selectNodeType?.domElement as HTMLSelectElement
            );
            this.updateToolbarTaskList?.();
            if (this.onStoreFlow) {
              this.onStoreFlow(flow, this.canvasApp, getNodeTaskFactory);
            }
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

        // TODO : store ocif here as well.. if it's available
        const flow: Flow<NodeInfo> = {
          schemaType: 'flow',
          schemaVersion: '0.0.1',
          id: this.flowId,
          ocif: getCurrentOCIF(),
          flows: {
            flow: {
              flowType: 'flow',
              nodes: nodesList,
            },
          },
          compositions: compositions,
        };
        if (this.onStoreFlow && this.canvasApp) {
          this.onStoreFlow(flow, this.canvasApp, getNodeTaskFactory);
        }
        this.storageProvider.saveFlow(this.flowId, flow).then(() => {
          if (this.canvasAction === CanvasAction.newConnectionCreated) {
            if (
              this.canvasActionPayload &&
              this.canvasActionPayload.nodeComponent &&
              this.canvasActionPayload.nodeComponent.nodeType ===
                NodeType.Connection
            ) {
              if (!this.canvasActionPayload.nodeComponent.endNode) {
                setActionNode({
                  id: (
                    this.canvasActionPayload
                      .nodeComponent as unknown as INodeComponent<NodeInfo>
                  ).id,
                  containerNode: (
                    this.canvasActionPayload
                      .nodeComponent as unknown as INodeComponent<BaseNodeInfo>
                  ).containerNode,
                });
              }
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

    const menubarElement = createElement(
      'div',
      {
        class: menubarContainerClasses,
      },
      this.menubarContainerElement!.domElement
    );

    const initializeNodes = () => {
      if (!this.rootElement) {
        return;
      }
      const elements = this.rootElement.querySelectorAll('.state-active');
      elements.forEach((element) => {
        element.classList.remove('state-active');
      });

      this.currentCanvasApp?.elements.forEach((node) => {
        const nodeComponent = node as unknown as INodeComponent<NodeInfo>;
        if (nodeComponent.nodeType !== NodeType.Connection) {
          if (nodeComponent?.nodeInfo?.initializeCompute) {
            nodeComponent.nodeInfo.initializeCompute();
          }
        }
      });

      initFlowVariableScope();

      resetRunIndex();
      (this.runButton?.domElement as HTMLButtonElement).disabled = false;
      this.resetConnectionSlider();

      let hasUIElements = (this.currentCanvasApp?.elements?.size ?? 0) > 0;
      this.currentCanvasApp?.elements.forEach((node) => {
        if (node.nodeInfo?.isUINode) {
          hasUIElements = true;
        }
      });
      if (hasUIElements) {
        this.runFlow();
      }
    };
    this.initializeNodes = initializeNodes;

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
      return serializeCompositions<NodeInfo>(
        this.canvasApp.compositons.getAllCompositions()
      );
    };

    this.runCounterElement = createElement(
      'div',
      {
        class:
          'absolute z-[10000] top-[60px] right-[4px] text-white px-2 py-1 m-2 mr-0 bg-slate-700 rounded-md',
      },
      this.rootElement,
      ''
    ) as unknown as IDOMElement;
    this.runButton = createElement(
      'button',
      {
        class: `${navBarPrimaryIconButton}`,
        title: 'Run | Ctrl + Enter',
        name: 'run-flow',
        click: (event) => {
          event.preventDefault();
          this.runFlow();
          return false;
        },
      },
      menubarElement?.domElement
    );
    createElement(
      'span',
      {
        class: `${navBarIconButtonInnerElement} icon-play_arrow`,
      },
      this.runButton?.domElement
    );

    createElement(
      'span',
      {
        class: `ml-2 text-white`,
      },
      menubarElement?.domElement,
      'Run speed'
    );

    let speedMeter = 375;
    this.speedMeterElement = createElement(
      'input',
      {
        type: 'range',
        class: 'p-2 m-2 relative ', //top-[60px]',
        name: 'speed',
        title: 'Flow run speed (max = realtime)',
        min: '1',
        max: '750',
        value: '375',
        change: (event) => {
          speedMeter = parseInt((event.target as HTMLInputElement).value);
          setSpeedMeter(speedMeter);

          if (!this.canvasApp) {
            return;
          }
          if (speedMeter === 750) {
            this.canvasApp.setAnimationFunctions({
              animatePathFunction: runFlowPath,
              animatePathFromThumbFunction: runPathFromThumbFlow,
              animatePathFromConnectionPairFunction:
                runPathForNodeConnectionPairs,
            });
          } else {
            this.canvasApp.setAnimationFunctions({
              animatePathFunction: animatePath,
              animatePathFromThumbFunction: animatePathFromThumb,
              animatePathFromConnectionPairFunction:
                animatePathForNodeConnectionPairs,
            });
          }
        },
      },
      menubarElement?.domElement,
      ''
    );

    speedMeter = parseInt(
      (this.speedMeterElement!.domElement as HTMLInputElement).value
    );
    setSpeedMeter(speedMeter);

    if (!isReadOnly) {
      renderElement(
        <Toolbar<NodeInfo>
          getTaskList={getTaskList}
          getUpdateToolbarTaskList={(updateToolbarTaskList) => {
            this.updateToolbarTaskList = updateToolbarTaskList;
          }}
          addNodeType={(nodeType: string) => {
            executeCommand(this.commandRegistry, 'add-node', nodeType);
          }}
          replaceNode={(
            nodeType: string,
            node: IRectNodeComponent<NodeInfo>
          ) => {
            executeCommand(
              this.commandRegistry,
              'replace-node',
              nodeType,
              node
            );
          }}
          getCanvasAction={() => this.canvasAction}
          canvasAppInstance={this.canvasApp}
          getNode={(
            nodeId: string,
            containerNode?: IRectNodeComponent<NodeInfo> | undefined
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

      // this.selectNodeType = createElement(
      //   'select',
      //   {
      //     type: 'select',
      //     class: 'p-2 m-2 relative max-w-[220px]', //top-[60px]',
      //     name: 'select-node-type',
      //     change: (_event) => {
      //       //
      //     },
      //   },
      //   menubarElement?.domElement,
      //   ''
      // );
    }
    const setupTasksForContainerTaskInDropdown = (
      allowedNodeTasks: string[]
    ) => {
      if (this.selectNodeType?.domElement) {
        (this.selectNodeType?.domElement as HTMLSelectElement).innerHTML = '';
        createOptionGroups(
          this.selectNodeType?.domElement as HTMLSelectElement
        );

        const nodeTasks = getNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getNodeTaskFactory(nodeTask);
          let categoryName = 'Default';
          if (factory) {
            const node = factory(canvasUpdated);
            if (allowedNodeTasks.indexOf(node.name) < 0) {
              return;
            }
            categoryName = node.category || 'uncategorized';
          }
          const label = canvasNodeTaskRegistryLabels[nodeTask] || nodeTask;
          createOption(
            this.selectNodeType?.domElement as HTMLSelectElement,
            nodeTask,
            label,
            categoryName
          );
        });
      }
    };
    setupTasksInDropdown(this.selectNodeType?.domElement as HTMLSelectElement);

    this.testCircle = createElement(
      'div',
      {
        class: `absolute bg-blue-500 top-0 left-0 z-[2000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded hidden`,
        style: {
          'clip-path': 'circle(50%)',
        },
      },
      this.canvasApp?.canvas.domElement,
      ''
    );

    // eslint-disable-next-line prefer-const
    this.message = createElement(
      'div',
      {
        class: `flex text-center truncate-message min-w-0 overflow-hidden z-[2000] pointer-events-auto origin-center px-1 bg-blue-500 text-black absolute top-[-100px] z-[2000] left-[-60px] items-center justify-center w-[80px] h-[100px] overflow-hidden hidden`,
        style: {
          'clip-path':
            'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
        },
      },
      this.canvasApp?.canvas.domElement,
      ''
    );

    this.messageText = createElement(
      'div',
      {
        class: `truncate-message min-w-0 overflow-hidden w-[80px] mt-[-30px]`,
      },
      this.message?.domElement,
      ''
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

    renderElement(<TestComponent />, this.rootElement);

    const getSliderNodeByPosition = (sliderValue: number) => {
      const max = connectionExecuteHistory.length * 1000;
      const stepSize = max / connectionExecuteHistory.length;
      const step = Math.floor(sliderValue / stepSize);

      if (step >= connectionExecuteHistory.length) {
        return false;
      }
      const pathStep = connectionExecuteHistory[step];
      if (!pathStep.connection.startNode || !pathStep.connection.endNode) {
        return false;
      }
      return { step, pathStep, stepSize };
    };

    const updateMessageBubble = (sliderValue: number) => {
      const result = getSliderNodeByPosition(sliderValue);
      if (result === false) {
        return;
      }
      const step = result.step;
      const stepSize = result.stepSize;
      const pathStep = result.pathStep;
      const node = pathStep.connection.startNode;
      if (
        node &&
        pathStep.connection.endNode &&
        sliderValue % stepSize !== 0 &&
        step < connectionExecuteHistory.length
      ) {
        const pointValue = sliderValue - step * stepSize;
        const percentage = pointValue / stepSize;
        const bezierCurvePoints = getPointOnConnection<NodeInfo>(
          percentage,
          pathStep.connection,
          node,
          pathStep.connection.endNode,
          true
        );

        let parentX = 0;
        let parentY = 0;
        if (
          pathStep.connection.containerNode &&
          pathStep.connection.containerNode.getParentedCoordinates
        ) {
          const parentCoordinates =
            pathStep.connection.containerNode.getParentedCoordinates() ?? {
              x: 0,
              y: 0,
            };
          parentX = parentCoordinates.x;
          parentY = parentCoordinates.y;
        }

        const domCircle = this.testCircle?.domElement as HTMLElement;
        const domMessage = this.message?.domElement as HTMLElement;
        domCircle.style.transform = `translate(${
          bezierCurvePoints.x + parentX
        }px, ${bezierCurvePoints.y + parentY}px)`;
        domMessage.style.transform = `translate(${
          bezierCurvePoints.x + parentX
        }px, ${bezierCurvePoints.y + parentY}px)`;
      }
    };

    const showProgressOnPathExecution = (sliderValue: number) => {
      document.body.classList.add('connection-history--sliding');
      if (this.scopeNodeDomElement) {
        this.scopeNodeDomElement.classList.remove('bg-blue-300');
        this.scopeNodeDomElement = undefined;
      }

      const result = getSliderNodeByPosition(sliderValue);
      if (result === false) {
        return;
      }
      document
        .querySelectorAll('.connection-history__node--active')
        .forEach((element) => {
          element.classList.remove('connection-history__node--active');
        });
      const step = result.step;
      const stepSize = result.stepSize;
      const pathStep = result.pathStep;

      const node = pathStep.connection.startNode;
      this.canvasApp?.setNodeStates(pathStep.nodeStates);

      if (node && node.domElement) {
        const pointValue = sliderValue - step * stepSize;
        const percentage = pointValue / stepSize;

        if (percentage < 0.25) {
          if (pathStep.connection.startNode) {
            (
              pathStep.connection.startNode?.domElement as HTMLElement
            ).classList.add('connection-history__node--active');
          }
        }
        if (percentage > 0.75) {
          if (pathStep.connection.endNode) {
            (
              pathStep.connection.endNode?.domElement as HTMLElement
            ).classList.add('connection-history__node--active');
          }

          if (
            pathStep.connection.endNode &&
            pathStep.connection.endNode.nodeInfo?.updateVisual
          ) {
            const nodeState = pathStep.nodeStates.get(
              pathStep.connection.endNode.id
            );
            pathStep.connection.endNode.nodeInfo?.updateVisual(
              pathStep.connectionValue,
              nodeState
            );
          } else {
            if (pathStep.nextNodeStates) {
              this.canvasApp?.setNodeStates(pathStep.nextNodeStates);
            }
          }
        }

        if (
          sliderValue % stepSize !== 0 &&
          step < connectionExecuteHistory.length
        ) {
          if (pathStep.cursorOnly === true) {
            (this.message?.domElement as HTMLElement).classList.remove('flex');
            (this.message?.domElement as HTMLElement).classList.add('hidden');
          } else {
            (this.message?.domElement as HTMLElement).classList.remove(
              'hidden'
            );
          }

          (this.testCircle?.domElement as HTMLElement).classList.remove(
            'hidden'
          );
          if (pathStep.connection.endNode && pathStep.connection) {
            // also see updateMessageBubble : that's where the bubble are updated via requestAnimationFrame

            const bezierCurvePoints = getPointOnConnection<NodeInfo>(
              percentage,
              pathStep.connection,
              node,
              pathStep.connection.endNode,
              true
            );

            let parentX = 0;
            let parentY = 0;
            if (
              pathStep.connection.containerNode &&
              pathStep.connection.containerNode.getParentedCoordinates
            ) {
              const parentCoordinates =
                pathStep.connection.containerNode.getParentedCoordinates() ?? {
                  x: 0,
                  y: 0,
                };
              parentX = parentCoordinates.x;
              parentY = parentCoordinates.y;
            }
            const domCircle = this.testCircle?.domElement as HTMLElement;
            const domMessage = this.message?.domElement as HTMLElement;
            const domMessageText = this.messageText?.domElement as HTMLElement;
            const xHelper = bezierCurvePoints.x + parentX;
            const yHelper = bezierCurvePoints.y + parentY;
            domCircle.style.display = 'flex';

            domCircle.style.transform = `translate(${xHelper}px, ${yHelper}px)`;
            if (pathStep.cursorOnly === true) {
              domMessage.style.display = 'none';
            } else {
              domMessage.style.display = 'flex';
            }
            domMessage.style.transform = `translate(${
              bezierCurvePoints.x + parentX
            }px, ${bezierCurvePoints.y + parentY}px)`;
            if (
              pathStep.connectionValue &&
              typeof pathStep.connectionValue === 'object'
            ) {
              const content = JSON.stringify(pathStep.connectionValue, null, 1)
                .replaceAll('{\n', '')
                .replaceAll(',\n', '\n')
                .replaceAll('}', '')
                .replaceAll('"', '')
                .replace(/^ +/gm, '');
              domMessageText.textContent = content;
              domMessage.title = content;
            } else {
              domMessageText.textContent = pathStep.connectionValue.toString();
              domMessage.title = pathStep.connectionValue.toString();
            }
          }
        }
      }
    };

    this.pathRange = createElement(
      'input',
      {
        type: 'range',
        class: 'p-2 m-2 relative w-full',
        name: 'path-track',
        min: '0',
        max: '100000',
        disabled: 'disabled',
        value: 1,
        input: (event) => {
          const value = parseInt((event.target as HTMLInputElement).value);
          if (!isNaN(value)) {
            showProgressOnPathExecution(value);
          }
        },
      },
      bgRange?.domElement,
      ''
    );
    (this.pathRange?.domElement as HTMLElement).setAttribute(
      'id',
      this.pathRange!.id
    );
    const labelPathRange = createElement(
      'label',
      {
        class: ' whitespace-nowrap text-black p-2',
        for: this.pathRange!.id,
      },
      bgRange?.domElement,
      'Timeline'
    );
    this.pathRange?.domElement.before(labelPathRange!.domElement);

    AppComponents({
      rootElement: this.rootElement,
    }) as unknown as HTMLElement;

    let currentSelectedNode: SelectedNodeInfo | undefined = undefined;

    // const removeFormElement = () => {
    //   if (this.formElement) {
    //     this.canvasApp?.deleteElementFromNode(
    //       this.editPopupContainer as INodeComponent<NodeInfo>,
    //       this.formElement,
    //       true
    //     );
    //     this.formElement = undefined;
    //   }
    //   (
    //     this.editPopupContainer?.domElement as unknown as HTMLElement
    //   ).classList.add('hidden');
    //   (
    //     this.editPopupLineContainer?.domElement as unknown as HTMLElement
    //   ).classList.add('hidden');

    //   (
    //     this.editPopupEditingNodeIndicator?.domElement as unknown as HTMLElement
    //   ).classList.add('hidden');

    //   (
    //     this.editPopupEditingNodeIndicator?.domElement as unknown as HTMLElement
    //   ).classList.remove('editing-node-indicator');
    // };

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
            ? (currentSelectedNode?.containerNode.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.currentCanvasApp?.elements
        )?.get(currentSelectedNode.id);
        if (node) {
          if (node.nodeType === NodeType.Connection) {
            node.connectorWrapper?.classList?.remove('selected');
          } else {
            node.domElement.classList.remove('selected');
          }
        }
      }
      if (isReadOnly) {
        return;
      }

      this.removeFormElement();
      if (selectedNodeInfo && this.selectedNodeLabel) {
        const node = (
          selectedNodeInfo?.containerNode
            ? (selectedNodeInfo?.containerNode.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.currentCanvasApp?.elements
        )?.get(selectedNodeInfo.id);

        if (!node) {
          return;
        }
        nodeType = node.nodeInfo?.type;
        //this.selectedNodeLabel.domElement.textContent = 'NODE'; //`${selectedNodeInfo.id}`;
        this.selectedNodeLabel.domElement.textContent = nodeType || 'NODE';

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
          if (getFollowNodeExecution()) {
            setTargetCameraAnimation(node.x, node.y, node.id, 1.0);
          }
        }
        let formElements: any[] = [];
        let formElementsViaConnection = false;
        const nodeInfo: any = node?.nodeInfo ?? {};
        if (
          node &&
          (node as INodeComponent<NodeInfo>).nodeType === NodeType.Connection
        ) {
          if (
            (node?.startNode?.nodeInfo as BaseNodeInfo)?.outputConnectionInfo
          ) {
            const outputConnectionInfo = (
              node?.startNode?.nodeInfo as BaseNodeInfo
            ).outputConnectionInfo;
            if (outputConnectionInfo?.form) {
              formElements = outputConnectionInfo.form.map((orgFormElement) => {
                const formElement = { ...orgFormElement };
                formElement.value =
                  node.nodeInfo?.formValues?.[formElement.fieldName] ?? 0;
                formElement.onChange = (
                  value: string,
                  _formComponent: IFormsComponent
                ) => {
                  if (!node.nodeInfo) {
                    node.nodeInfo = {
                      formValues: {},
                    };
                  }
                  const floatValue = parseFloat(value);
                  node.nodeInfo.formValues = {
                    ...node.nodeInfo.formValues,
                    [formElement.fieldName]: floatValue,
                  };
                  console.log('onChange', node.nodeInfo);
                  const element = document.querySelector(
                    `[id="${node.id}_connection-value-label"]`
                  );
                  if (element) {
                    element.textContent = floatValue.toFixed(2);
                  }
                  if (outputConnectionInfo.onChanged) {
                    outputConnectionInfo.onChanged(node);
                  }
                  if (this.canvasUpdated) {
                    this.canvasUpdated();
                  }
                };
                return formElement;
              });
              formElementsViaConnection = true;
            }
          } else {
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
        } else {
          formElements = (nodeInfo as any)?.formElements ?? [];
        }

        console.log('nodeInfo', nodeInfo);

        const factory = getNodeTaskFactory(nodeInfo.type);
        if (factory) {
          const nodeTask = factory(() => undefined);
          if ((nodeTask.childNodeTasks || []).length > 0) {
            setupTasksForContainerTaskInDropdown(nodeTask.childNodeTasks ?? []);
          } else {
            setupTasksInDropdown(
              this.selectNodeType?.domElement as HTMLSelectElement
            );
          }
        }

        if (
          node.nodeInfo.hasNoFormPopup ||
          getFollowNodeExecution() ||
          (formElements.length <= 1 &&
            !(
              (nodeInfo.showFormOnlyInPopup || formElementsViaConnection) &&
              formElements.length >= 1
            )) ||
          nodeInfo.isSettingsPopup
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

        this.showFormPopup(node, selectedNodeInfo, formElements);
        currentSelectedNode = undefined;
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

        setupTasksInDropdown(
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

    registerCustomFunction('pow', [], (a = 0, b = 0) => {
      return Math.pow(a, b);
    });

    registerCustomFunction('max', [], (a = 0, b = 0) => {
      return Math.max(a, b);
    });

    registerCustomFunction('min', [], (a = 0, b = 0) => {
      return Math.min(a, b);
    });

    registerCustomFunction('parseFloat', [], (a = 0) => {
      return parseFloat(a) || 0;
    });

    registerCustomFunction('isEmptyString', [], (a = '') => {
      return typeof a === 'string' && a === '';
    });
    registerCustomFunction('isEmptyText', [], (a = '') => {
      return typeof a === 'string' && a === '';
    });

    registerCustomFunction('hasText', [], (a = '') => {
      return typeof a === 'string' && a !== '' && a !== undefined && a !== null;
    });

    registerCustomFunction('distance', [], (a, b) => {
      if (
        Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === 2 &&
        b.length === 2
      ) {
        return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
      }
      return 0;
    });

    registerCustomFunction('normalize', [], (a) => {
      if (Array.isArray(a) && a.length > 0) {
        const vectorLength = Math.sqrt(
          a.reduce((acc, value) => acc + Math.pow(value, 2), 0)
        );
        return a.map((value) => value / vectorLength);
      }
      throw new Error('Invalid vector');
    });

    this.canvasApp?.setOnWheelEvent((x, y, scale) => {
      setPositionTargetCameraAnimation(x, y, scale);
    });

    this.canvasApp?.setonDragCanvasEvent((x, y) => {
      setPositionTargetCameraAnimation(x, y);
    });
  }

  public override destroy() {
    this.cancelCameraAnimation?.();
    super.destroy();
  }

  showFormPopup = (
    node: IRectNodeComponent<NodeInfo>,
    selectedNodeInfo: SelectedNodeInfo,
    formElements?: any[]
  ) => {
    if (this.formElement) {
      this.formElement.domElement.remove();
    }

    if (node.nodeInfo?.getSettingsPopup) {
      const element = node.nodeInfo.getSettingsPopup(
        this.editPopupContainer?.domElement as HTMLElement
      );

      this.formElement = element;
      this.focusedNode = node;
      const currentFocusNode = this.focusedNode;
      this.popupNode = currentFocusNode;
    } else {
      const formElementInstance = createElement(
        'div',
        { class: 'max-h-[380px]  h-[fit-content]  p-3 pb-6' },
        this.editPopupContainer?.domElement,
        undefined
      );
      this.formElement = formElementInstance;
      this.focusedNode = node;
      const currentFocusNode = this.focusedNode;
      this.popupNode = currentFocusNode;
      FormComponent({
        rootElement: this.formElement!.domElement as HTMLElement,
        id: selectedNodeInfo.id,
        hasSubmitButton: false,
        onSave: (values: any) => {
          console.log('onSave', values);

          this.rootElement?.querySelectorAll('.selected').forEach((element) => {
            element.classList.remove('selected');
          });

          const node = (
            selectedNodeInfo?.containerNode
              ? (selectedNodeInfo?.containerNode.nodeInfo as any)
                  ?.canvasAppInstance?.elements
              : this.currentCanvasApp?.elements
          )?.get(selectedNodeInfo.id);
          if (node) {
            if (
              (node.nodeInfo as any).formElements ||
              node.nodeType === NodeType.Connection
            ) {
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

          this.removeFormElement();
          //currentSelectedNode = undefined;

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

          console.log('onsave this.focusedNode', this.focusedNode);
          if (currentFocusNode) {
            (currentFocusNode.domElement as HTMLElement).focus();
          }
        },
        formElements: (
          formElements ||
          ((node?.nodeInfo as any)?.formElements ?? [])
        ).map((item: any) => {
          return {
            ...item,
            value: ((node?.nodeInfo as any)?.formValues ?? {})[item.fieldName],
            //values: ((node?.nodeInfo as any)?.formValues ?? {})[item.fieldName],
          };
        }),
      }) as unknown as HTMLElement;
    }
    console.log('before positionPopup1');
    this.positionPopup(node);
  };

  run = () => {
    this.runFlow();
  };

  getSelectTaskElement = () => {
    return this.selectNodeType?.domElement as HTMLSelectElement;
  };

  setCameraTargetOnNode = (node: IRectNodeComponent<NodeInfo>) => {
    setTargetCameraAnimation(node.x, node.y, node.id, 1.0, true);
  };

  onShouldPositionPopup = (node: IRectNodeComponent<NodeInfo>) => {
    const nodeInfo = node?.nodeInfo ?? {};
    let formElements: any[] = [];
    if (node && node.nodeType === NodeType.Connection) {
      const connection = node as unknown as IConnectionNodeComponent<NodeInfo>;
      if (
        (connection?.startNode?.nodeInfo as BaseNodeInfo)?.outputConnectionInfo
      ) {
        const outputConnectionInfo = (
          connection?.startNode?.nodeInfo as BaseNodeInfo
        ).outputConnectionInfo;

        if (!outputConnectionInfo?.form) {
          return false;
        } else {
          formElements = outputConnectionInfo.form;
        }
      } else {
        return false;
      }
    } else {
      formElements = (nodeInfo as any)?.formElements ?? [];
      if (
        node.nodeInfo?.getSettingsPopup &&
        node.nodeInfo?.isSettingsPopup &&
        !(
          this.editPopupContainer?.domElement as unknown as HTMLElement
        )?.classList.contains('hidden')
      ) {
        return true;
      }
    }

    if ((formElements ?? []).length === 0) {
      return false;
    }
    if (!this.formElement) {
      return false;
    }
    return true;
  };

  onPreRemoveElement = (element: IElementNode<NodeInfo>) => {
    if (element.nodeInfo?.delete) {
      element.nodeInfo.delete();
    }
  };

  onPreclearCanvas = () => {
    this.clearPathExecution();
    removeAllCompositions();
    this.updateToolbarTaskList?.();
    initFlowVariableScope();

    resetRunIndex();
    (this.runButton?.domElement as HTMLButtonElement).disabled = false;
    this.resetConnectionSlider();
  };

  onPostclearCanvas = () => {
    setupTasksInDropdown(this.selectNodeType?.domElement as HTMLSelectElement);
    if (this.onStoreFlow && this.canvasApp) {
      const flow: Flow<NodeInfo> = {
        schemaType: 'flow',
        schemaVersion: '0.0.1',
        id: this.flowId,
        flows: {
          flow: {
            flowType: 'flow',
            nodes: [],
          },
        },
        compositions: {},
      };
      this.onStoreFlow(flow, this.canvasApp, getNodeTaskFactory);
    }
  };

  clearPathExecution = () => {
    if (this.scopeNodeDomElement) {
      this.scopeNodeDomElement.classList.remove('bg-blue-300');
    }

    const domCircle = this.testCircle?.domElement as HTMLElement;
    const domMessage = this.message?.domElement as HTMLElement;
    domCircle.style.display = 'none';
    domMessage.style.display = 'none';
    domCircle.classList.add('hidden');
    domMessage.classList.add('hidden');
  };

  onAddFlowComposition = (
    composition: Composition<NodeInfo>,
    connections: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<NodeInfo>;
    }[]
  ) => {
    //this.nodeSidebarMenu
    return this.onAddComposition(
      composition,
      connections,
      registerComposition,
      getNodeTaskFactory,
      (
        selectNodeTypeHTMLElement: HTMLSelectElement,
        isInComposition?: boolean,
        compositionId?: string
      ) => {
        setupTasksInDropdown(
          selectNodeTypeHTMLElement,
          isInComposition,
          compositionId
        );
        this.nodeSidebarMenu?.initNodeTaskbar(isInComposition, compositionId);
      },
      this.selectNodeType?.domElement as HTMLSelectElement
    );
  };

  editFlowComposition = () => {
    if (this.canvasUpdated) {
      this.editComposition(
        getNodeTaskFactory,
        this.canvasUpdated,
        (
          selectNodeTypeHTMLElement: HTMLSelectElement,
          isInComposition?: boolean,
          compositionId?: string
        ) => {
          setupTasksInDropdown(
            selectNodeTypeHTMLElement,
            isInComposition,
            compositionId
          );
          this.nodeSidebarMenu?.initNodeTaskbar(isInComposition, compositionId);
        },
        this.selectNodeType?.domElement as HTMLSelectElement
      );
    }
  };

  onEditComposition() {
    super.onEditComposition();

    removeClasses(this.menubarContainerElement, ['bg-slate-700']);
    addClasses(this.menubarContainerElement, ['bg-sky-500']);

    this.navbarComponent?.onEditComposition();
    addClasses(this.clearCanvasButton, ['hidden']);
    addClasses(this.resetStateButton, ['hidden']);

    addClasses(this.runButton, ['hidden']);
    addClasses(this.speedMeterElement, ['hidden']);

    addClassesHTMLElement(this.exportCodeButton, ['hidden']);
  }
  onEnterEditComposition() {
    super.onEnterEditComposition();

    this.currentCanvasApp?.elements.forEach((node) => {
      const nodeComponent = node as unknown as INodeComponent<NodeInfo>;
      if (nodeComponent.nodeType !== NodeType.Connection) {
        if (nodeComponent?.nodeInfo?.initializeCompute) {
          nodeComponent.nodeInfo.initializeCompute();
        }
      }
    });
  }

  onExitEditComposition() {
    super.onExitEditComposition();

    removeClasses(this.menubarContainerElement, ['bg-sky-500']);
    addClasses(this.menubarContainerElement, ['bg-slate-700']);

    this.navbarComponent?.onExitEditComposition();
    removeClasses(this.clearCanvasButton, ['hidden']);
    removeClasses(this.resetStateButton, ['hidden']);

    removeClasses(this.runButton, ['hidden']);
    removeClasses(this.speedMeterElement, ['hidden']);

    removeClassesHTMLElement(this.exportCodeButton, ['hidden']);

    this.initializeNodes?.();
  }

  onSetupCompositionCanvasEdit(canvasApp: IFlowCanvasBase<NodeInfo>) {
    canvasApp.setOnAddcomposition(this.onAddFlowComposition);
  }

  onImported = () => {
    //
  };

  resetConnectionSlider = (shouldResetConnectionSlider = true) => {
    console.log('resetConnectionSlider');
    document.body.classList.remove('connection-history--sliding');
    (this.pathRange?.domElement as HTMLElement).setAttribute('value', '0');
    (this.pathRange?.domElement as HTMLElement).setAttribute('max', '0');
    (this.pathRange?.domElement as HTMLElement).setAttribute(
      'disabled',
      'disabled'
    );
    if (shouldResetConnectionSlider) {
      console.log('resetConnectionSlider: clear connectionExecuteHistory');
      connectionExecuteHistory.length = 0;
    }

    document
      .querySelectorAll('.connection-history__node--active')
      .forEach((element) => {
        element.classList.remove('connection-history__node--active');
      });

    this.clearPathExecution();
  };

  createRunCounterContext = (
    isRunViaRunButton = false,
    shouldResetConnectionSlider = true,
    onFlowFinished?: () => void
  ) => {
    console.log(
      'createRunCounterContext',
      isRunViaRunButton,
      shouldResetConnectionSlider
    );
    this.resetConnectionSlider(shouldResetConnectionSlider);
    (this.pathRange?.domElement as HTMLButtonElement).disabled = true;

    const runCounter = new RunCounter();
    runCounter.setRunCounterResetHandler(() => {
      if (runCounter.runCounter <= 0) {
        console.log('setRunCounterResetHandler: runCounter.runCounter <= 0');
        (this.pathRange?.domElement as HTMLButtonElement).disabled = false;
        if (isRunViaRunButton) {
          (this.runButton?.domElement as HTMLButtonElement).disabled = false;
        }
        increaseRunIndex();
        (this.pathRange?.domElement as HTMLElement).setAttribute('value', '0');
        (this.pathRange?.domElement as HTMLElement).setAttribute(
          'max',
          (connectionExecuteHistory.length * 1000).toString()
        );
        if (onFlowFinished) {
          onFlowFinished();
        }
      } else {
        console.log(
          'setRunCounterResetHandler: runCounter.runCounter > 0',
          runCounter.runCounter
        );
      }
    });
    return runCounter;
  };

  runCounterElement: IDOMElement | null = null;
  runFlow = () => {
    if (!this.runCounterElement) {
      return;
    }
    (this.runButton?.domElement as HTMLButtonElement).disabled = true;
    //this.clearPathExecution();
    setRunCounterUpdateElement(
      this.runCounterElement.domElement as HTMLElement
    );
    let keepPopupOpenAfterUpdate = false;

    const selectedNode = getSelectedNode();
    if (selectedNode) {
      const node = this.canvasApp?.elements.get(selectedNode.id);
      if (node && node.nodeInfo?.keepPopupOpenAfterUpdate) {
        keepPopupOpenAfterUpdate = true;
      }
    }
    if (!keepPopupOpenAfterUpdate) {
      this.removeFormElement();
    }
    //resetRunCounter();
    if (this.canvasApp?.elements) {
      this.canvasApp?.elements.forEach((node: IElementNode<NodeInfo>) => {
        if (node && node.nodeInfo && node.nodeInfo.initializeOnStartFlow) {
          node.nodeInfo?.initializeCompute?.();
        }
      });
      (this.pathRange?.domElement as HTMLButtonElement).disabled = true;
      const runCounter = this.createRunCounterContext(true, false);
      run(
        this.canvasApp?.elements,
        this.canvasApp,
        (input) => {
          console.log('run finished', input);
        },
        undefined,
        undefined,
        undefined,
        runCounter,
        false
      );
    }
  };

  onBeforeExecuteCommand = (
    command: string,
    _parameter1: any,
    _parameter2: any
  ) => {
    // parameter1 is the nodeType
    // parameter2 is the id of a selected node
    if (command === PasteNodeCommand.commandName) {
      const selectedNode = getSelectedNode();
      if (selectedNode) {
        const node = this.canvasApp?.elements.get(
          selectedNode.id
        ) as IConnectionNodeComponent<NodeInfo>;
        if (
          node &&
          node.nodeType === NodeType.Connection &&
          node.endNode &&
          node.startNodeThumb &&
          this.canvasApp
        ) {
          // Copy & paste clipboard to connection and trigger connection

          const canvasApp = this.canvasApp;
          const endNode = node.endNode;
          const startNodeThumb = node.startNodeThumb;

          navigator.clipboard.readText().then((text) => {
            console.log('clipboard', text);
            if (text) {
              let interval: any = undefined;
              clearTimeout(interval);
              console.log('TRIGGER FLOW!', getIsStopAnimations());
              resetRunIndex();
              (this.runButton?.domElement as HTMLButtonElement).disabled =
                false;
              setStopAnimations();
              // Wait until isStopAnimations is set to false
              interval = setInterval(() => {
                if (!getIsStopAnimations()) {
                  clearInterval(interval);
                  runNodeFromThumb(
                    startNodeThumb,
                    canvasApp,
                    () => {
                      //
                    },
                    this.transformValueForNodeTrigger(text),
                    endNode,
                    undefined,
                    undefined,
                    this.createRunCounterContext(false, false)
                  );
                }
              }, 0);
            }
          });
          return false;
        }
      }
    }
    return true;
  };

  handleExpression = (expression: string, payload: any) => {
    try {
      const compiledExpression = compileExpressionAsInfo(expression);
      const expressionFunction = (
        new Function('payload', `${compiledExpression.script}`) as unknown as (
          payload?: any
        ) => any
      ).bind(compiledExpression.bindings);

      const result = runExpression(
        expressionFunction,
        payload,
        false,
        compiledExpression.payloadProperties
      );
      return result;
    } catch (error) {
      console.error('Split-by-case: Error in handleExpression', error);
      return false;
    }
  };

  transformValueForNodeTrigger = (value: string) => {
    if (typeof value === 'string') {
      let trimmedValue = value.trim();
      if (
        (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) ||
        trimmedValue.startsWith('=')
      ) {
        if (trimmedValue.startsWith('=')) {
          trimmedValue = trimmedValue.slice(1);
        }
        const payloadForExpression = getVariablePayloadInputUtils(
          '',
          {},
          'number',
          -1,
          -1,
          undefined,
          this.currentCanvasApp
        );
        const expressionResult = this.handleExpression(
          trimmedValue,
          payloadForExpression
        );
        if (expressionResult !== false) {
          return expressionResult;
        }
        return '';
      }
      if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
        try {
          return JSON.parse(trimmedValue);
        } catch (e) {
          return trimmedValue;
        }
      }
      return value;
    }
    return '';
  };

  onAfterAddComposition(node: IRectNodeComponent<NodeInfo>) {
    node?.nodeInfo?.initializeCompute?.();
  }
}
