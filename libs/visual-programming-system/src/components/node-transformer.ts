import { execPath } from 'process';
import { transformCameraSpaceToWorldSpace } from '../camera';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  IElementNode,
  INodeComponent,
  IPointerDownResult,
  IRectNodeComponent,
} from '../interfaces';
import { createElement } from '../utils';

const pointerCursor = 'pointer-events-auto';
const resizeThumbSize = 'w-[8px] h-[8px]';
const transformPosTL = '-translate-x-[50%] -translate-y-[50%]';
const transformPosTR = 'translate-x-[50%] -translate-y-[50%]';
const transformPosBL = '-translate-x-[50%] translate-y-[50%]';
const transformPosBR = 'translate-x-[50%] translate-y-[50%]';

/*
    Class that:
    - select node
    - can transform(resize) .. depends on node.canBeResized
    - move nodes (also the downstream and/or upstream nodes) .. depends on node.isStaticPosition

    TODO:
    - be able to resize via the sides of the node
    - visibilty of moveNodePanel
*/

export class NodeTransformer<T> {
  constructor(
    rootElement: DOMElementNode,
    interactionStateMachine: InteractionStateMachine<T>
  ) {
    this.interactionStateMachine = interactionStateMachine;
    this.nodeTransformElement = createElement(
      'div',
      {
        id: 'node-transformer',
        class:
          'hidden absolute top-0 left-0 z-[2000] border-white border-2 pointer-events-none',
      },
      rootElement
    );
    (this.nodeTransformElement as INodeComponent<T>).update = (
      target?: INodeComponent<T> | undefined,
      x?: number | undefined,
      y?: number | undefined,
      initiator?: INodeComponent<T> | undefined
    ) => {
      console.log('update node-transformer');
      return true;
    };

    this.leftTop = createElement(
      'div',
      {
        class: `absolute ${pointerCursor} cursor-nwse-resize  top-0 left-0 origin-top-left ${resizeThumbSize} bg-white ${transformPosTL}`,
        ['data-ResizeMode']: 'left-top',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement.domElement
    );

    this.rightTop = createElement(
      'div',
      {
        class: `absolute ${pointerCursor} cursor-nesw-resize top-0 right-0  origin-top-right ${resizeThumbSize} bg-white ${transformPosTR}`,
        ['data-ResizeMode']: 'right-top',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement.domElement
    );

    this.leftBottom = createElement(
      'div',
      {
        class: `absolute ${pointerCursor} cursor-nesw-resize bottom-0 left-0 origin-bottom-left ${resizeThumbSize} bg-white ${transformPosBL}`,
        ['data-ResizeMode']: 'left-bottom',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement.domElement
    );

    this.rightBottom = createElement(
      'div',
      {
        class: `absolute ${pointerCursor} cursor-nwse-resize bottom-0 right-0 origin-bottom-right ${resizeThumbSize} bg-white ${transformPosBR}`,
        ['data-ResizeMode']: 'right-bottom',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeTransformElement.domElement
    );

    this.moveNodesPanel = createElement(
      'div',
      {
        class: `absolute -bottom-[48px] left-[50%] flex justify-center items-center        
       
        origin-bottom-center
        w-[96px] h-[32px] 
        -translate-x-[50%] gap-[8px] flex-grow flex-shrink-0`,
      },
      this.nodeTransformElement.domElement
    );

    this.downstreamNodesMover = createElement(
      'div',
      {
        class: `w-0 h-0  ${pointerCursor}
        border-t-[12px] border-t-transparent
        border-r-[18px] border-r-white
        border-b-[12px] border-b-transparent
        cursor-pointer`,
        ['data-ResizeMode']: 'move-downstream-nodes',
        pointerdown: this.onPointerDown,
      },
      this.moveNodesPanel.domElement
    );

    this.inividualNodeMover = createElement(
      'div',
      {
        class: `w-[24px] h-[24px]  ${pointerCursor}
         bg-white rounded-[50%]`,
      },
      this.moveNodesPanel.domElement
    );

    this.upstreamNodesMover = createElement(
      'div',
      {
        class: `w-0 h-0  ${pointerCursor}
        border-t-[12px] border-t-transparent
        border-l-[18px] border-l-white
        border-b-[12px] border-b-transparent
        cursor-pointer`,

        ['data-ResizeMode']: 'move-upstream-nodes',
        pointerdown: this.onPointerDown,
      },
      this.moveNodesPanel.domElement
    );
  }

  nodeTransformElement: IElementNode<T> | undefined;
  interactionStateMachine: InteractionStateMachine<T> | undefined;
  leftTop: IElementNode<T> | undefined;
  rightTop: IElementNode<T> | undefined;
  leftBottom: IElementNode<T> | undefined;
  rightBottom: IElementNode<T> | undefined;

  moveNodesPanel: IElementNode<T> | undefined;

  upstreamNodesMover: IElementNode<T> | undefined;
  downstreamNodesMover: IElementNode<T> | undefined;
  inividualNodeMover: IElementNode<T> | undefined;

  previouslyAttachedNode: IRectNodeComponent<T> | undefined;
  attachedNode: IRectNodeComponent<T> | undefined;

  attachNode(node: IRectNodeComponent<T>) {
    if (!this.attachedNode || this.attachedNode.id !== node.id) {
      this.previouslyAttachedNode = this.attachedNode;
    }
    this.attachedNode = node;

    this.visibilityResizeControls(node.canBeResized ?? true);
    const transformerDomElement = this.nodeTransformElement
      ?.domElement as HTMLElement;

    transformerDomElement.style.width = `${node.width ?? 0}px`;
    transformerDomElement.style.height = `${node.height ?? 0}px`;
    transformerDomElement.style.transform = `translate(${node.x}px, ${node.y}px)`;

    transformerDomElement.classList.remove('hidden');
  }

  updateCamera() {
    if (this.attachedNode) {
      this.attachNode(this.attachedNode);
    }
  }

  detachNode() {
    this.previouslyAttachedNode = this.attachedNode;
    this.attachedNode = undefined;
    (this.nodeTransformElement?.domElement as HTMLElement).classList.add(
      'hidden'
    );
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

  onPointerOver = (event: PointerEvent) => {
    //
  };

  onPointerLeave = (event: PointerEvent) => {
    //this.detachNode();
  };

  resizeMode = '';
  orgX = 0;
  orgY = 0;
  orgWidth = 0;
  orgHeight = 0;
  onPointerDown = (event: PointerEvent) => {
    if (this.interactionStateMachine && this.attachedNode) {
      console.log(
        'pointerDown nodetransformer',
        (event.target as HTMLElement).getAttribute('data-ResizeMode')
      );

      (this.nodeTransformElement?.domElement as HTMLElement).classList.add(
        'pointer-events-auto'
      );
      (this.nodeTransformElement?.domElement as HTMLElement).classList.remove(
        'pointer-events-none'
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
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
  };

  orgPositionMoveNodes: { [key: string]: { x: number; y: number } } = {};
  moveNodes: IRectNodeComponent<T>[] = [];
  getUpstreamNodes = (node: IRectNodeComponent<T>) => {
    if (node.connections.length > 0) {
      node.connections.forEach((connection) => {
        if (connection.startNode?.id === node.id) {
          if (
            connection.endNode &&
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
            !this.moveNodes.find((node) => node.id === connection.startNode?.id)
          ) {
            this.moveNodes.push(connection.startNode);
            this.getDownstreamNodes(connection.startNode);
          }
        }
      });
    }
  };

  onPointerMoveHelper = <T>(
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    interactionStateMachine: InteractionStateMachine<T>
  ) => {
    const offsetX = x - interactionInfo.xOffsetWithinElementOnFirstClick;
    const offsetY = y - interactionInfo.yOffsetWithinElementOnFirstClick;
    console.log(
      'onPointerMoveHelper',
      offsetX,
      offsetY,
      element,
      canvasNode,
      interactionInfo,
      interactionStateMachine
    );

    // TODO : check if bounds are ok
    if (this.attachedNode) {
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
        this.attachedNode.height = this.orgHeight - offsetY;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      } else if (this.resizeMode == 'right-top') {
        this.attachedNode.y = y;
        this.attachedNode.width = this.orgWidth + offsetX;
        this.attachedNode.height = this.orgHeight - offsetY;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      } else if (this.resizeMode == 'right-bottom') {
        this.attachedNode.width = this.orgWidth + offsetX;
        this.attachedNode.height = this.orgHeight + offsetY;
        this.attachedNode.setSize(
          this.attachedNode.width,
          this.attachedNode.height
        );
      } else if (this.resizeMode == 'left-bottom') {
        this.attachedNode.x = x;
        this.attachedNode.width = this.orgWidth - offsetX;
        this.attachedNode.height = this.orgHeight + offsetY;
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
  onPointerUpHelper = <T>(
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    interactionStateMachine: InteractionStateMachine<T>
  ) => {
    this.attachedNode?.updateEnd?.();
    (this.nodeTransformElement?.domElement as HTMLElement).classList.add(
      'pointer-events-none'
    );
    (this.nodeTransformElement?.domElement as HTMLElement).classList.remove(
      'pointer-events-auto'
    );
    interactionStateMachine.reset();
  };

  onPointerMove = (event: PointerEvent) => {
    console.log(
      'pointerMove nodetransformer',
      (event.target as HTMLElement).getAttribute('data-ResizeMode')
    );
  };

  onPointerUp = (event: PointerEvent) => {
    //
  };
}
