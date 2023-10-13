import {
  CanvasAppInstance,
  FlowNode,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  createCanvasApp,
  getSelectedNode,
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import { navBarButton } from '../consts/classes';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';

import { NodeInfo } from '../types/node-info';
import { getNodeTaskFactory } from '../node-task-registry/canvas-node-task-registry';
import {
  BaseComponent,
  Component,
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import {
  serializeElementsMap,
  exportFlowToJson,
} from '../storage/serialize-canvas';
import { downloadJSON } from '../utils/create-download-link';
import { FlowrunnerIndexedDbStorageProvider } from '../storage/indexeddb-storage-provider';
import { convertExpressionScriptToFlow } from '../script-to-flow/script-to-flow';

export interface NavbarComponentsProps {
  rootAppElement: HTMLElement;
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  storageProvider: FlowrunnerIndexedDbStorageProvider;
  initializeNodes: () => void;
  clearCanvas: () => void;
  animatePath: AnimatePathFunction<NodeInfo>;
  animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>;
  canvasUpdated: () => void;
  canvasApp: CanvasAppInstance<NodeInfo>;
  removeElement: (element: IElementNode<NodeInfo>) => void;
  importToCanvas: (
    nodesList: FlowNode<NodeInfo>[],
    canvasApp: ReturnType<typeof createCanvasApp<NodeInfo>>,
    canvasUpdated: () => void,
    containerNode?: IRectNodeComponent<NodeInfo>,
    nestedLevel?: number
  ) => void;
}

export class NavbarComponent extends Component<NavbarComponentsProps> {
  oldProps: NavbarComponentsProps | null = null;

  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  addNodeButton: HTMLButtonElement | null = null;
  centerButton: HTMLButtonElement | null = null;
  deleteButton: HTMLButtonElement | null = null;
  exportButton: HTMLButtonElement | null = null;
  importButton: HTMLButtonElement | null = null;
  importScriptButton: HTMLButtonElement | null = null;
  placeOnLayer1Button: HTMLButtonElement | null = null;
  placeOnLayer2Button: HTMLButtonElement | null = null;
  switchLayerButton: HTMLButtonElement | null = null;
  toggleDependencyConnections: HTMLButtonElement | null = null;
  showDependencyConnections = false;
  rootAppElement: HTMLElement | null = null;

  constructor(parent: BaseComponent | null, props: NavbarComponentsProps) {
    super(parent, props);
    this.template = createTemplate(
      `<div>
        <button class="${navBarButton} bg-blue-500 hover:bg-blue-700">Add Node</button>
        <button class="${navBarButton}">Center</button>
        <button class="${navBarButton}">Delete</button>
        <button class="${navBarButton}">Export</button>
        <button class="${navBarButton}">Import</button>
        <button class="${navBarButton}">Import script</button>
        <button class="${navBarButton}">L1</button>
        <button class="${navBarButton}">L2</button>
        <button class="${navBarButton}">Switch layer</button>
        <button class="${navBarButton}">Toggle deps</button>
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
        this.addNodeButton = this.element.firstChild as HTMLButtonElement;
        this.centerButton = this.addNodeButton
          ?.nextSibling as HTMLButtonElement;
        this.deleteButton = this.centerButton?.nextSibling as HTMLButtonElement;
        this.exportButton = this.deleteButton?.nextSibling as HTMLButtonElement;
        this.importButton = this.exportButton?.nextSibling as HTMLButtonElement;
        this.importScriptButton = this.importButton
          ?.nextSibling as HTMLButtonElement;
        this.placeOnLayer1Button = this.importScriptButton
          ?.nextSibling as HTMLButtonElement;
        this.placeOnLayer2Button = this.placeOnLayer1Button
          ?.nextSibling as HTMLButtonElement;
        this.switchLayerButton = this.placeOnLayer2Button
          ?.nextSibling as HTMLButtonElement;
        this.toggleDependencyConnections = this.switchLayerButton
          ?.nextSibling as HTMLButtonElement;

        this.addNodeButton.addEventListener('click', this.onClickAddNode);
        this.centerButton.addEventListener('click', this.onClickCenter);
        this.deleteButton.addEventListener('click', this.onClickDelete);
        this.exportButton.addEventListener('click', this.onClickExport);
        this.importButton.addEventListener('click', this.onClickImport);
        this.importScriptButton.addEventListener(
          'click',
          this.onClickImportScript
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

        this.renderList.push(
          this.addNodeButton,
          this.centerButton,
          this.deleteButton,
          this.exportButton,
          this.importButton,
          this.placeOnLayer1Button,
          this.placeOnLayer2Button,
          this.switchLayerButton,
          this.toggleDependencyConnections
        );
        // this.childRoot = this.element.firstChild as HTMLElement;
        // this.renderList.push(this.childRoot);
        this.rootElement.append(this.element);
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

  onClickAddNode = (event: Event) => {
    event.preventDefault();
    const nodeType = this.props.selectNodeType.value;
    let halfWidth = 0;
    let halfHeight = 0;
    if (this.props.canvasApp?.rootElement) {
      const box = this.props.canvasApp?.rootElement.getBoundingClientRect();
      halfWidth = box.width / 2;
      halfHeight = box.height / 2;
    }
    const startPos = this.props.canvasApp?.transformCameraSpaceToWorldSpace(
      halfWidth,
      halfHeight
    );
    const startX = (startPos?.x ?? Math.floor(Math.random() * 250)) - 100;
    const startY = (startPos?.y ?? Math.floor(Math.random() * 500)) - 150;

    const factory = getNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(this.props.canvasUpdated);

      const selectedNodeInfo = getSelectedNode();
      if (selectedNodeInfo) {
        let node = this.props.canvasApp?.elements?.get(
          selectedNodeInfo.id
        ) as INodeComponent<NodeInfo>;

        if (!node) {
          console.log('node not found in canvas'); // is the selected node in a container?
          //selectedNodeInfo.containerNode ...
          const canvasAppInstance = (
            selectedNodeInfo.containerNode?.nodeInfo as any
          )?.canvasAppInstance;
          node = canvasAppInstance?.elements?.get(
            selectedNodeInfo.id
          ) as INodeComponent<NodeInfo>;
          if (!node) {
            console.log('node not found in direct container');
            return;
          }
        }
        if (!node.nodeInfo?.taskType) {
          return;
        }
        const selectedNodeTaskFactory = getNodeTaskFactory(
          node.nodeInfo.taskType
        );
        if (node && selectedNodeTaskFactory) {
          const selectedNodeTask = selectedNodeTaskFactory(
            this.props.canvasUpdated
          );
          if (
            selectedNodeTask.isContainer &&
            (selectedNodeTask.childNodeTasks ?? []).indexOf(nodeType) >= 0
          ) {
            nodeTask.createVisualNode(
              node.nodeInfo.canvasAppInstance!,
              50,
              50,
              undefined,
              undefined,
              node as IRectNodeComponent<NodeInfo>,
              undefined,
              undefined,
              (node.nestedLevel ?? 0) + 1
            );

            return;
          } else if (selectedNodeTask.isContainer) {
            return;
          }
        }
      }
      //factory.createVisualNode(props.canvasApp, startX, startY);
      //} else if (factory) {
      //const nodeTask = factory(props.canvasUpdated);
      const node = nodeTask.createVisualNode(
        this.props.canvasApp,
        startX,
        startY
      );
      if (node && node.nodeInfo) {
        node.nodeInfo.taskType = nodeType;
      }
    }

    return false;
  };

  onClickCenter = (event: Event) => {
    event.preventDefault();
    this.props.canvasApp?.centerCamera();
    return false;
  };

  getSelectedNodeInfo = () => {
    const nodeElementId = getSelectedNode();
    if (nodeElementId) {
      const node = nodeElementId.containerNode
        ? ((
            nodeElementId?.containerNode as unknown as IRectNodeComponent<NodeInfo>
          )?.nodeInfo?.canvasAppInstance?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>)
        : (this.props.canvasApp?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>);

      if (node) {
        return { selectedNodeInfo: nodeElementId, node };
      }
    }
    return false;
  };

  onClickDelete = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();

    if (nodeInfo) {
      const node = nodeInfo.node;
      if (node.nodeType === NodeType.Connection) {
        // Remove the connection from the start and end nodes
        const connection = node as IConnectionNodeComponent<NodeInfo>;
        if (connection.startNode) {
          connection.startNode.connections =
            connection.startNode?.connections?.filter(
              (c) => c.id !== connection.id
            );
        }
        if (connection.endNode) {
          connection.endNode.connections =
            connection.endNode?.connections?.filter(
              (c) => c.id !== connection.id
            );
        }
      } else if (node.nodeType === NodeType.Shape) {
        //does the shape have connections? yes.. remove the link between the connection and the node
        // OR .. remove the connection as well !?
        const shapeNode = node as IRectNodeComponent<NodeInfo>;
        if (shapeNode.connections) {
          shapeNode.connections.forEach((c) => {
            const connection = this.props.canvasApp?.elements?.get(
              c.id
            ) as IConnectionNodeComponent<NodeInfo>;
            if (connection) {
              if (connection.startNode?.id === node.id) {
                connection.startNode = undefined;
                connection.startNodeThumb = undefined;
              }
              if (connection.endNode?.id === node.id) {
                connection.endNode = undefined;
                connection.endNodeThumb = undefined;
              }
            }
          });
        }
      } else {
        return;
      }

      if (nodeInfo.selectedNodeInfo.containerNode) {
        (
          nodeInfo?.selectedNodeInfo
            ?.containerNode as unknown as IRectNodeComponent<NodeInfo>
        )?.nodeInfo?.canvasAppInstance?.elements?.delete(
          nodeInfo.selectedNodeInfo.id
        );
        this.props.removeElement(
          node
          // (
          //   nodeElementId.containerNode as unknown as IRectNodeComponent<NodeInfo>
          // ).nodeInfo.canvasAppInstance
        );
      } else {
        this.props.removeElement(node);
        this.props.canvasApp?.elements?.delete(nodeInfo.selectedNodeInfo.id);
      }
      setSelectNode(undefined);
      this.props.canvasUpdated();
    }

    return false;
  };

  onClickExport = (event: Event) => {
    event.preventDefault();
    const data = serializeElementsMap(this.props.canvasApp.elements);
    console.log('EXPORT DATA', exportFlowToJson('1234', data));
    downloadJSON(exportFlowToJson('1234', data), 'vps-flow.json');
    return false;
  };

  onClickImport = (event: Event) => {
    event.preventDefault();
    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.type = 'file';
    input.setAttribute('accept', 'application/JSON');
    input.onchange = () => {
      const files = Array.from(input.files);
      if (files && files.length > 0) {
        // const file = URL.createObjectURL(files[0]);
        // console.log(file);

        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if (event && event.target && event.target.result) {
            const data = JSON.parse(event.target.result.toString());
            console.log('IMPORT DATA', data);
            this.props.clearCanvas();
            this.props.importToCanvas(
              data.flows.flow.nodes,
              this.props.canvasApp,
              this.props.canvasUpdated,
              undefined,
              0
            );
            this.props.canvasApp.centerCamera();
            this.props.initializeNodes();
          }
        });
        reader.readAsBinaryString(files[0]);
      }
    };
    input.click();
    return false;
  };

  onClickImportScript = (event: Event) => {
    event.preventDefault();

    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.type = 'file';
    input.setAttribute('accept', '.es');
    input.onchange = () => {
      const files = Array.from(input.files);
      if (files && files.length > 0) {
        // const file = URL.createObjectURL(files[0]);
        // console.log(file);

        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if (event && event.target && event.target.result) {
            const data = event.target.result.toString();
            const nodeList = convertExpressionScriptToFlow(data);
            if (nodeList) {
              const flow = {
                schemaType: 'flow',
                schemaVersion: '0.0.1',
                id: '1234',
                flows: {
                  flow: {
                    flowType: 'flow',
                    nodes: nodeList,
                  },
                },
              };
              this.props.clearCanvas();
              this.props.importToCanvas(
                flow.flows.flow.nodes,
                this.props.canvasApp,
                this.props.canvasUpdated,
                undefined,
                0
              );
              this.props.canvasApp.centerCamera();
              this.props.initializeNodes();
            }
          }
        });
        reader.readAsBinaryString(files[0]);
      }
    };
    input.click();

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
    this.showDependencyConnections = !this.showDependencyConnections;
    if (this.showDependencyConnections) {
      this.props.canvasApp?.elements.forEach((element) => {
        if (element.nodeInfo?.getDependencies) {
          const dependencies = element.nodeInfo.getDependencies();
          console.log('getDependencies', dependencies);
          if (dependencies.length > 0) {
            dependencies.forEach((dependency) => {
              const startNode = this.props.canvasApp?.elements?.get(
                dependency.startNodeId
              ) as IRectNodeComponent<NodeInfo>;
              const endNode = this.props.canvasApp?.elements?.get(
                dependency.endNodeId
              ) as IRectNodeComponent<NodeInfo>;

              if (startNode && endNode) {
                const connection = this.props.canvasApp?.createLine(
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
                  connection.nodeComponent.startNode = startNode;
                  connection.nodeComponent.endNode = endNode;

                  if (startNode) {
                    startNode.connections?.push(connection.nodeComponent);
                  }
                  if (endNode) {
                    endNode.connections?.push(connection.nodeComponent);
                  }

                  connection.nodeComponent.isAnnotationConnection = true;
                  connection.nodeComponent.layer = 2;
                  connection.nodeComponent.update();
                }
              }
            });
          }
        }
      });
    } else {
      this.props.canvasApp?.elements.forEach((element) => {
        const node = element as INodeComponent<NodeInfo>;
        if (node.nodeType === NodeType.Connection) {
          const connection = node as IConnectionNodeComponent<NodeInfo>;
          if (connection.isAnnotationConnection) {
            this.props.removeElement(node);
            this.props.canvasApp?.elements?.delete(element.id);
          }
        }
      });
    }

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

export const NavbarComponents = (props: NavbarComponentsProps) => {
  new NavbarComponent(null, {
    initializeNodes: props.initializeNodes,
    storageProvider: props.storageProvider,
    clearCanvas: props.clearCanvas,
    rootElement: props.rootElement,
    rootAppElement: props.rootAppElement,
    selectNodeType: props.selectNodeType,
    animatePath: props.animatePath,
    animatePathFromThumb: props.animatePathFromThumb,
    canvasUpdated: props.canvasUpdated,
    canvasApp: props.canvasApp,
    removeElement: props.removeElement,
    importToCanvas: props.importToCanvas,
  });
};
