import { getCamera, transformCameraSpaceToWorldSpace } from '../camera';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../interaction-state-machine';
import {
  IDOMElement,
  IElementNode,
  INodeComponent,
  IPointerDownResult,
  IRectNodeComponent,
} from '../interfaces';
import { BaseNodeInfo } from '../types/base-node-info';
import { createElement } from '../utils';
import { getPointerPos } from '../utils/pointer-pos';
import { hideElement, showElement } from '../utils/show-hide-element';
import { getNodeTransformerCssClasses } from './css-classes/node-transformer-css-classes';
import { showMetaViewDialog } from './meta-view-dialog/meta-view-dialog';

/*
    Class that:
    - select node
    - can transform(resize) .. depends on node.canBeResized
    - move nodes (also the downstream and/or upstream nodes) .. depends on node.isStaticPosition

    TODO:
    - be able to resize via the sides of the node
    - visibilty of moveNodePanel
*/

const transformNodeList: NodeTransformer<BaseNodeInfo>[] = [];

export class NodeTransformer<T extends BaseNodeInfo> {
  private canvas: IElementNode<T> | undefined;
  private rootElement: HTMLElement;
  protected cssClasses: ReturnType<typeof getNodeTransformerCssClasses>;
  constructor(
    canvas: IElementNode<T>,
    rootElement: HTMLElement,
    interactionStateMachine: InteractionStateMachine<T>
  ) {
    this.cssClasses = getNodeTransformerCssClasses();
    this.id = crypto.randomUUID();
    transformNodeList.push(this as unknown as NodeTransformer<BaseNodeInfo>);
    this.rootElement = rootElement;
    this.canvas = canvas;
    this.interactionStateMachine = interactionStateMachine;
    this.nodeTransformElement = createElement(
      'div',
      {
        id: 'node-transformer',
        class: this.cssClasses.nodeTransformerClasses,
      },
      canvas.domElement
    );
    (this.nodeTransformElement as INodeComponent<T>).update = (
      _target?: INodeComponent<T> | undefined,
      _x?: number | undefined,
      _y?: number | undefined,
      _initiator?: INodeComponent<T> | undefined
    ) => {
      console.log('update node-transformer');
      return true;
    };

    this.leftTop = createElement(
      'div',
      {
        class: `${this.cssClasses.leftTopClasses} ${this.cssClasses.pointerEventsAuto} ${this.cssClasses.resizeThumbSize} ${this.cssClasses.transformPosTL}`,
        ['data-ResizeMode']: 'left-top',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement?.domElement
    );

    this.rightTop = createElement(
      'div',
      {
        class: `${this.cssClasses.rightTopClasses} ${this.cssClasses.pointerEventsAuto} ${this.cssClasses.resizeThumbSize} ${this.cssClasses.transformPosTR}`,
        ['data-ResizeMode']: 'right-top',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement?.domElement
    );

    this.leftBottom = createElement(
      'div',
      {
        class: `${this.cssClasses.leftBottomClasses} ${this.cssClasses.pointerEventsAuto} ${this.cssClasses.resizeThumbSize} ${this.cssClasses.transformPosBL}`,
        ['data-ResizeMode']: 'left-bottom',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement?.domElement
    );

    this.rightBottom = createElement(
      'div',
      {
        class: `${this.cssClasses.rightBottomClasses} ${this.cssClasses.pointerEventsAuto} ${this.cssClasses.resizeThumbSize} ${this.cssClasses.transformPosBR}`,
        ['data-ResizeMode']: 'right-bottom',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement?.domElement
    );

    this.moveNodesPanel = createElement(
      'div',
      {
        class: this.cssClasses.moveNodesPanelClasses,
      },
      this.nodeTransformElement?.domElement
    );
    if (!this.moveNodesPanel) {
      return;
    }

    this.downstreamNodesMover = createElement(
      'div',
      {
        class: `${this.cssClasses.downstreamNodesMoverClasses} ${this.cssClasses.pointerEventsAuto}`,
        ['data-ResizeMode']: 'move-downstream-nodes',
        pointerdown: this.onPointerDown,
      },
      this.moveNodesPanel.domElement
    );

    this.metaInfoInspector = createElement(
      'div',
      {
        class: `${this.cssClasses.pointerEventsAuto} ${this.cssClasses.metaInfoInspectorClasses}`,
        click: () => {
          if (this.attachedNode) {
            showMetaViewDialog(
              this.attachedNode as unknown as IRectNodeComponent<BaseNodeInfo>
            );
          }
        },
      },
      this.moveNodesPanel.domElement
    );

    this.upstreamNodesMover = createElement(
      'div',
      {
        class: `${this.cssClasses.pointerEventsAuto} ${this.cssClasses.upstreamNodesMoverClasses}`,
        ['data-ResizeMode']: 'move-upstream-nodes',
        pointerdown: this.onPointerDown,
      },
      this.moveNodesPanel.domElement
    );
  }
  destroy() {
    const index = transformNodeList.findIndex((item) => this.id === item.id);
    if (index > -1) {
      transformNodeList.slice(index, 1);
    }
  }

  id = '';

  nodeTransformElement: IDOMElement | undefined;
  interactionStateMachine: InteractionStateMachine<T> | undefined;
  leftTop: IDOMElement | undefined;
  rightTop: IDOMElement | undefined;
  leftBottom: IDOMElement | undefined;
  rightBottom: IDOMElement | undefined;

  moveNodesPanel: IDOMElement | undefined;

  upstreamNodesMover: IDOMElement | undefined;
  downstreamNodesMover: IDOMElement | undefined;
  inividualNodeMover: IDOMElement | undefined;

  metaInfoInspector: IDOMElement | undefined;

  previouslyAttachedNode: IRectNodeComponent<T> | undefined;
  attachedNode: IRectNodeComponent<T> | undefined;

  attachNode(node: IRectNodeComponent<T>) {
    if (!this.attachedNode || this.attachedNode.id !== node.id) {
      this.previouslyAttachedNode = this.attachedNode;
    }
    this.attachedNode = node;

    if (node.nodeInfo?.meta && node.nodeInfo?.meta.length > 0) {
      (this.metaInfoInspector?.domElement as HTMLElement).classList.remove(
        this.cssClasses.hidden
      );
    } else {
      (this.metaInfoInspector?.domElement as HTMLElement).classList.add(
        this.cssClasses.hidden
      );
    }
    if (node.thumbs?.length === 0) {
      hideElement(this.upstreamNodesMover);
      hideElement(this.downstreamNodesMover);
    } else {
      showElement(this.upstreamNodesMover);
      showElement(this.downstreamNodesMover);
    }
    this.detachRegisteredNodes();

    this.visibilityResizeControls(node.canBeResized ?? true);
    const transformerDomElement = this.nodeTransformElement
      ?.domElement as HTMLElement;

    transformerDomElement.style.width = `${(node.width ?? 0) + 2}px`;
    transformerDomElement.style.height = `${(node.height ?? 0) + 2}px`;
    transformerDomElement.style.transform = `translate(${node.x - 1}px, ${
      node.y - 1
    }px)`;

    transformerDomElement.classList.remove(this.cssClasses.hidden);
  }

  updateCamera() {
    if (this.attachedNode) {
      this.attachNode(this.attachedNode);
      const camera = getCamera();
      const reversScale = 1 / Math.sqrt(camera.scale);

      const transformerDomElement = this.nodeTransformElement
        ?.domElement as HTMLElement;
      const fullWidth = transformerDomElement.clientWidth;
      if (this.rightBottom?.domElement) {
        const domElement = this.rightBottom?.domElement as HTMLElement;
        domElement.style.scale = `${reversScale}`;
      }
      if (this.leftTop?.domElement) {
        const domElement = this.leftTop?.domElement as HTMLElement;
        domElement.style.scale = `${reversScale}`;
      }
      if (this.leftBottom?.domElement) {
        const domElement = this.leftBottom?.domElement as HTMLElement;
        domElement.style.scale = `${reversScale}`;
      }
      if (this.rightTop?.domElement) {
        const domElement = this.rightTop?.domElement as HTMLElement;
        domElement.style.scale = `${reversScale}`;
      }
      if (this.moveNodesPanel?.domElement) {
        const domElement = this.moveNodesPanel?.domElement as HTMLElement;
        const width = domElement.clientWidth;
        const halfWidth = width / 2;
        domElement.style.transformOrigin = '0px 0px';
        domElement.style.scale = `${reversScale}`;
        domElement.style.transform = `translateX(${-halfWidth}px)`;
        domElement.style.left = `calc(${fullWidth / 2}px`;
        domElement.style.bottom = `calc(-${48}px)`;
      }

      (
        this.nodeTransformElement?.domElement as HTMLElement
      ).style.borderWidth = `${reversScale}px`;

      // (
      //   this.nodeTransformElement?.domElement as HTMLElement
      // ).style.borderRadius = `${reversScale * 10}px`;
    }
  }

  detachNode(isVisited = false) {
    this.previouslyAttachedNode = this.attachedNode;
    this.attachedNode = undefined;
    (this.metaInfoInspector?.domElement as HTMLElement).classList.add(
      this.cssClasses.hidden
    );
    (this.nodeTransformElement?.domElement as HTMLElement).classList.add(
      this.cssClasses.hidden
    );
    if (isVisited) {
      return;
    }
    this.detachRegisteredNodes();
  }

  private detachRegisteredNodes() {
    transformNodeList.forEach((transformer) => {
      if (transformer.id !== this.id && transformer.detachNode) {
        transformer.detachNode(true);
      }
    });
  }

  visibilityResizeControls(visible: boolean) {
    const addClass = visible ? 'block' : 'hidden';
    const removeClass = visible ? 'hidden' : 'block';
    (this.leftTop?.domElement as HTMLElement).classList.add(addClass);
    (this.leftTop?.domElement as HTMLElement).classList.remove(removeClass);

    (this.rightTop?.domElement as HTMLElement).classList.add(addClass);
    (this.rightTop?.domElement as HTMLElement).classList.remove(removeClass);

    (this.leftBottom?.domElement as HTMLElement).classList.add(addClass);
    (this.leftBottom?.domElement as HTMLElement).classList.remove(removeClass);

    (this.rightBottom?.domElement as HTMLElement).classList.add(addClass);
    (this.rightBottom?.domElement as HTMLElement).classList.remove(removeClass);
  }

  onPointerOver = (_event: PointerEvent) => {
    //
  };

  onPointerLeave = (_event: PointerEvent) => {
    //this.detachNode();
  };

  resizeMode = '';
  orgX = 0;
  orgY = 0;
  orgWidth = 0;
  orgHeight = 0;
  resizeSameWidthAndHeight = false;
  onPointerDown = (event: PointerEvent) => {
    if (this.interactionStateMachine && this.attachedNode && this.canvas) {
      console.log(
        'pointerDown nodetransformer',
        (event.target as HTMLElement).getAttribute('data-ResizeMode')
      );

      this.attachedNode.isSettingSize = false;

      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        event
      );
      this.resizeSameWidthAndHeight = event.shiftKey;
      (this.nodeTransformElement?.domElement as HTMLElement).classList.add(
        this.cssClasses.pointerEventsAuto
      );
      (this.nodeTransformElement?.domElement as HTMLElement).classList.remove(
        this.cssClasses.noPointerEvents
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );

      this.orgX = this.attachedNode.x;
      this.orgY = this.attachedNode.y;
      this.orgWidth = this.attachedNode.width ?? 0;
      this.orgHeight = this.attachedNode.height ?? 0;

      this.resizeMode =
        (event.target as HTMLElement).getAttribute('data-ResizeMode') ?? '';

      if (this.resizeMode == 'move-upstream-nodes') {
        this.moveNodes = [];
        this.orgPositionMoveNodes = {};
        this.getUpstreamNodes(this.attachedNode);
        this.moveNodes.forEach((node) => {
          this.orgPositionMoveNodes[node.id] = {
            x: node.x,
            y: node.y,
          };
        });
      } else if (this.resizeMode === 'move-downstream-nodes') {
        this.moveNodes = [];
        this.orgPositionMoveNodes = {};
        this.getDownstreamNodes(this.attachedNode);
        this.moveNodes.forEach((node) => {
          this.orgPositionMoveNodes[node.id] = {
            x: node.x,
            y: node.y,
          };
        });
      }
      this.interactionStateMachine.interactionEventState(
        InteractionEvent.PointerDown,
        {
          id: (this.nodeTransformElement as INodeComponent<T>).id,
          type: 'Resize',
          interactionInfo: {
            xOffsetWithinElementOnFirstClick: x,
            yOffsetWithinElementOnFirstClick: y,
          },
          pointerMove: this.onPointerMoveHelper,
          pointerUp: this.onPointerUpHelper,
        },
        this.nodeTransformElement as INodeComponent<T>
      );
      event.stopPropagation();
      return false;
    }
    return true;
  };

  orgPositionMoveNodes: { [key: string]: { x: number; y: number } } = {};
  moveNodes: IRectNodeComponent<T>[] = [];
  getUpstreamNodes = (node: IRectNodeComponent<T>) => {
    if (node.connections.length > 0) {
      node.connections.forEach((connection) => {
        if (connection.startNode?.id === node.id) {
          if (
            connection.endNode &&
            connection.startNode.x < connection.endNode.x &&
            !this.moveNodes.find((node) => node.id === connection.endNode?.id)
          ) {
            this.moveNodes.push(connection.endNode);
            this.getUpstreamNodes(connection.endNode);
          }
        }
      });
    }
  };

  getDownstreamNodes = (node: IRectNodeComponent<T>) => {
    if (node.connections.length > 0) {
      node.connections.forEach((connection) => {
        if (connection.endNode?.id === node.id) {
          if (
            connection.startNode &&
            connection.startNode.x < connection.endNode.x &&
            !this.moveNodes.find((node) => node.id === connection.startNode?.id)
          ) {
            this.moveNodes.push(connection.startNode);
            this.getDownstreamNodes(connection.startNode);
          }
        }
      });
    }
  };

  onPointerMoveHelper = <T extends BaseNodeInfo>(
    x: number,
    y: number,
    _element: INodeComponent<T>,
    _canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    _interactionStateMachine: InteractionStateMachine<T>
  ) => {
    const offsetX = x - interactionInfo.xOffsetWithinElementOnFirstClick;
    const offsetY = y - interactionInfo.yOffsetWithinElementOnFirstClick;

    // TODO : check if bounds are ok
    if (this.attachedNode) {
      console.log('pointerMoveHelper nodetransformer', this.resizeMode, x, y);
      if (
        this.resizeMode == 'move-upstream-nodes' ||
        this.resizeMode == 'move-downstream-nodes'
      ) {
        this.attachedNode.x = this.orgX + offsetX;
        this.attachedNode.y = this.orgY + offsetY;
        this.moveNodes.forEach((node) => {
          node.x = this.orgPositionMoveNodes[node.id].x + offsetX;
          node.y = this.orgPositionMoveNodes[node.id].y + offsetY;
          node.update?.(node, node.x, node.y, node);
        });
      } else if (this.resizeMode == 'left-top') {
        this.attachedNode.x = x;
        this.attachedNode.y = y;
        this.attachedNode.width = this.orgWidth - offsetX;
        if (this.resizeSameWidthAndHeight) {
          this.attachedNode.height = this.attachedNode.width;
        } else {
          this.attachedNode.height = this.orgHeight - offsetY;
        }
        this.attachedNode.isSettingSize = true;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      } else if (this.resizeMode == 'right-top') {
        this.attachedNode.y = y;
        this.attachedNode.width = this.orgWidth + offsetX;
        if (this.resizeSameWidthAndHeight) {
          this.attachedNode.height = this.attachedNode.width;
        } else {
          this.attachedNode.height = this.orgHeight - offsetY;
        }
        this.attachedNode.isSettingSize = true;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      } else if (this.resizeMode == 'right-bottom') {
        this.attachedNode.width = this.orgWidth + offsetX;
        if (this.resizeSameWidthAndHeight) {
          this.attachedNode.height = this.attachedNode.width;
        } else {
          this.attachedNode.height = this.orgHeight + offsetY;
        }
        this.attachedNode.isSettingSize = true;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      } else if (this.resizeMode == 'left-bottom') {
        this.attachedNode.x = x;
        this.attachedNode.width = this.orgWidth - offsetX;
        if (this.resizeSameWidthAndHeight) {
          this.attachedNode.height = this.attachedNode.width;
        } else {
          this.attachedNode.height = this.orgHeight + offsetY;
        }
        this.attachedNode.isSettingSize = true;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      }
      this.attachedNode.update?.(
        this.attachedNode,
        this.attachedNode.x,
        this.attachedNode.y,
        this.attachedNode
      );
    }
  };
  onPointerUpHelper = <T extends BaseNodeInfo>(
    _x: number,
    _y: number,
    _element: INodeComponent<T>,
    _canvasNode: IElementNode<T>,
    _interactionInfo: IPointerDownResult,
    interactionStateMachine: InteractionStateMachine<T>
  ) => {
    this.attachedNode?.updateEnd?.();
    if (this.attachedNode) {
      this.attachedNode.isSettingSize = false;
    }
    (this.nodeTransformElement?.domElement as HTMLElement).classList.add(
      this.cssClasses.noPointerEvents
    );
    (this.nodeTransformElement?.domElement as HTMLElement).classList.remove(
      this.cssClasses.pointerEventsAuto
    );
    interactionStateMachine.reset();
  };

  onPointerMove = (event: PointerEvent) => {
    console.log(
      'pointerMove nodetransformer',
      (event.target as HTMLElement).getAttribute('data-ResizeMode')
    );
  };

  onPointerUp = (_event: PointerEvent) => {
    //
  };

  resizeNodeTransformer(width: number, height: number) {
    if (this.attachedNode) {
      const transformerDomElement = this.nodeTransformElement
        ?.domElement as HTMLElement;

      transformerDomElement.style.width = `${width}px`;
      transformerDomElement.style.height = `${height}px`;
    }
  }
}
