import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
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

export interface NavbarComponentsProps {
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  animatePath: AnimatePathFunction<NodeInfo>;
  animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>;
  canvasUpdated: () => void;
  canvasApp: CanvasAppInstance;
  removeElement: (element: IElementNode<NodeInfo>) => void;
}

export interface Props {
  rootElement: HTMLElement;
  selectNodeType: HTMLSelectElement;
  animatePath: AnimatePathFunction<NodeInfo>;
  animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>;
  canvasUpdated: () => void;
  canvasApp: CanvasAppInstance;
  removeElement: (
    element: IElementNode<NodeInfo>,
    canvasAppInstance?: CanvasAppInstance
  ) => void;
}

export class NavbarComponent extends Component<Props> {
  oldProps: Props | null = null;

  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  addNodeButton: HTMLButtonElement | null = null;
  centerButton: HTMLButtonElement | null = null;
  deleteButton: HTMLButtonElement | null = null;

  constructor(parent: BaseComponent | null, props: Props) {
    super(parent, props);
    this.template = createTemplate(
      `<div>
        <button class="${navBarButton} bg-blue-500 hover:bg-blue-700">Add Node</button>
        <button class="${navBarButton}">Center</button>
        <button class="${navBarButton}">Delete</button>
        <children></children>
      </div>`
    );
    this.rootElement = props.rootElement;
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

        this.addNodeButton.addEventListener('click', this.onClickAddNode);
        this.centerButton.addEventListener('click', this.onClickCenter);
        this.deleteButton.addEventListener('click', this.onClickDelete);

        this.renderList.push(
          this.addNodeButton,
          this.centerButton,
          this.deleteButton
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

      const nodeElementId = getSelectedNode();
      if (nodeElementId) {
        const node = this.props.canvasApp?.elements?.get(
          nodeElementId.id
        ) as INodeComponent<NodeInfo>;

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
              node.nodeInfo.canvasAppInstance,
              50,
              50,
              undefined,
              undefined,
              node as IRectNodeComponent<NodeInfo>
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
      if (node) {
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

  onClickDelete = (event: Event) => {
    event.preventDefault();
    const nodeElementId = getSelectedNode();
    if (nodeElementId) {
      const node = nodeElementId.containerNode
        ? ((
            nodeElementId.containerNode as unknown as IRectNodeComponent<NodeInfo>
          ).nodeInfo.canvasAppInstance.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>)
        : (this.props.canvasApp?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>);

      if (node) {
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

        if (nodeElementId.containerNode) {
          (
            nodeElementId.containerNode as unknown as IRectNodeComponent<NodeInfo>
          ).nodeInfo.canvasAppInstance.elements?.delete(nodeElementId.id);
          this.props.removeElement(
            node,
            (
              nodeElementId.containerNode as unknown as IRectNodeComponent<NodeInfo>
            ).nodeInfo.canvasAppInstance
          );
        } else {
          this.props.removeElement(node);
          this.props.canvasApp?.elements?.delete(nodeElementId.id);
        }
        setSelectNode(undefined);
        this.props.canvasUpdated();
      }
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
    rootElement: props.rootElement,
    selectNodeType: props.selectNodeType,
    animatePath: props.animatePath,
    animatePathFromThumb: props.animatePathFromThumb,
    canvasUpdated: props.canvasUpdated,
    canvasApp: props.canvasApp,
    removeElement: props.removeElement,
  });
};
