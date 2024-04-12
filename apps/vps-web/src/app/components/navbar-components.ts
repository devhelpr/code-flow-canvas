import {
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  getSelectedNode,
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import {
  navBarButton,
  navBarIconButton,
  navBarIconButtonInnerElement,
  navBarPrimaryIconButton,
} from '../consts/classes';

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
  serializeCompositions,
} from '../storage/serialize-canvas';
import { downloadJSON } from '../utils/create-download-link';
import { convertExpressionScriptToFlow } from '../script-to-flow/script-to-flow';
import { AppNavComponentsProps } from '../component-interface/app-nav-component';
import { isNodeTaskComposition } from '../node-task-registry/composition-utils';
import {
  addClassesHTMLElement,
  removeClassesHTMLElement,
} from '../utils/add-remove-classes';

export class NavbarComponent extends Component<
  AppNavComponentsProps<NodeInfo>
> {
  oldProps: AppNavComponentsProps<NodeInfo> | null = null;

  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  addNodeButton: HTMLButtonElement | null = null;
  centerButton: HTMLButtonElement | null = null;
  deleteButton: HTMLButtonElement | null = null;
  exportButton: HTMLButtonElement | null = null;
  importButton: HTMLButtonElement | null = null;
  //importScriptButton: HTMLButtonElement | null = null;
  selectExampleFlow: HTMLSelectElement | null = null;
  rootAppElement: HTMLElement | null = null;

  constructor(
    parent: BaseComponent | null,
    props: AppNavComponentsProps<NodeInfo>
  ) {
    super(parent, props);

    // <button class="${navBarButton}">Import script</button>

    this.template = createTemplate(
      `<div class="inline-flex items-center content-center">
        <button class="${navBarPrimaryIconButton}"><span class="${navBarIconButtonInnerElement} icon-add"></span></button>
        <button class="${navBarIconButton}"><span class="${navBarIconButtonInnerElement} icon-fit_screen"></span></button>
        <button class="${navBarIconButton}"><span class="${navBarIconButtonInnerElement} icon-delete"></span></button>
        <button class="${navBarButton}">Save</button>
        <button class="${navBarButton}">Load</button>
        <select type="select" name="example-flows" class="p-2 m-2 relative max-w-[220px]">
          <option value="">Select example flow</option>
          <option value="counter-flow.json">Counter</option>
          <option value="simple-state-machine.json">Simple statemachine</option>
          <option value="simple-state-machine-image-brightness.json">Simple state machine with image and brightness</option>
          <option value="parallel-merge-flow.json">Parallel and merge</option>
          <option value="fibonacci-flow.json">Fibonacci</option>
          <option value="quicksort-flow.json">Quicksort</option>    
        </select>
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
        this.selectExampleFlow = this.importButton
          ?.nextSibling as HTMLSelectElement;
        // this.importScriptButton = this.importButton
        //   ?.nextSibling as HTMLButtonElement;

        this.addNodeButton.addEventListener('click', this.onClickAddNode);
        this.centerButton.addEventListener('click', this.onClickCenter);
        this.deleteButton.addEventListener('click', this.onClickDelete);
        this.exportButton.addEventListener('click', this.onClickExport);
        this.importButton.addEventListener('click', this.onClickImport);
        this.selectExampleFlow.addEventListener(
          'change',
          this.onClickImportExample
        );

        // this.importScriptButton.addEventListener(
        //   'click',
        //   this.onClickImportScript
        // );

        this.renderList.push(
          this.addNodeButton,
          this.centerButton,
          this.deleteButton,
          this.exportButton,
          this.importButton,
          this.selectExampleFlow
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
    const canvasApp = this.props.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    console.log('onClickAddNode flow-app');
    this.props.getCanvasApp()?.resetNodeTransform();
    const nodeType = this.props.selectNodeType.value;
    if (!nodeType) {
      console.log('onClickAddNode: no nodeType selected');
    }
    const nodeInfo = isNodeTaskComposition(nodeType)
      ? { isComposition: true }
      : undefined;

    let halfWidth = 0;
    let halfHeight = 0;
    if (this.props.getCanvasApp()?.rootElement) {
      const box = canvasApp.rootElement.getBoundingClientRect();
      halfWidth = box.width / 2;
      halfHeight = box.height / 2;
    }
    const startPos = this.props
      .getCanvasApp()
      ?.transformCameraSpaceToWorldSpace(halfWidth, halfHeight);
    const startX = (startPos?.x ?? Math.floor(Math.random() * 250)) - 100;
    const startY = (startPos?.y ?? Math.floor(Math.random() * 500)) - 150;

    const factory = getNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(this.props.canvasUpdated, canvasApp.theme);

      const selectedNodeInfo = getSelectedNode();
      if (selectedNodeInfo) {
        let node = this.props
          .getCanvasApp()
          ?.elements?.get(selectedNodeInfo.id) as INodeComponent<NodeInfo>;

        if (!node) {
          console.log('node not found in canvas');
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
        if (node.nodeInfo?.taskType) {
          const selectedNodeTaskFactory = getNodeTaskFactory(
            node.nodeInfo.taskType
          );
          if (node && selectedNodeTaskFactory) {
            const selectedNodeTask = selectedNodeTaskFactory(
              this.props.canvasUpdated
            );
            if (
              node.nodeInfo.canvasAppInstance &&
              selectedNodeTask.isContainer &&
              (selectedNodeTask.childNodeTasks ?? []).indexOf(nodeType) >= 0
            ) {
              nodeTask.createVisualNode(
                node.nodeInfo.canvasAppInstance,
                50,
                50,
                undefined,
                undefined,
                node as IRectNodeComponent<NodeInfo>,
                undefined,
                undefined,
                (node.nestedLevel ?? 0) + 1,
                nodeInfo
              );

              return;
            } else if (selectedNodeTask.isContainer) {
              console.log('onClickAddNode: selectedNodeTask isContainer');
              return;
            }
          }
        }
      }

      const node = nodeTask.createVisualNode(
        canvasApp,
        startX,
        startY,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        nodeInfo
      );
      if (node && node.nodeInfo) {
        node.nodeInfo.taskType = nodeType;
      }
    }

    return false;
  };

  onClickCenter = (event: Event) => {
    event.preventDefault();
    this.props.getCanvasApp()?.centerCamera();
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
        : (this.props
            .getCanvasApp()
            ?.elements?.get(nodeElementId.id) as INodeComponent<NodeInfo>);

      if (node) {
        return { selectedNodeInfo: nodeElementId, node };
      }
    }
    return false;
  };

  onClickDelete = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();
    this.props.getCanvasApp()?.resetNodeTransform();
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
            const connection = this.props
              .getCanvasApp()
              ?.elements?.get(c.id) as IConnectionNodeComponent<NodeInfo>;
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
        )?.nodeInfo?.canvasAppInstance?.resetNodeTransform();
        (
          nodeInfo?.selectedNodeInfo
            ?.containerNode as unknown as IRectNodeComponent<NodeInfo>
        )?.nodeInfo?.canvasAppInstance?.deleteElement(
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
        this.props.getCanvasApp()?.deleteElement(nodeInfo.selectedNodeInfo.id);
      }
      setSelectNode(undefined);
      this.props.canvasUpdated();
    }

    return false;
  };

  onClickExport = (event: Event) => {
    event.preventDefault();
    const canvasApp = this.props.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    const data = serializeElementsMap(canvasApp.elements);
    const compositions = serializeCompositions<NodeInfo>(
      canvasApp.compositons.getAllCompositions()
    );
    console.log(
      'EXPORT DATA',
      exportFlowToJson<NodeInfo>('1234', data, compositions)
    );
    downloadJSON(
      exportFlowToJson<NodeInfo>('1234', data, compositions),
      'vps-flow.json'
    );
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
          const canvasApp = this.props.getCanvasApp();
          if (!canvasApp) {
            return;
          }
          if (event && event.target && event.target.result) {
            const data = JSON.parse(event.target.result.toString());
            console.log('IMPORT DATA', data);
            this.props.clearCanvas();
            this.props.importToCanvas(
              data.flows.flow.nodes,
              canvasApp,
              this.props.canvasUpdated,
              undefined,
              0,
              getNodeTaskFactory,
              data.compositions
            );
            this.props.getCanvasApp()?.centerCamera();
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
            const canvasApp = this.props.getCanvasApp();
            if (!canvasApp) {
              return;
            }
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
                canvasApp,
                this.props.canvasUpdated,
                undefined,
                0
              );
              canvasApp.centerCamera();
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
  onClickImportExample = (event: Event) => {
    event.preventDefault();
    const example = (event.target as HTMLSelectElement).value;
    if (example && confirm(`Are you sure you want to load ${example}?`)) {
      fetch(`/example-flows/${example}`)
        .then((response) => response.json())
        .then((data) => {
          const canvasApp = this.props.getCanvasApp();
          if (!canvasApp) {
            return;
          }
          this.props.clearCanvas();
          this.props.importToCanvas(
            data.flows.flow.nodes,
            canvasApp,
            this.props.canvasUpdated,
            undefined,
            0,
            getNodeTaskFactory,
            data.compositions
          );
          canvasApp.centerCamera();
          this.props.initializeNodes();
        });
    }
    return false;
  };

  onEditComposition() {
    addClassesHTMLElement(this.exportButton, ['hidden']);
    addClassesHTMLElement(this.importButton, ['hidden']);
    addClassesHTMLElement(this.selectExampleFlow, ['hidden']);
  }

  onExitEditComposition() {
    removeClassesHTMLElement(this.exportButton, ['hidden']);
    removeClassesHTMLElement(this.importButton, ['hidden']);
    removeClassesHTMLElement(this.selectExampleFlow, ['hidden']);
  }

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

export const NavbarComponents = (props: AppNavComponentsProps<NodeInfo>) => {
  return new NavbarComponent(null, {
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
  });
};
