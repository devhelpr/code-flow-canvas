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
  setupMarkupElement,
  createElementMap,
  createCanvasApp,
  CanvasAppInstance,
  ThumbType,
  IRectNodeComponent,
  IConnectionNodeComponent,
  IThumbNodeComponent,
  Flow,
  updateNamedSignal,
  NodeType,
  ElementNodeMap,
  LineType,
  SelectedNodeInfo,
  createNSElement,
  Camera,
  FlowNode,
} from '@devhelpr/visual-programming-system';

import { registerCustomFunction } from '@devhelpr/expression-compiler';
import flowData from '../example-data/tiltest.json';

import { FormComponent } from './components/form-component';

import {
  increaseRunIndex,
  resetRunIndex,
  run,
  RunNodeResult,
} from './simple-flow-engine/simple-flow-engine';
import { NodeInfo } from './types/node-info';
import {
  setSpeedMeter,
  timers,
  animatePath as _animatePath,
  animatePathFromThumb as _animatePathFromThumb,
} from './follow-path/animate-path';
import {
  createIndexedDBStorageProvider,
  FlowrunnerIndexedDbStorageProvider,
} from './storage/indexeddb-storage-provider';
import { getPointOnConnection } from './follow-path/point-on-connection';
import { AppComponents } from './components/app-components';
import { NavbarComponents } from './components/navbar-components';
import {
  menubarClasses,
  navBarButton,
  navBarIconButton,
  navBarIconButtonInnerElement,
} from './consts/classes';
import {
  getNodeFactoryNames,
  getNodeTaskFactory,
  setupCanvasNodeTaskRegistry,
} from './node-task-registry/canvas-node-task-registry';
import { serializeElementsMap } from './storage/serialize-canvas';
import { importToCanvas } from './storage/import-to-canvas';
import { NodeSidebarMenuComponents } from './components/node-sidebar-menu';

const template = document.createElement('template');
template.innerHTML = `
  <div class="h-screen w-full bg-slate-800 overflow-hidden touch-none" id="root" >
  </div>
`;

export class AppElement {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  canvas?: IElementNode<NodeInfo> = undefined;
  canvasApp?: CanvasAppInstance<NodeInfo> = undefined;
  storageProvider: FlowrunnerIndexedDbStorageProvider | undefined = undefined;

  pathExecutions: RunNodeResult<NodeInfo>[][] = [];
  scopeNodeDomElement: HTMLElement | undefined = undefined;

  currentPathUnderInspection: RunNodeResult<NodeInfo>[] | undefined = undefined;

  formElement: INodeComponent<NodeInfo> | undefined = undefined;
  editPopupContainer: IElementNode<NodeInfo> | undefined = undefined;
  editPopupLineContainer: IElementNode<NodeInfo> | undefined = undefined;
  editPopupLinePath: IElementNode<NodeInfo> | undefined = undefined;
  editPopupLineEndPath: IElementNode<NodeInfo> | undefined = undefined;
  editPopupEditingNodeIndicator: IElementNode<NodeInfo> | undefined = undefined;
  selectedNodeLabel: IElementNode<NodeInfo> | undefined = undefined;
  rootElement: HTMLElement | undefined = undefined;

  removeElement = (element: IElementNode<NodeInfo>) => {
    if (element.nodeInfo?.delete) {
      element.nodeInfo.delete();
    }
    element.domElement.remove();
    const node = element as unknown as INodeComponent<NodeInfo>;
    if (node && node.delete) {
      node.delete();
    }
    element.elements.forEach((element: IElementNode<NodeInfo>) => {
      this.removeElement(element as unknown as IElementNode<NodeInfo>);
    });
    element.elements = createElementMap<NodeInfo>();
  };

  clearCanvas = () => {
    this.clearPathExecution();
    this.currentPathUnderInspection = undefined;
    this.pathExecutions = [];

    setSelectNode(undefined);

    this.canvasApp?.elements.forEach((element) => {
      element.domElement.remove();
      this.removeElement(element as unknown as IElementNode<NodeInfo>);
    });
    this.canvasApp?.elements.clear();
    this.canvasApp?.setCamera(0, 0, 1);
  };

  testCircle: IElementNode<NodeInfo> | undefined = undefined;
  message: IElementNode<NodeInfo> | undefined = undefined;
  messageText: IElementNode<NodeInfo> | undefined = undefined;

  currentPathExecution: RunNodeResult<NodeInfo>[] | undefined = undefined;

  clearPathExecution = () => {
    if (this.scopeNodeDomElement) {
      this.scopeNodeDomElement.classList.remove('bg-blue-300');
    }
    if (this.currentPathExecution) {
      this.currentPathExecution.forEach((path) => {
        if (path.node && path.node.domElement) {
          (path.node.domElement.firstChild as HTMLElement)?.classList.remove(
            'bg-blue-400'
          );
        }
      });
      const domCircle = this.testCircle?.domElement as HTMLElement;
      const domMessage = this.message?.domElement as HTMLElement;
      domCircle.style.display = 'none';
      domMessage.style.display = 'none';
      domCircle.classList.add('hidden');
      domMessage.classList.add('hidden');
      this.currentPathExecution = undefined;
    }
  };

  onCameraChanged = (camera: Camera) => {
    const selectedNodeInfo = getSelectedNode();

    if (selectedNodeInfo) {
      const node = (
        selectedNodeInfo?.containerNode
          ? (selectedNodeInfo?.containerNode.nodeInfo as any)?.canvasAppInstance
              ?.elements
          : this.canvasApp?.elements
      )?.get(selectedNodeInfo.id);

      if (!node) {
        return;
      }
      const nodeInfo: any = node?.nodeInfo ?? {};
      if (
        node &&
        (node as INodeComponent<NodeInfo>).nodeType === NodeType.Connection
      ) {
        return;
      }

      if (((nodeInfo as any)?.formElements ?? []).length === 0) {
        return;
      }
      if (!this.formElement) {
        return;
      }
      console.log('before positionPopup2', selectedNodeInfo);
      this.positionPopup(node);
    }
  };

  positionPopup = (node: IRectNodeComponent<NodeInfo>) => {
    (
      this.editPopupContainer?.domElement as unknown as HTMLElement
    ).classList.remove('hidden');
    (
      this.editPopupLineContainer?.domElement as unknown as HTMLElement
    ).classList.remove('hidden');

    const sidebar = this.editPopupContainer
      ?.domElement as unknown as HTMLElement;
    const nodeComponent = node as INodeComponent<NodeInfo>;

    let parentX = 0;
    let parentY = 0;
    if (node.containerNode) {
      if (node.containerNode && node.containerNode?.getParentedCoordinates) {
        const parentCoordinates =
          node.containerNode?.getParentedCoordinates() ?? {
            x: 0,
            y: 0,
          };
        // parentX = node.containerNode.x;
        // parentY = node.containerNode.y;
        parentX = parentCoordinates.x;
        parentY = parentCoordinates.y;
      }
    }
    const camera = this.canvasApp?.getCamera();

    const xCamera = camera?.x ?? 0;
    const yCamera = camera?.y ?? 0;
    const scaleCamera = camera?.scale ?? 1;
    const xNode = parentX + nodeComponent.x ?? 0;
    const yNode = parentY + nodeComponent.y ?? 0;
    const widthNode = nodeComponent.width ?? 0;
    const heightNode = nodeComponent.height ?? 0;

    console.log(
      'selectedNode',
      xCamera,
      yCamera,
      scaleCamera,
      xNode,
      yNode,
      widthNode,
      heightNode
    );
    const rootClientRect = this.rootElement?.getBoundingClientRect();
    console.log('rootClientRect', rootClientRect);
    let x = xCamera + xNode * scaleCamera + widthNode * scaleCamera + 100;
    if (x < 10) {
      x = 10;
    }
    if (x + 400 - 10 > (rootClientRect?.width ?? 0)) {
      x = (rootClientRect?.width ?? 0) - 400 - 10;
    }
    let y = yCamera + yNode * scaleCamera;
    if (y < 50) {
      y = 50;
    }
    if (y + 380 > (rootClientRect?.height ?? 0) - 80) {
      y = (rootClientRect?.height ?? 0) - 380 - 80;
    }

    sidebar.style.left = `${x}px`;
    sidebar.style.top = `${y}px`;

    const lineContainer = this.editPopupLineContainer
      ?.domElement as unknown as HTMLElement;

    const xLine = xCamera + xNode * scaleCamera + (widthNode / 2) * scaleCamera;
    lineContainer.style.left = `${xLine}px`;

    const centerNodeY =
      yCamera + yNode * scaleCamera + (heightNode / 2) * scaleCamera;
    const yLine = centerNodeY - heightNode * scaleCamera;

    lineContainer.style.top = `${y < yLine ? y : yLine}px`;
    lineContainer.style.width = `${x - xLine < 0 ? xLine - x : x - xLine}px`;
    lineContainer.style.height = `${1000}px`; // heightNode * scaleCamera

    const indicatorElement = this.editPopupEditingNodeIndicator
      ?.domElement as unknown as HTMLElement;
    indicatorElement.style.left = `${
      xCamera + xNode * scaleCamera + (widthNode / 2) * scaleCamera
    }px`;
    indicatorElement.style.top = `${centerNodeY}px`;
    indicatorElement.classList.remove('hidden');
    indicatorElement.classList.add('editing-node-indicator');

    (this.editPopupLinePath?.domElement as SVGPathElement).setAttribute(
      'd',
      `M0 ${(y < yLine ? yLine - y : 0) + heightNode * scaleCamera} 
       L${(x - xLine < 0 ? xLine - x : x - xLine) - 5} ${
        (yLine < y ? y - yLine : 0) + 170
      }`
    );

    (this.editPopupLineEndPath?.domElement as SVGPathElement).setAttribute(
      'd',
      `M${(x - xLine < 0 ? xLine - x : x - xLine) - 5} ${
        (yLine < y ? y - yLine : 0) + 170 - 5
      }
      L${(x - xLine < 0 ? xLine - x : x - xLine) - 5} ${
        (yLine < y ? y - yLine : 0) + 170 + 5
      }
        `
    );
  };

  constructor(appRootSelector: string) {
    // NOTE : on http instead of https, crypto is not available...
    // so uuid's cannot be created and the app will not work

    if (typeof crypto === 'undefined') {
      console.error(
        'NO Crypto defined ... uuid cannot be created! Are you on a http connection!?'
      );
    }
    const appRootElement = document.querySelector(appRootSelector);
    if (!appRootElement) {
      return;
    }
    appRootElement.appendChild(template.content.cloneNode(true));
    this.rootElement = appRootElement.querySelector('div#root') as HTMLElement;
    if (!this.rootElement) {
      return;
    }

    const canvasApp = createCanvasApp<NodeInfo>(this.rootElement);
    this.canvas = canvasApp.canvas;
    this.canvasApp = canvasApp;
    canvasApp.setOnCameraChanged(this.onCameraChanged);

    const animatePath = (
      node: IRectNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: (
        nodeId: string,
        node: IRectNodeComponent<NodeInfo>,
        input: string | any[]
      ) =>
        | {
            result: boolean;
            output: string | any[];
            followPathByName?: string;
            followPath?: string;
          }
        | Promise<{
            result: boolean;
            output: string | any[];
            followPathByName?: string;
            followPath?: string;
          }>,
      onStopped?: (input: string | any[]) => void,
      input?: string | any[],
      followPathByName?: string, // normal, success, failure, "subflow",
      animatedNodes?: {
        node1?: IElementNode<unknown>;
        node2?: IElementNode<unknown>;
        node3?: IElementNode<unknown>;
      },
      offsetX?: number,
      offsetY?: number,
      followPathToEndThumb?: boolean,
      singleStep?: boolean,
      followThumb?: string
    ) => {
      if (!this.canvasApp) {
        throw new Error('canvasApp not defined');
      }
      return _animatePath<NodeInfo>(
        this.canvasApp,
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
        followThumb
      );
    };

    const animatePathFromThumb = (
      node: IThumbNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: (
        nodeId: string,
        node: IRectNodeComponent<NodeInfo>,
        input: string | any[]
      ) =>
        | { result: boolean; output: string | any[]; followPathByName?: string }
        | Promise<{
            result: boolean;
            output: string | any[];
            followPathByName?: string;
          }>,
      onStopped?: (input: string | any[]) => void,
      input?: string | any[],
      followPathByName?: string, // normal, success, failure, "subflow",
      animatedNodes?: {
        node1?: IElementNode<unknown>;
        node2?: IElementNode<unknown>;
        node3?: IElementNode<unknown>;
      },
      offsetX?: number,
      offsetY?: number,
      followPathToEndThumb?: boolean,
      singleStep?: boolean
    ) => {
      if (!this.canvasApp) {
        throw new Error('canvasApp not defined');
      }
      return _animatePathFromThumb<NodeInfo>(
        this.canvasApp,
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
        singleStep
      );
    };

    setupCanvasNodeTaskRegistry(animatePath, animatePathFromThumb);
    createIndexedDBStorageProvider()
      .then((storageProvider) => {
        console.log('storageProvider', storageProvider);
        this.isStoring = true;
        this.storageProvider = storageProvider;

        if (this.storageProvider && this.canvasApp && this.rootElement) {
          NavbarComponents({
            clearCanvas: this.clearCanvas,
            initializeNodes: initializeNodes,
            storageProvider: this.storageProvider,
            selectNodeType: selectNodeType.domElement as HTMLSelectElement,
            animatePath: animatePath,
            animatePathFromThumb: animatePathFromThumb,
            canvasUpdated: canvasUpdated,
            canvasApp: this.canvasApp,
            removeElement: this.removeElement,
            rootElement: menubarElement.domElement as HTMLElement,
            rootAppElement: this.rootElement as HTMLElement,
            setIsStoring: setIsStoring,
            importToCanvas: (
              nodesList: FlowNode<NodeInfo>[],
              canvasApp: CanvasAppInstance<NodeInfo>,
              canvasUpdated: () => void,
              containerNode?: IRectNodeComponent<NodeInfo>,
              nestedLevel?: number
            ) => {
              this.isStoring = true;
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel
              );
              this.isStoring = false;
              canvasUpdated();
            },
          }) as unknown as HTMLElement;

          this.selectedNodeLabel = createElement(
            'div',
            {
              id: 'selectedNode',
              class: 'text-white',
            },
            menubarElement.domElement
          );

          NodeSidebarMenuComponents({
            clearCanvas: this.clearCanvas,
            initializeNodes: initializeNodes,
            storageProvider: this.storageProvider,
            selectNodeType: selectNodeType.domElement as HTMLSelectElement,
            animatePath: animatePath,
            animatePathFromThumb: animatePathFromThumb,
            canvasUpdated: canvasUpdated,
            canvasApp: this.canvasApp,
            removeElement: this.removeElement,
            rootElement: this.rootElement as HTMLElement,
            rootAppElement: this.rootElement as HTMLElement,
            setIsStoring: setIsStoring,
            importToCanvas: (
              nodesList: FlowNode<NodeInfo>[],
              canvasApp: CanvasAppInstance<NodeInfo>,
              canvasUpdated: () => void,
              containerNode?: IRectNodeComponent<NodeInfo>,
              nestedLevel?: number
            ) => {
              this.isStoring = true;
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel
              );
              this.isStoring = false;
              canvasUpdated();
            },
          }) as unknown as HTMLElement;
        }
        this.clearCanvas();
        storageProvider
          .getFlow('1234')
          .then((flow) => {
            importToCanvas(
              flow.flows.flow.nodes,
              canvasApp,
              canvasUpdated,
              undefined,
              0
            );
            canvasApp.centerCamera();
            initializeNodes();
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
        console.log('nodesList', nodesList);
        const flow: Flow<NodeInfo> = {
          schemaType: 'flow',
          schemaVersion: '0.0.1',
          id: '1234',
          flows: {
            flow: {
              flowType: 'flow',
              nodes: nodesList,
            },
          },
        };
        this.storageProvider.saveFlow('1234', flow);
      }
    };

    const canvasUpdated = () => {
      if (this.isStoring) {
        return;
      }
      store();
    };
    canvasApp.setOnCanvasUpdated(() => {
      canvasUpdated();
    });

    const setIsStoring = (isStoring: boolean) => {
      this.isStoring = isStoring;
    };

    canvasApp.setOnCanvasClick((x, y) => {
      console.log('OnCanvasClick');
      setSelectNode(undefined);
    });

    const menubarElement = createElement(
      'div',
      {
        class: menubarClasses,
      },
      this.rootElement
    );

    createElement(
      'button',
      {
        class: navBarButton,
        click: (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.clearCanvas();
          store();
          return false;
        },
      },
      menubarElement.domElement,
      'Clear canvas'
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
        const nodeComponent = node as unknown as INodeComponent<NodeInfo>;
        if (nodeComponent.nodeType !== NodeType.Connection) {
          if (nodeComponent?.nodeInfo?.initializeCompute) {
            nodeComponent.nodeInfo.initializeCompute();
          }
        }
      });
      this.pathExecutions = [];
      this.currentPathUnderInspection = undefined;
      resetRunIndex();
      (runButton.domElement as HTMLButtonElement).disabled = false;
    };
    createElement(
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

    // createElement(
    //   'button',
    //   {
    //     class: navBarButton,
    //     click: (event) => {
    //       event.preventDefault();
    //       this.clearCanvas();
    //       flowData.forEach((flowNode) => {
    //         if (flowNode.shapeType !== 'Line') {
    //           const rect = canvasApp?.createRect(
    //             flowNode.x ?? 0,
    //             flowNode.y ?? 0,
    //             200,
    //             300,
    //             flowNode.taskType,
    //             undefined,
    //             [
    //               {
    //                 thumbType: ThumbType.StartConnectorCenter,
    //                 thumbIndex: 0,
    //                 connectionType: ThumbConnectionType.start,
    //               },
    //               {
    //                 thumbType: ThumbType.EndConnectorCenter,
    //                 thumbIndex: 0,
    //                 connectionType: ThumbConnectionType.end,
    //               },
    //             ],
    //             `<p>${flowNode.taskType}</p>`,
    //             {
    //               classNames: `bg-slate-500 p-4 rounded`,
    //             }
    //           );
    //           rect.nodeComponent.nodeInfo = flowNode;
    //         }
    //       });

    //       const elementList = Array.from(canvasApp?.elements ?? []);
    //       console.log('elementList', elementList);

    //       flowData.forEach((flowNode) => {
    //         if (flowNode.shapeType === 'Line') {
    //           let start: INodeComponent<NodeInfo> | undefined = undefined;
    //           let end: INodeComponent<NodeInfo> | undefined = undefined;
    //           if (flowNode.startshapeid) {
    //             const startElement = elementList.find((e) => {
    //               const element = e[1] as IElementNode<NodeInfo>;
    //               return element.nodeInfo?.id === flowNode.startshapeid;
    //             });
    //             if (startElement) {
    //               start =
    //                 startElement[1] as unknown as INodeComponent<NodeInfo>;
    //             }
    //           }
    //           if (flowNode.endshapeid) {
    //             const endElement = elementList.find((e) => {
    //               const element = e[1] as IElementNode<NodeInfo>;
    //               return element.nodeInfo?.id === flowNode.endshapeid;
    //             });
    //             if (endElement) {
    //               end = endElement[1] as unknown as INodeComponent<NodeInfo>;
    //             }
    //           }

    //           const curve = canvasApp.createCubicBezier(
    //             start?.x ?? 0,
    //             start?.y ?? 0,
    //             end?.x ?? 0,
    //             end?.y ?? 0,
    //             (start?.x ?? 0) + 100,
    //             (start?.y ?? 0) + 150,
    //             (end?.x ?? 0) + 100,
    //             (end?.y ?? 0) + 150,
    //             false
    //           );

    //           curve.nodeComponent.isControlled = true;
    //           curve.nodeComponent.nodeInfo = flowNode;

    //           if (start && curve.nodeComponent) {

    //             curve.nodeComponent.startNode = start;
    //             curve.nodeComponent.startNodeThumb = this.getThumbNode(
    //               ThumbType.StartConnectorCenter,
    //               start
    //             );
    //           }

    //           if (end && curve.nodeComponent) {

    //             curve.nodeComponent.endNode = end;
    //             curve.nodeComponent.endNodeThumb = this.getThumbNode(
    //               ThumbType.EndConnectorCenter,
    //               end
    //             );
    //           }
    //           if (curve.nodeComponent.update) {
    //             curve.nodeComponent.update();
    //           }
    //         }
    //       });
    //       this.canvasApp?.centerCamera();
    //       return false;
    //     },
    //   },
    //   menubarElement.domElement,
    //   'import flow'
    // );

    const serializeFlow = () => {
      return serializeElementsMap(canvasApp.elements);
    };

    const runButton = createElement(
      'button',
      {
        class: `${navBarIconButton}`,
        click: (event) => {
          event.preventDefault();
          (runButton.domElement as HTMLButtonElement).disabled = true;
          this.clearPathExecution();
          this.currentPathUnderInspection = undefined;
          if (this.canvasApp?.elements) {
            run<NodeInfo>(
              this.canvasApp?.elements,
              this.canvasApp,
              animatePath,
              (input, pathExecution) => {
                if (pathExecution) {
                  (pathRange.domElement as HTMLInputElement).value = '0';
                  this.pathExecutions.push(pathExecution);
                }
                console.log('run finished', input, pathExecution);
                (runButton.domElement as HTMLButtonElement).disabled = false;
                increaseRunIndex();
              }
            );
          }
          return false;
        },
      },
      menubarElement.domElement
    );
    createElement(
      'span',
      {
        class: `${navBarIconButtonInnerElement} icon-play_arrow`,
      },
      runButton.domElement
    );

    let speedMeter = 100;
    createElement(
      'input',
      {
        type: 'range',
        class: 'p-2 m-2 relative ', //top-[60px]',
        name: 'speed',
        min: '0.1',
        max: '100',
        value: '100',
        change: (event) => {
          speedMeter = parseInt((event.target as HTMLInputElement).value);
          setSpeedMeter(speedMeter);
          const timerList = Array.from(timers ?? []);
          timerList.forEach((timer) => {
            timer[1]();
          });
        },
      },
      menubarElement.domElement,
      ''
    );

    const createOption = (
      selectElement: HTMLSelectElement,
      value: string,
      text: string
    ) => {
      const option = createElement(
        'option',
        {
          value: value,
        },
        selectElement,
        text
      );
      return option;
    };

    const selectNodeType = createElement(
      'select',
      {
        type: 'select',
        class: 'p-2 m-2 relative ', //top-[60px]',
        name: 'select-node-type',
        change: (event) => {
          //
        },
      },
      menubarElement.domElement,
      ''
    );
    const setupTasksInDropdown = () => {
      if (selectNodeType?.domElement) {
        (selectNodeType.domElement as HTMLSelectElement).innerHTML = '';
        const nodeTasks = getNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getNodeTaskFactory(nodeTask);
          if (factory) {
            const node = factory(canvasUpdated);
            if (node.isContained) {
              return;
            }
          }
          createOption(
            selectNodeType.domElement as HTMLSelectElement,
            nodeTask,
            nodeTask
          );
        });
      }
    };
    const setupTasksForContainerTaskInDropdown = (
      allowedNodeTasks: string[]
    ) => {
      if (selectNodeType?.domElement) {
        (selectNodeType.domElement as HTMLSelectElement).innerHTML = '';
        const nodeTasks = getNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getNodeTaskFactory(nodeTask);
          if (factory) {
            const node = factory(canvasUpdated);
            if (allowedNodeTasks.indexOf(node.name) < 0) {
              return;
            }
          }
          createOption(
            selectNodeType.domElement as HTMLSelectElement,
            nodeTask,
            nodeTask
          );
        });
      }
    };
    setupTasksInDropdown();

    // createElement(
    //   'button',
    //   {
    //     class: navBarButton,
    //     click: (event) => {
    //       event.preventDefault();
    //       this.clearCanvas();

    //       const maxRows = 20;
    //       const maxColumns = 20;

    //       const dateTimestampAll = performance.now();

    //       const spacing = 500;
    //       let loopRows = 0;
    //       while (loopRows < maxRows) {
    //         let loopColumns = 0;
    //         while (loopColumns < maxColumns) {
    //           const dateTimestamp = performance.now();

    //           const clipPaths = [
    //             'polygon(50% 2.4%, 34.5% 33.8%, 0% 38.8%, 25% 63.1%, 19.1% 97.6%, 50% 81.3%, 80.9% 97.6%, 75% 63.1%, 100% 38.8%, 65.5% 33.8%)',
    //             'polygon(50% 0, 100% 50%, 50% 100%, 0 50%',
    //             'circle(50%)',
    //             'polygon(50% 0, 100% 100%, 0 100%)',
    //             'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    //             'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
    //             'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
    //           ];
    //           const color = `rgb(${
    //             128 + Math.floor(Math.random() * 128)
    //           },${Math.floor(Math.random() * 16)},${Math.floor(
    //             Math.random() * 16
    //           )})`;

    //           const testNode = createElement(
    //             'button',
    //             {
    //               class:
    //                 'flex text-centerv text-white text-xl items-center justify-center w-[100px] h-[120px] overflow-hidden bg-red-500 rounded cursor-pointer',
    //               style: {
    //                 'background-color': color,
    //                 'clip-path':
    //                   clipPaths[
    //                     Math.round(Math.random() * (clipPaths.length - 1))
    //                   ],
    //               },
    //               click: (event) => {
    //                 event.preventDefault();
    //                 //alert(`click ${testNode.id}`);
    //                 animatePath(rect.nodeComponent, color);
    //                 return false;
    //               },
    //             },
    //             undefined,
    //             `${loopRows * maxColumns + loopColumns}`
    //           );

    //           const rect = canvasApp?.createRect(
    //             loopColumns * spacing + Math.floor(-75 + Math.random() * 150),
    //             loopRows * spacing + Math.floor(-75 + Math.random() * 150),
    //             100,
    //             100,
    //             'node',
    //             undefined,
    //             [
    //               {
    //                 thumbType: ThumbType.StartConnectorCenter,
    //                 thumbIndex: 0,
    //                 connectionType: ThumbConnectionType.start,
    //               },
    //               {
    //                 thumbType: ThumbType.EndConnectorCenter,
    //                 thumbIndex: 0,
    //                 connectionType: ThumbConnectionType.end,
    //               },
    //             ],
    //             testNode as unknown as INodeComponent<NodeInfo>,
    //             // `<div class="text-center">${
    //             //   loopRows * maxColumns + loopColumns
    //             // }</div>`
    //             {
    //               classNames: `bg-slate-500 p-4 rounded`,
    //               //classNames: `bg-slate-500 rounded flex justify-center items-center text-center w-[80px] h-[100px] `,
    //             },
    //             true
    //           );
    //           rect.nodeComponent.nodeInfo = {
    //             column: loopColumns,
    //             row: loopRows,
    //             compute: () => {
    //               return {
    //                 output: true,
    //                 result: true,
    //               };
    //             },
    //           };

    //           //console.log('createRect', performance.now() - dateTimestamp);
    //           loopColumns++;
    //         }
    //         loopRows++;
    //       }

    //       const elementList = Array.from(canvasApp?.elements ?? []);
    //       loopRows = 0;
    //       while (loopRows < maxRows - 1) {
    //         let loopColumns = 0;
    //         while (loopColumns < maxColumns - 1) {
    //           const start = elementList[
    //             loopRows * maxColumns + loopColumns
    //           ][1] as unknown as IRectNodeComponent<NodeInfo>;
    //           const end = elementList[
    //             (loopRows + 1) * maxColumns + loopColumns + 1
    //           ][1] as unknown as IRectNodeComponent<NodeInfo>;
    //           console.log(loopRows, loopColumns, 'start', start, 'end', end);

    //           const curve = canvasApp.createCubicBezier(
    //             loopColumns * spacing,
    //             loopRows * spacing,
    //             (loopColumns + 1) * spacing,
    //             loopRows * spacing,
    //             loopColumns * spacing + 100,
    //             loopRows * spacing + spacing / 2,
    //             (loopColumns + 1) * spacing + 100,
    //             loopRows * spacing + spacing / 2,
    //             false
    //           );

    //           curve.nodeComponent.isControlled = true;
    //           curve.nodeComponent.nodeInfo = {
    //             column: loopColumns,
    //             row: loopRows,
    //           };

    //           if (start && curve.nodeComponent) {
    //             curve.nodeComponent.startNode = start;
    //             curve.nodeComponent.startNodeThumb = this.getThumbNode(
    //               ThumbType.StartConnectorCenter,
    //               start
    //             );
    //           }

    //           if (end && curve.nodeComponent) {
    //             curve.nodeComponent.endNode = end;
    //             curve.nodeComponent.endNodeThumb = this.getThumbNode(
    //               ThumbType.EndConnectorCenter,
    //               end
    //             );
    //           }
    //           if (curve.nodeComponent.update) {
    //             curve.nodeComponent.update();
    //           }
    //           start.connections?.push(curve.nodeComponent);
    //           end.connections?.push(curve.nodeComponent);
    //           console.log('createCubicBezier', curve);

    //           loopColumns++;
    //         }
    //         loopRows++;
    //       }

    //       console.log('createRect All', performance.now() - dateTimestampAll);

    //       const dateTimestamp = performance.now();

    //       this.canvasApp?.centerCamera();

    //       console.log('centerCamera', performance.now() - dateTimestamp);

    //       return false;
    //     },
    //   },
    //   menubarElement.domElement,
    //   'stress test'
    // );

    this.testCircle = createElement(
      'div',
      {
        class: `absolute bg-blue-500 top-0 left-0 z-[1000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded hidden`,
        style: {
          'clip-path': 'circle(50%)',
        },
      },
      canvasApp?.canvas.domElement,
      ''
    );

    // eslint-disable-next-line prefer-const
    this.message = createElement(
      'div',
      {
        class: `flex text-center truncate min-w-0 overflow-hidden z-[1010] pointer-events-auto origin-center px-2 bg-blue-500 text-black absolute top-[-100px] z-[1000] left-[-60px] items-center justify-center w-[80px] h-[100px] overflow-hidden hidden`,
        style: {
          'clip-path':
            'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
        },
      },
      canvasApp?.canvas.domElement,
      ''
    );

    this.messageText = createElement(
      'div',
      {
        class: `truncate min-w-0 overflow-hidden w-[80px] mt-[-30px]`,
      },
      this.message.domElement,
      ''
    );

    const bgRange = createElement(
      'div',
      {
        class:
          'p-2 absolute bottom-[20px] w-full h-[50px] bg-slate-200 items-center z-[1050] hidden', //flex',
        name: 'path-track-bg',
      },
      this.rootElement,
      ''
    );

    const showProgressOnPathExecution = (
      value: number,
      lastPathExecution: RunNodeResult<any>[]
    ) => {
      this.currentPathUnderInspection = lastPathExecution;

      if (this.scopeNodeDomElement) {
        this.scopeNodeDomElement.classList.remove('bg-blue-300');
        this.scopeNodeDomElement = undefined;
      }
      this.currentPathExecution = lastPathExecution;

      const stepSize = 100000 / (lastPathExecution.length - 1);
      const step = Math.floor(value / stepSize);
      const pathStep = lastPathExecution[step];
      const node = pathStep.node;
      if (pathStep.scopeNode) {
        this.scopeNodeDomElement = (
          pathStep.scopeNode.domElement as HTMLElement
        ).firstChild as HTMLElement;
        this.scopeNodeDomElement.classList.add('bg-blue-300');
      }
      lastPathExecution.forEach((path, indexPath) => {
        if (path.node && path.node.domElement) {
          (
            (path.node.domElement as HTMLElement).firstChild as HTMLElement
          ).classList.remove('bg-blue-400');
        }
      });
      if (node && node.domElement) {
        (
          (node.domElement as HTMLElement).firstChild as HTMLElement
        ).classList.add('bg-blue-400');

        const pointValue = value - step * stepSize;
        const percentage = pointValue / stepSize;
        console.log(
          'showProgressOnPathExecution',
          step,
          lastPathExecution.length
        );
        let loop = 0;
        while (loop < lastPathExecution.length) {
          const path = lastPathExecution[loop];
          if (path.node && path.node.nodeInfo && path.node.nodeInfo.setValue) {
            if (loop > step) {
              path.node.nodeInfo.setValue(path.previousOutput ?? path.output);
            } else {
              path.node.nodeInfo.setValue(path.output);
            }
          }
          loop++;
        }
        if (value % stepSize !== 0 && step < lastPathExecution.length) {
          (this.testCircle?.domElement as HTMLElement).classList.remove(
            'hidden'
          );
          (this.message?.domElement as HTMLElement).classList.remove('hidden');

          const nextNodeId = lastPathExecution[step + 1].nodeId;
          if (pathStep.endNode && pathStep.connection) {
            const bezierCurvePoints = getPointOnConnection<NodeInfo>(
              percentage,
              pathStep.connection,
              node,
              pathStep.endNode
            );
            const domCircle = this.testCircle?.domElement as HTMLElement;
            const domMessage = this.message?.domElement as HTMLElement;
            const domMessageText = this.messageText?.domElement as HTMLElement;
            domCircle.style.display = 'flex';
            domCircle.style.transform = `translate(${bezierCurvePoints.x}px, ${bezierCurvePoints.y}px)`;
            domMessage.style.display = 'flex';
            domMessage.style.transform = `translate(${bezierCurvePoints.x}px, ${bezierCurvePoints.y}px)`;
            domMessageText.textContent = pathStep.output.toString();
            domMessage.title = pathStep.output.toString();
          } else {
            pathStep.node.connections.forEach((connection) => {
              if (
                connection.startNode?.id === pathStep.nodeId &&
                connection.endNode?.id === nextNodeId
              ) {
                const bezierCurvePoints = getPointOnConnection<NodeInfo>(
                  percentage,
                  connection,
                  connection.startNode,
                  connection.endNode
                );
                const domCircle = this.testCircle?.domElement as HTMLElement;
                const domMessage = this.message?.domElement as HTMLElement;
                const domMessageText = this.messageText
                  ?.domElement as HTMLElement;
                domCircle.style.display = 'flex';
                domCircle.style.transform = `translate(${bezierCurvePoints.x}px, ${bezierCurvePoints.y}px)`;
                domMessage.style.display = 'flex';
                domMessage.style.transform = `translate(${bezierCurvePoints.x}px, ${bezierCurvePoints.y}px)`;
                domMessageText.textContent = pathStep.output.toString();
                domMessage.title = pathStep.output.toString();
              }
            });
          }
        }
      }
    };

    const pathRange = createElement(
      'input',
      {
        type: 'range',
        class: 'p-2 m-2 relative w-full', //top-[60px]',
        name: 'path-track',
        min: '0',
        max: '100000',
        value: 1,
        input: (event) => {
          if (
            this.currentPathUnderInspection === undefined &&
            this.rootElement
          ) {
            // inspect latest path execution when no path is being inspected

            const executionPathElement = this.rootElement.querySelector(
              '#execution-path'
            ) as HTMLInputElement;
            if (executionPathElement) {
              executionPathElement.value = '100';
            }

            this.currentPathUnderInspection =
              this.pathExecutions[this.pathExecutions.length - 1];
          }
          if (this.currentPathUnderInspection) {
            const value = parseInt((event.target as HTMLInputElement).value);
            if (!isNaN(value)) {
              showProgressOnPathExecution(
                value,
                this.currentPathUnderInspection
              );
            }
          }
        },
      },
      bgRange.domElement,
      ''
    );

    this.editPopupContainer = createElement(
      'div',
      {
        id: 'textAreaContainer',
        class:
          'absolute w-[400px] h-[380px] z-[1020] p-2 bg-slate-600 hidden overflow-auto',
        wheel: (event) => {
          event.stopPropagation();
        },
      },
      this.rootElement
    );
    this.editPopupLineContainer = createNSElement(
      'svg',
      {
        width: 0,
        height: 0,
        class:
          'absolute top-0 left-0 pointer-events-none z-[1000] hidden opacity-75',
        style: {
          width: '200px',
          height: '200px',
          filter: 'drop-shadow(rgba(0, 0, 0, 0.4) 3px 1px 2px)',
        },
      },
      this.rootElement
    );
    this.editPopupLinePath = createNSElement(
      'path',
      {
        d: 'M0 0 L200 200',
        stroke: 'white',
        'stroke-width': '3px',
        fill: 'transparent',
      },
      this.editPopupLineContainer.domElement
    );
    this.editPopupLineEndPath = createNSElement(
      'path',
      {
        d: 'M0 0 L0 0',
        stroke: 'white',
        'stroke-width': '2px',
        fill: 'transparent',
      },
      this.editPopupLineContainer.domElement
    );

    this.editPopupEditingNodeIndicator = createElement(
      'div',
      {
        class: 'absolute z-[1010] pointer-events-none',
        style: {
          filter: 'drop-shadow(rgba(0, 0, 0, 0.4) 3px 1px 2px)',
        },
      },
      this.rootElement
    );

    const setExecutionPath = (value: number) => {
      const index = Math.round(
        ((this.pathExecutions.length - 1) * value) / 100
      );

      const pathExecution = this.pathExecutions[index];
      if (pathExecution) {
        const progressOoPathExecution = parseInt(
          (pathRange.domElement as HTMLInputElement).value
        );

        console.log(
          'setExecutionPath',
          index,
          value,
          //          this.pathExecutions.length,
          progressOoPathExecution, // this cannot be compared with  the index of pathExectution..
          pathExecution.length
        );

        // pathExecution.forEach((path, index) => {
        //   if (path.node && path.node.nodeInfo && path.node.nodeInfo.setValue) {
        //     if (index < progressOoPathExecution - 1) {
        //       path.node.nodeInfo.setValue(path.previousOutput ?? path.output);
        //     } else {
        //       path.node.nodeInfo.setValue(path.output);
        //     }
        //   }
        // });

        showProgressOnPathExecution(progressOoPathExecution, pathExecution);
      }
    };
    AppComponents({
      setExecutionPath,
      rootElement: this.rootElement,
    }) as unknown as HTMLElement;
    //);
    // let raf = -1;
    // let inputTimeout = -1;

    let currentSelectedNode: SelectedNodeInfo | undefined = undefined;

    const removeFormElement = () => {
      if (this.formElement) {
        canvasApp?.deleteElementFromNode(
          this.editPopupContainer as INodeComponent<NodeInfo>,
          this.formElement
        );
        this.formElement = undefined;
      }
    };

    createEffect(() => {
      const selectedNodeInfo = getSelectedNode();
      console.log('selected nodeElement...', selectedNodeInfo);
      if (!this.rootElement) {
        return;
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
            ? (currentSelectedNode?.containerNode.nodeInfo as any)
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
            ? (selectedNodeInfo?.containerNode.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.canvasApp?.elements
        )?.get(selectedNodeInfo.id);

        if (!node) {
          return;
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
          (node as INodeComponent<NodeInfo>).nodeType === NodeType.Connection
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

        const factory = getNodeTaskFactory(nodeInfo.type);
        if (factory) {
          const nodeTask = factory(() => undefined);
          if ((nodeTask.childNodeTasks || []).length > 0) {
            setupTasksForContainerTaskInDropdown(nodeTask.childNodeTasks ?? []);
          } else {
            setupTasksInDropdown();
          }
        }

        if (((nodeInfo as any)?.formElements ?? []).length === 0) {
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
        this.formElement = formElementInstance as INodeComponent<NodeInfo>;

        FormComponent({
          rootElement: this.formElement.domElement as HTMLElement,
          id: selectedNodeInfo.id,
          hasSubmitButton: true,
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
          // onInput: (event: InputEvent) => {
          //   const text =
          //     (event?.target as unknown as HTMLTextAreaElement)?.value ?? '';

          //   if (inputTimeout !== -1) {
          //     clearTimeout(inputTimeout);
          //     inputTimeout = -1;
          //   }
          //   inputTimeout = setTimeout(() => {
          //     if (raf !== -1) {
          //       window.cancelAnimationFrame(raf);
          //       raf = -1;
          //     }

          //     console.log('oninput', text);
          //     registerCustomBlock('frameUpdate');
          //     const compiledExpressionInfo = compileExpressionAsInfo(text);
          //     try {
          //       const compiledExpression = (
          //         new Function(
          //           'payload',
          //           `${compiledExpressionInfo.script}`
          //         ) as unknown as (payload?: any) => any
          //       ).bind(compiledExpressionInfo.bindings);
          //       const result = compiledExpression();

          //       // TODO : have this done by the compiler:
          //       if (result && result.frameUpdate) {
          //         result.frameUpdate = result.frameUpdate.bind(
          //           compiledExpressionInfo.bindings
          //         );

          //         /*
          //             test code:

          //             let a = 1;
          //             frameUpdate {
          //               setStartPoint(1,a);
          //               a=a+1;
          //             }

          //             TODO : implement deltaTime
          //             TODO : implement custom log function
          //         */

          //         const rafCallback = (deltaTime: number) => {
          //           result.frameUpdate(deltaTime);
          //           if (raf !== -1) {
          //             raf = window.requestAnimationFrame(rafCallback);
          //           }
          //         };
          //         raf = window.requestAnimationFrame(rafCallback);
          //       }
          //     } catch (error) {
          //       console.error('error compiling', error);
          //     }
          //   }, 100) as unknown as number;
          // },
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

        setupTasksInDropdown();
        if (getSelectedNode()) {
          setSelectNode(undefined);
        }
      }

      currentSelectedNode = selectedNodeInfo;
    });

    setupMarkupElement(
      `
      function Test() {
        return <div class="bg-black"><div class="p-4">test{2*3}</div></div>;
      }  
      return Test();  
    `,
      this.rootElement
    );

    registerCustomFunction('log', [], (message: any) => {
      console.log('log', message);
    });
  }
}

/*
const [getCount, setCount] = createSignal(0);
const [getValue, setValue] = createSignal('test');
createEffect(() => console.log('effect', getCount(), getValue()));
setCount(1);
setCount(2);
setValue('test2');
setCount(3);
*/
/*
setInterval(() => {
  setCount(getCount() + 1);
}, 1000);
*/

//const appElement = new AppElement();
