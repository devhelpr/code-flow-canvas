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
import { AppElement } from './app.element';

export class FlowAppElement extends AppElement<NodeInfo> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  storageProvider: FlowrunnerIndexedDbStorageProvider | undefined = undefined;

  pathExecutions: RunNodeResult<NodeInfo>[][] = [];
  scopeNodeDomElement: HTMLElement | undefined = undefined;

  currentPathUnderInspection: RunNodeResult<NodeInfo>[] | undefined = undefined;

  formElement: INodeComponent<NodeInfo> | undefined = undefined;
  selectedNodeLabel: IElementNode<NodeInfo> | undefined = undefined;

  testCircle: IElementNode<NodeInfo> | undefined = undefined;
  message: IElementNode<NodeInfo> | undefined = undefined;
  messageText: IElementNode<NodeInfo> | undefined = undefined;

  currentPathExecution: RunNodeResult<NodeInfo>[] | undefined = undefined;

  constructor(appRootSelector: string) {
    super(appRootSelector);
    if (!this.rootElement) {
      return;
    }
    if (!this.canvasApp) {
      return;
    }

    const animatePath = (
      node: IRectNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: (
        nodeId: string,
        node: IRectNodeComponent<NodeInfo>,
        input: string | any[],
        connection: IConnectionNodeComponent<NodeInfo>
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
        input: string | any[],
        connection: IConnectionNodeComponent<NodeInfo>
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
    const canvasUpdated = () => {
      if (this.isStoring) {
        return;
      }
      store();
    };
    this.canvasApp.setOnCanvasUpdated(() => {
      canvasUpdated();
    });

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
              nestedLevel?: number,
              getNodeTaskFactory?: (name: string) => any
            ) => {
              this.isStoring = true;
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel,
                getNodeTaskFactory
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
              nestedLevel?: number,
              getNodeTaskFactory?: (name: string) => any
            ) => {
              this.isStoring = true;
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel,
                getNodeTaskFactory
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
            if (!this.canvasApp) {
              throw new Error('canvasApp not defined');
            }
            importToCanvas(
              flow.flows.flow.nodes,
              this.canvasApp,
              canvasUpdated,
              undefined,
              0,
              getNodeTaskFactory
            );
            this.canvasApp.centerCamera();
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
        if (!nodesList) {
          return;
        }
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

    const setIsStoring = (isStoring: boolean) => {
      this.isStoring = isStoring;
    };

    this.canvasApp.setOnCanvasClick((x, y) => {
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
      if (!this.canvasApp) {
        return;
      }
      return serializeElementsMap(this.canvasApp.elements);
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
        const nodeType = (selectNodeType?.domElement as HTMLSelectElement)
          .value;
        let isPreviouslySelectedNodeTypeInDropdown = false;
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
          if (nodeTask === nodeType) {
            isPreviouslySelectedNodeTypeInDropdown = true;
          }
          createOption(
            selectNodeType.domElement as HTMLSelectElement,
            nodeTask,
            nodeTask
          );
        });
        if (isPreviouslySelectedNodeTypeInDropdown) {
          (selectNodeType?.domElement as HTMLSelectElement).value = nodeType;
        }
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

    this.testCircle = createElement(
      'div',
      {
        class: `absolute bg-blue-500 top-0 left-0 z-[1000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded hidden`,
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
        class: `flex text-center truncate min-w-0 overflow-hidden z-[1010] pointer-events-auto origin-center px-2 bg-blue-500 text-black absolute top-[-100px] z-[1000] left-[-60px] items-center justify-center w-[80px] h-[100px] overflow-hidden hidden`,
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
        this.canvasApp?.deleteElementFromNode(
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

        if (
          ((nodeInfo as any)?.formElements ?? []).length <= 1 &&
          !(nodeInfo.showFormOnlyInPopup && nodeInfo.formElements.length >= 1)
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

        setupTasksInDropdown();
        if (getSelectedNode()) {
          setSelectNode(undefined);
        }
      }

      currentSelectedNode = selectedNodeInfo;
    });

    // setupMarkupElement(
    //   `
    //   function Test() {
    //     return <div class="bg-black"><div class="p-4">test{2*3}</div></div>;
    //   }
    //   return Test();
    // `,
    //   this.rootElement
    // );

    registerCustomFunction('log', [], (message: any) => {
      console.log('log', message);
    });
  }

  onShouldPositionPopup = (node: IRectNodeComponent<NodeInfo>) => {
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

  onPreRemoveElement = (element: IElementNode<NodeInfo>) => {
    if (element.nodeInfo?.delete) {
      element.nodeInfo.delete();
    }
  };

  onPreclearCanvas = () => {
    this.clearPathExecution();
    this.currentPathUnderInspection = undefined;
    this.pathExecutions = [];
  };

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
}
