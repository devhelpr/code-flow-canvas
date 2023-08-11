import { transformCameraSpaceToWorldSpace } from '../camera';
import {
  paddingRect,
  thumbFontSizeClass,
  thumbHalfHeight,
  thumbHalfWidth,
  thumbHeight,
  thumbInnerCircleSizeClasses,
  thumbRadius,
  thumbTextBaseSizeClass,
  thumbWidth,
} from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { getSelectedNode } from '../reactivity';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createElement } from '../utils/create-element';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';
import { QuadraticBezierConnection } from './quadratic-bezier-connection';
import { CubicBezierConnection } from './qubic-bezier-connection';

export class ThumbNode<T> {
  nodeComponent?: IThumbNodeComponent<T>;
  interactionStateMachine: InteractionStateMachine<T>;
  disableInteraction = false;
  canvas: INodeComponent<T> | undefined;
  parentRectNode?: IRectNodeComponent<T>;
  canvasElement: DOMElementNode;
  canvasElements?: ElementNodeMap<T>;
  pathHiddenElement?: IElementNode<T>;
  canvasUpdated?: () => void;
  circleElement: IElementNode<T> | undefined;
  interactionInfo: IPointerDownResult;
  containerNode?: INodeComponent<T>;

  constructor(
    canvasElement: DOMElementNode,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    thumbName: string,
    thumbType: ThumbType,
    color?: string,
    xInitial?: string | number,
    yInitial?: string | number,
    connectionControllerType?: ConnectionControllerType,
    nodeType?: NodeType,
    additionalClasses?: string,
    width?: number,
    height?: number,
    radius?: number,
    isTransparent?: boolean,
    borderColor?: string,
    index?: number,
    relativePositioned?: boolean,
    canvas?: INodeComponent<T>,
    canvasElements?: ElementNodeMap<T>,
    parentRectNode?: IRectNodeComponent<T>,
    pathHiddenElement?: IElementNode<T>,
    disableInteraction?: boolean,
    label?: string,
    thumbShape?: 'circle' | 'diamond',
    canvasUpdated?: () => void,
    containerNode?: INodeComponent<T>
  ) {
    this.interactionStateMachine = interactionStateMachine;
    this.disableInteraction = disableInteraction ?? false;
    this.canvas = canvas;
    this.parentRectNode = parentRectNode;
    this.canvasElement = canvasElement;
    this.canvasElements = canvasElements;
    this.pathHiddenElement = pathHiddenElement;
    this.canvasUpdated = canvasUpdated;
    this.containerNode = containerNode;

    this.interactionInfo = {
      xOffsetWithinElementOnFirstClick: 0,
      yOffsetWithinElementOnFirstClick: 0,
    };

    const initialX =
      xInitial !== undefined ? xInitial : Math.floor(Math.random() * 1024);
    const initialY =
      yInitial !== undefined ? yInitial : Math.floor(Math.random() * 500);
    //console.log('createSVGElement', initialX, initialY, connectionControllerType);
    // const nodeComponent: INodeComponent<T> = createSVGNodeComponent(
    //   'svg',
    this.nodeComponent = createElement(
      'div',
      {
        // will-change-transform
        class: `absolute cursor-pointer transition-none pointer-events-none ${
          additionalClasses || ''
        }`,
        style: {
          transform: relativePositioned
            ? ''
            : `translate(${initialX}px, ${initialY}px)`,
          width: `${width ?? thumbWidth}px`,
          height: `${height ?? thumbHeight}px`,
          top: relativePositioned
            ? `calc(${initialY}px - ${(height ?? thumbHeight) / 2}px)`
            : `-${thumbHalfHeight}px`,
          left: relativePositioned
            ? `calc(${initialX}px - ${(width ?? thumbWidth) / 2}px)`
            : `-${thumbHalfWidth}px`,
        },
        width: width ?? thumbWidth,
        height: height ?? thumbHeight,
      },
      canvasElement
    ) as IThumbNodeComponent<T>;

    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }

    this.nodeComponent.thumbName = thumbName;
    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;

    (this.nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
      this.nodeComponent.id;
    this.circleElement = createElement(
      'div',
      {
        class: `${
          disableInteraction ? 'pointer-events-none' : 'pointer-events-auto'
        }  origin-center`, // rounded-full border-[3px]
        style: {
          width: `${(radius ?? thumbRadius) * 2}px`,
          height: `${(radius ?? thumbRadius) * 2}px`,
          transform: `translate(${
            -(radius ?? thumbRadius) + (width ?? thumbWidth) / 2
          }px, ${-(radius ?? thumbRadius) + (height ?? thumbHeight) / 2}px)`,
          'clip-path':
            thumbShape === 'diamond'
              ? 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%'
              : 'circle(50%)',
          'background-color': isTransparent
            ? 'transparent'
            : borderColor
            ? borderColor
            : 'black',
          // 'background-color': isTransparent
          //   ? 'transparent'
          //   : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
        },

        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeComponent.domElement
    );

    if (!this.circleElement) throw new Error('circleElement is undefined');
    const innerCircle = createElement(
      'div',
      {
        class: `absolute top-[3px] left-[3px]`, //top-[3px] left-[3px
        style: {
          width: `${(radius ?? thumbRadius) * 2 - 6}px`, // -6
          height: `${(radius ?? thumbRadius) * 2 - 6}px`, // -6
          'clip-path':
            thumbShape === 'diamond'
              ? 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%'
              : 'circle(50%)',
          'background-color': isTransparent
            ? 'transparent'
            : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      },
      this.circleElement.domElement
    );
    if (label) {
      createElement(
        'div', //'circle',
        {
          class: `pointer-events-none absolute ${thumbFontSizeClass} flex items-center justify-center
        ${thumbInnerCircleSizeClasses} ${thumbTextBaseSizeClass}
        text-center
        top-[-1px] text-black `,
        },
        innerCircle.domElement,
        label
      );
    }
    elements.set(this.nodeComponent.id, this.nodeComponent);
    this.nodeComponent.elements.set(this.circleElement.id, this.circleElement);
    this.nodeComponent.connectionControllerType = connectionControllerType;
    this.nodeComponent.x = parseInt(initialX.toString()) | 0;
    this.nodeComponent.y = parseInt(initialY.toString()) | 0;
    this.nodeComponent.nodeType = nodeType;
    this.nodeComponent.width = thumbWidth;
    this.nodeComponent.height = thumbHeight;
    this.nodeComponent.offsetX = 0;
    this.nodeComponent.offsetY = 0;
    this.nodeComponent.radius = thumbRadius;
    this.nodeComponent.thumbIndex = index ?? 0;
    this.nodeComponent.thumbType = thumbType;

    this.nodeComponent.setVisibility = (visible: boolean) => {
      if (!this.nodeComponent) {
        return;
      }
      (
        this.nodeComponent.domElement as unknown as SVGElement
      ).style.display = `${visible ? 'block' : 'none'}`;

      if (visible && !disableInteraction) {
        const circleDomElement = this.circleElement
          ?.domElement as unknown as SVGElement;
        circleDomElement.classList.remove('pointer-events-none');
        circleDomElement.classList.add('pointer-events-auto');
      } else {
        circleDomElement.classList.remove('pointer-events-auto');
        circleDomElement.classList.add('pointer-events-none');
      }
    };

    this.nodeComponent.initPointerDown = (
      initialXOffset: number,
      initialYOffset: number
    ) => {
      this.interactionInfo.xOffsetWithinElementOnFirstClick = initialXOffset;
      this.interactionInfo.yOffsetWithinElementOnFirstClick = initialYOffset;
    };

    this.nodeComponent.pointerUp = this.onPointerThumbUp;

    const circleDomElement = this.circleElement?.domElement as unknown as
      | HTMLElement
      | SVGElement;
    this.nodeComponent.getThumbCircleElement = () => circleDomElement;
  }

  onPointerOver = (_e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }
    console.log('svg pointerover', this.nodeComponent.id, this.nodeComponent);
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      'cursor-pointer'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      'cursor-pointer'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      'cursor-not-allowed'
    );
    if (this.nodeComponent.isConnectPoint) {
      let canReceiveDrop = false;
      if (this.nodeComponent.onCanReceiveDroppedComponent) {
        const state = this.interactionStateMachine.getCurrentInteractionState();
        if (state && state.element) {
          canReceiveDrop = this.nodeComponent.onCanReceiveDroppedComponent(
            this.nodeComponent,
            state.element as unknown as IConnectionNodeComponent<T>,
            this.nodeComponent
          );

          if (!canReceiveDrop) {
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).style.filter = 'none';

            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.remove('cursor-pointer');
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.add('cursor-not-allowed');
            console.log(
              'svg cant register drop target for current dragging element'
            );
            return;
          } else {
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).style.filter = 'invert(1)';
          }
        }
      }

      console.log('svg register drop target', this.nodeComponent.id);
      this.interactionStateMachine.setCurrentDropTarget(this.nodeComponent);
    }
  };

  onPointerLeave = (_e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }

    if (this.nodeComponent.isConnectPoint) {
      console.log('svg unregister drop target', this.nodeComponent.id);
      this.interactionStateMachine.clearDropTarget(this.nodeComponent);

      (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
        'none';

      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        'cursor-not-allowed'
      );
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        'cursor-pointer'
      );
    }
  };

  initiateDraggingConnection = (
    connectionThumb: IThumbNodeComponent<T>,
    x: number,
    y: number
  ) => {
    if (!this.canvas) {
      return;
    }
    const elementRect = (
      connectionThumb.domElement as unknown as HTMLElement | SVGElement
    ).getBoundingClientRect();

    const rectCamera = transformCameraSpaceToWorldSpace(
      elementRect.x,
      elementRect.y
    );

    let parentX = 0;
    let parentY = 0;
    if (this.containerNode) {
      parentX = this.containerNode.x - paddingRect;
      parentY = this.containerNode.y - paddingRect;
    }

    const interactionInfoResult = pointerDown(
      x - rectCamera.x + parentX,
      y - rectCamera.y + parentY,
      connectionThumb,
      this.canvas.domElement,
      this.interactionStateMachine
    );
    if (interactionInfoResult && connectionThumb.initPointerDown) {
      connectionThumb.initPointerDown(
        interactionInfoResult.xOffsetWithinElementOnFirstClick,
        interactionInfoResult.yOffsetWithinElementOnFirstClick
      );
    }

    if (connectionThumb.getThumbCircleElement) {
      const circleDomElement = connectionThumb.getThumbCircleElement();

      circleDomElement.classList.remove('pointer-events-auto');
      circleDomElement.classList.add('pointer-events-none');
    }
  };

  onPointerDown = (e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }

    if (this.nodeComponent) {
      if (this.nodeComponent.thumbType === ThumbType.Center) {
        return;
      }

      e.stopPropagation();
      const selectedNodeId = getSelectedNode();
      if (selectedNodeId) {
        const selectedNode = this.canvasElements?.get(
          selectedNodeId
        ) as unknown as INodeComponent<T>;
        const connectionNode =
          this.nodeComponent.thumbLinkedToNode?.nodeType === NodeType.Shape
            ? this.nodeComponent.thumbLinkedToNode?.connections.find(
                (c) => c.id === selectedNodeId
              )
            : undefined;
        if (
          connectionNode &&
          selectedNode &&
          selectedNode.nodeType === NodeType.Connection &&
          this.canvas
        ) {
          const { x, y } = transformCameraSpaceToWorldSpace(
            e.clientX,
            e.clientY
          );
          const curve = selectedNode as unknown as IConnectionNodeComponent<T>;
          const connectionThumb =
            this.nodeComponent.thumbConnectionType === 'start'
              ? curve.connectionStartNodeThumb
              : curve.connectionEndNodeThumb;
          if (connectionThumb) {
            this.initiateDraggingConnection(connectionThumb, x, y);
          }

          return;
        }
      }

      if (this.nodeComponent.thumbLinkedToNode && e.shiftKey && this.canvas) {
        const { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
        const connections =
          this.nodeComponent.thumbLinkedToNode?.connections.filter(
            (c) => c.startNodeThumb?.id === this.nodeComponent?.id
          );
        if (connections && connections.length > 0) {
          const curve = connections[0];

          //this.nodeComponent.thumbLinkedToNode.connections[0];
          const connectionThumb =
            this.nodeComponent.thumbConnectionType === 'start'
              ? curve.connectionStartNodeThumb
              : curve.connectionEndNodeThumb;
          if (connectionThumb) {
            this.initiateDraggingConnection(connectionThumb, x, y);
          }
        }

        return;
      }

      if (
        this.nodeComponent.thumbConnectionType === ThumbConnectionType.start &&
        this.nodeComponent.isConnectPoint &&
        this.parentRectNode &&
        this.canvasElements
      ) {
        let parentX = 0;
        let parentY = 0;
        if (this.containerNode) {
          parentX = this.containerNode.x - paddingRect;
          parentY = this.containerNode.y - paddingRect;
        }
        let { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
        const xorg = x;
        const yorg = y;
        x = x - parentX;
        y = y - parentY;
        const curve = new CubicBezierConnection<T>(
          this.canvas as unknown as INodeComponent<T>,
          this.interactionStateMachine,
          this.pathHiddenElement as unknown as IElementNode<T>,
          this.canvasElements,
          x,
          y,
          x,
          y,
          x,
          y,
          x,
          y,
          false,
          undefined,
          this.canvasUpdated,
          undefined,
          this.containerNode
        );
        // new QuadraticBezierConnection<T>(
        //     this.canvas as unknown as INodeComponent<T>,
        //     this.interactionStateMachine,
        //     this.pathHiddenElement as unknown as IElementNode<T>,
        //     this.canvasElements,
        //     x,
        //     y,
        //     x,
        //     y,
        //     x,
        //     y,

        //     false,
        //     undefined,
        //     this.canvasUpdated,
        //     undefined,
        //     this.containerNode
        //   );

        if (!curve || !curve.nodeComponent || !curve.endPointElement) {
          throw new Error('curve not created');
        }

        if (curve && this.canvas) {
          curve.nodeComponent.startNode = this.parentRectNode;
          curve.nodeComponent.startNodeThumb = this.nodeComponent;
          this.parentRectNode.connections?.push(curve.nodeComponent);

          if (curve.nodeComponent.update) {
            curve.nodeComponent.update();
          }

          this.initiateDraggingConnection(curve.endPointElement, xorg, yorg);
        }

        return;
      }

      if (this.nodeComponent.isControlled) {
        return;
      }
      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      const { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
      const rectCamera = transformCameraSpaceToWorldSpace(
        elementRect.x,
        elementRect.y
      );

      const interactionInfoResult = pointerDown(
        x - rectCamera.x,
        y - rectCamera.y,
        this.nodeComponent,
        this.canvasElement,
        this.interactionStateMachine
      );

      if (interactionInfoResult) {
        this.interactionInfo = interactionInfoResult;
        const circleDomElement = this.circleElement?.domElement as unknown as
          | HTMLElement
          | SVGElement;
        circleDomElement.classList.remove('pointer-events-auto');
        circleDomElement.classList.add('pointer-events-none');
      }
    }
  };

  onPointerMove = (e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }

    if (this.nodeComponent && this.nodeComponent.domElement) {
      const { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
      pointerMove(
        x,
        y,
        this.nodeComponent,
        this.canvasElement,
        this.interactionInfo,
        this.interactionStateMachine
      );
    }
  };

  onPointerUp = (e: PointerEvent) => {
    console.log('onPointerUp');
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }

    if (this.nodeComponent.domElement) {
      (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
        'none';

      const { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
      pointerUp(
        x,
        y,
        this.nodeComponent,
        this.canvasElement,
        this.interactionInfo,
        this.interactionStateMachine
      );
      const circleDomElement = this.circleElement?.domElement as unknown as
        | HTMLElement
        | SVGElement;
      console.log('onPointerUp circleDomElement', circleDomElement);
      circleDomElement.classList.add('pointer-events-auto');
      circleDomElement.classList.remove('pointer-events-none');
    }
  };

  onPointerThumbUp = () => {
    if (this.disableInteraction) {
      return;
    }

    if (!this.nodeComponent) {
      return;
    }

    // TODO : figure out why below the end connection is removed...
    // ... this causes problems when the connection was just connected to a rect-thumb...
    // ... rect-thumbs handle this themselves...

    // TODO : check if droptarget is the correct type BEFOFE casting
    const dropTarget =
      this.interactionStateMachine.getCurrentDropTarget() as unknown as IThumbNodeComponent<T>;
    const state = this.interactionStateMachine.getCurrentInteractionState();
    if (dropTarget && state) {
      console.log(
        'DROPPED ON TARGET',
        dropTarget.id,
        this.nodeComponent.id,
        this.nodeComponent.connectionControllerType,
        this.nodeComponent.onReceiveDraggedConnection
      );

      if (dropTarget.nodeType === NodeType.Shape) {
        const rectNode = dropTarget as unknown as IRectNodeComponent<T>;
        const connection = this.nodeComponent
          .parent as unknown as IConnectionNodeComponent<T>;
        if (connection) {
          if (rectNode.thumbConnectors?.[0].thumbType === ThumbType.Center) {
            connection.endNode = rectNode;
            connection.endNodeThumb = rectNode.thumbConnectors?.[0];

            rectNode.connections?.push(connection);

            connection.update?.(
              connection,
              connection.startNode?.x ?? 0,
              connection.startNode?.y ?? 0,
              rectNode
            );
          }
        }
      } else if (
        dropTarget.onReceiveDraggedConnection &&
        dropTarget.id !== this.nodeComponent.id
      ) {
        dropTarget.onReceiveDraggedConnection(dropTarget, this.nodeComponent);
      }
    } else {
      if (this.nodeComponent.nodeType === NodeType.ConnectionController) {
        if (
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.begin
        ) {
          if (this.nodeComponent?.parent) {
            const connection = this.nodeComponent
              .parent as unknown as IConnectionNodeComponent<T>;
            if (connection.startNode) {
              connection.startNode.connections =
                connection.startNode.connections?.filter(
                  (c) => c.id !== connection.id
                );
              connection.startNode = undefined;
              connection.startNodeThumb = undefined;
            }
          }
        } else if (
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.end
        ) {
          if (this.nodeComponent?.parent) {
            const connection = this.nodeComponent
              .parent as unknown as IConnectionNodeComponent<T>;
            if (connection.endNode) {
              connection.endNode.connections =
                connection.endNode.connections?.filter(
                  (c) => c.id !== connection.id
                );
              connection.endNode = undefined;
              connection.endNodeThumb = undefined;
            }
          }
        }
      }
    }

    console.log(
      'svg pointerup nodecomponent',
      this.nodeComponent.id,
      this.nodeComponent,
      dropTarget
    );
    this.interactionStateMachine.clearDropTarget(this.nodeComponent);

    const circleDomElement = this.circleElement?.domElement as unknown as
      | HTMLElement
      | SVGElement;
    circleDomElement.classList.add('pointer-events-auto');
    circleDomElement.classList.remove('pointer-events-none');

    if (
      this.nodeComponent.parent &&
      this.nodeComponent.parent.nodeType === NodeType.Connection
    ) {
      this.nodeComponent.parent.update?.();
    }
  };
}
