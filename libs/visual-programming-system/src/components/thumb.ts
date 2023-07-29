import { transformToCamera } from '../camera';
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
import { ThumbType } from '../types';
import { createElement, createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';
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

  constructor(
    canvasElement: DOMElementNode,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    thumbName: string,
    thumbType: ThumbType,
    color?: string,
    xInitial?: string | number,
    yInitial?: string | number,
    connectionControllerType?: string,
    nodeType?: string,
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
    canvasUpdated?: () => void
  ) {
    this.interactionStateMachine = interactionStateMachine;
    this.disableInteraction = disableInteraction ?? false;
    this.canvas = canvas;
    this.parentRectNode = parentRectNode;
    this.canvasElement = canvasElement;
    this.canvasElements = canvasElements;
    this.pathHiddenElement = pathHiddenElement;
    this.canvasUpdated = canvasUpdated;

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
        class: `absolute cursor-pointer transition-none   pointer-events-none ${
          additionalClasses || ''
        }`,
        style: {
          transform: relativePositioned
            ? ''
            : `translate(${initialX}px, ${initialY}px)`,
          width: `${width ?? 100}px`,
          height: `${height ?? 100}px`,
          top: relativePositioned
            ? `calc(${initialY} - ${(height ?? 100) / 2}px)`
            : '0px',
          left: relativePositioned
            ? `calc(${initialX} - ${(width ?? 100) / 2}px)`
            : '0px',
        },
        width: width ?? 100,
        height: height ?? 100,
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
          width: `${(radius ?? 10) * 2}px`,
          height: `${(radius ?? 10) * 2}px`,
          transform: `translate(${-(radius ?? 10) + (width ?? 100) / 2}px, ${
            -(radius ?? 10) + (height ?? 100) / 2
          }px)`,
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
        class: `absolute top-[3px] left-[3px]`,
        style: {
          width: `${(radius ?? 10) * 2 - 6}px`,
          height: `${(radius ?? 10) * 2 - 6}px`,
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
          class: `pointer-events-none absolute text-[11px] flex items-center justify-center
        w-[14px] h-[14px] text-base-[14px]
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
    this.nodeComponent.width = 100;
    this.nodeComponent.height = 100;
    this.nodeComponent.offsetX = 50;
    this.nodeComponent.offsetY = 50;
    this.nodeComponent.radius = 10;
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
  onPointerDown = (e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (this.nodeComponent) {
      // hold shift to disconnect node from start point
      if (this.nodeComponent.thumbLinkedToNode && e.shiftKey && this.canvas) {
        console.log(
          'connections found',
          this.nodeComponent,
          this.nodeComponent.thumbLinkedToNode.connections
        );

        const { x, y } = transformToCamera(e.clientX, e.clientY);
        const curve = this.nodeComponent.thumbLinkedToNode.connections[0];

        const connection =
          this.nodeComponent.connectionControllerType === 'start'
            ? curve.connectionStartNodeThumb
            : curve.connectionEndNodeThumb;
        if (connection) {
          const elementRect = (
            connection.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();

          const rectCamera = transformToCamera(elementRect.x, elementRect.y);

          const interactionInfoResult = pointerDown(
            x - rectCamera.x,
            y - rectCamera.y,
            connection,
            this.canvas.domElement,
            this.interactionStateMachine
          );
          if (interactionInfoResult && connection.initPointerDown) {
            connection.initPointerDown(
              interactionInfoResult.xOffsetWithinElementOnFirstClick,
              interactionInfoResult.yOffsetWithinElementOnFirstClick
            );
          }
        }

        return;
      }

      /* 
    TODO:
    if:
    - no interaction is in progress
    - thumb is node thumb connector
    - thumbConnectionType is start
    - node is not connected
    then:
    - create a connection starting from this node and thumb
    - initialize the interaction state machine with the new connection
    */
      console.log(
        'thumb pointerdown before check',
        this.nodeComponent.id,
        this.nodeComponent
      );
      if (
        this.nodeComponent.thumbConnectionType === ThumbConnectionType.start &&
        this.nodeComponent.isConnectPoint &&
        this.parentRectNode &&
        this.canvasElements
      ) {
        console.log(
          'thumb pointerdown',
          this.nodeComponent.id,
          this.nodeComponent
        );
        //e.preventDefault();

        // const elementRect = (
        //   nodeComponent.domElement as unknown as HTMLElement | SVGElement
        // ).getBoundingClientRect();
        const { x, y } = transformToCamera(e.clientX, e.clientY);
        //const rectCamera = transformToCamera(elementRect.x, elementRect.y);
        const curve = new CubicBezierConnection<T>(
          this.canvas as unknown as INodeComponent<T>,
          this.interactionStateMachine,
          this.pathHiddenElement as unknown as IElementNode<T>,
          this.canvasElements,
          x - 50,
          y - 50,
          x - 50,
          y - 50,
          x - 50,
          y - 50,
          x - 50,
          y - 50,
          true,
          undefined,
          this.canvasUpdated
        );

        if (!curve || !curve.nodeComponent || !curve.endPointElement) {
          throw new Error('curve not created');
        }

        if (curve && this.canvas) {
          console.log(
            'new curve created',
            curve.nodeComponent.id,
            curve.endPointElement.id
          );
          curve.nodeComponent.isControlled = true;

          curve.nodeComponent.startNode = this.parentRectNode;
          curve.nodeComponent.startNodeThumb = this.nodeComponent;
          this.parentRectNode.connections?.push(curve.nodeComponent);

          if (curve.nodeComponent.update) {
            curve.nodeComponent.update();
          }

          const elementRect = (
            curve.endPointElement.domElement as unknown as
              | HTMLElement
              | SVGElement
          ).getBoundingClientRect();

          const rectCamera = transformToCamera(elementRect.x, elementRect.y);

          const interactionInfoResult = pointerDown(
            x - rectCamera.x,
            y - rectCamera.y,
            curve.endPointElement,
            this.canvas.domElement,
            this.interactionStateMachine
          );
          if (interactionInfoResult && curve.endPointElement.initPointerDown) {
            curve.endPointElement.initPointerDown(
              interactionInfoResult.xOffsetWithinElementOnFirstClick,
              interactionInfoResult.yOffsetWithinElementOnFirstClick
            );
          }

          if (curve.endPointElement.getThumbCircleElement) {
            const circleDomElement =
              curve.endPointElement.getThumbCircleElement();
            console.log('circleDomElement', circleDomElement);
            circleDomElement.classList.remove('pointer-events-auto');
            circleDomElement.classList.add('pointer-events-none');
          }
          // (
          //   nodeComponent.parent?.domElement as unknown as HTMLElement
          // ).append(nodeComponent.domElement);

          console.log('new curve interactionInfoResult', interactionInfoResult);
        }

        return;
      }

      if (this.nodeComponent.isControlled) {
        return;
      }
      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      const { x, y } = transformToCamera(e.clientX, e.clientY);
      const rectCamera = transformToCamera(elementRect.x, elementRect.y);

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
      const { x, y } = transformToCamera(e.clientX, e.clientY);
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
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }

    if (this.nodeComponent.domElement) {
      (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
        'none';

      const { x, y } = transformToCamera(e.clientX, e.clientY);
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

    // TODO : check if droptarget is the correct type BEFOFE casting
    const dropTarget =
      this.interactionStateMachine.getCurrentDropTarget() as unknown as IThumbNodeComponent<T>;
    if (dropTarget) {
      console.log(
        'DROPPED ON TARGET',
        dropTarget.id,
        this.nodeComponent.id,
        this.nodeComponent.connectionControllerType,
        this.nodeComponent.onReceiveDraggedConnection
      );
      if (
        dropTarget.onReceiveDraggedConnection &&
        dropTarget.id !== this.nodeComponent.id
      ) {
        dropTarget.onReceiveDraggedConnection(dropTarget, this.nodeComponent);
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
      this.nodeComponent.parent.nodeType === 'connection'
    ) {
      this.nodeComponent.parent.update?.();
    }
  };
}
