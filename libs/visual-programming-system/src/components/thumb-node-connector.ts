import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { transformCameraSpaceToWorldSpace } from '../camera';
import {
  thumbRadius,
  thumbWidth,
  thumbHeight,
  thumbFontSizeClass,
  thumbInnerCircleSizeClasses,
  thumbTextBaseSizeClass,
  paddingRect,
} from '../constants/measures';
import {
  InteractionState,
  InteractionStateMachine,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createElement } from '../utils';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';
import { thumbThreeDots } from './icons/thumb-three-dots';
import { CubicBezierConnection } from './qubic-bezier-connection';
import { ThumbNode } from './thumb';
import { thumbTwoDots } from './icons/thumb-two-dots';
import { CanvasAction } from '../enums/canvas-action';

export class ThumbNodeConnector<T> extends ThumbNode<T> {
  constructor(
    thumb: IThumb,
    canvasElement: DOMElementNode,
    canvas: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    thumbName: string,
    thumbType: ThumbType,
    connectionType?: ThumbConnectionType,
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

    canvasElements?: ElementNodeMap<T>,
    parentRectNode?: IRectNodeComponent<T>,
    pathHiddenElement?: IElementNode<T>,
    disableInteraction?: boolean,
    label?: string,
    thumbShape?: 'circle' | 'diamond',
    canvasUpdated?: () => void,
    containerNode?: IRectNodeComponent<T>,
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void
  ) {
    super(
      canvasElement,
      canvas,
      interactionStateMachine,
      elements,
      thumbName,
      thumbType,
      connectionType,
      color,
      xInitial,
      yInitial,
      connectionControllerType,
      nodeType,
      additionalClasses,
      width,
      height,
      radius,
      isTransparent,
      borderColor,
      index,
      relativePositioned,
      canvasElements,
      parentRectNode,
      pathHiddenElement,
      disableInteraction,
      label,
      thumbShape,
      canvasUpdated,
      containerNode,
      thumb?.thumbIdentifierWithinNode,
      setCanvasAction
    );

    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }

    this.nodeComponent.prefixIcon = thumb.prefixIcon;
    this.nodeComponent.prefixLabel = thumb.prefixLabel;
    this.nodeComponent.thumbName = thumbName;
    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;
    this.nodeComponent.thumbIdentifierWithinNode =
      thumb?.thumbIdentifierWithinNode;

    (this.nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
      this.nodeComponent.id;

    isTransparent = true;
    this.circleElement = createElement(
      'div',
      {
        class: `inline-flex items-center ${
          disableInteraction ? 'pointer-events-none' : 'pointer-events-auto'
        }        
        origin-center`,
        style: {
          width: `${radius ?? thumbRadius * 2}px`,
          height: `${(radius ?? thumbRadius) * 2}px`,
          transform: `translate(${
            -(radius ?? thumbRadius) + (width ?? thumbWidth) / 2
          }px, ${-(radius ?? thumbRadius) + (height ?? thumbHeight) / 2}px)`,
          'clip-path':
            thumbShape === 'diamond'
              ? 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%'
              : 'none', //'circle(50%)',
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
    (this.circleElement.domElement as HTMLElement).setAttribute(
      'data-nodecomponent',
      'true'
    );

    if (!this.circleElement) throw new Error('circleElement is undefined');
    if (thumb.hint) {
      (this.nodeComponent.domElement as HTMLElement).setAttribute(
        'title',
        thumb.hint
      );
    }
    if (thumb.prefixIcon) {
      createElement(
        'div',
        {
          class: `relative text-white -left-[10px] thumb-prefix-icon ${thumb.prefixIcon}`,
        },
        this.circleElement.domElement
      );
    }
    if (thumb.prefixLabel) {
      createElement(
        'div',
        {
          class: `thumb-prefix-label whitespace-nowrap relative text-white pointer-events-none select-none ${
            thumb.connectionType === ThumbConnectionType.end
              ? '-right-[30px] block'
              : 'origin-right -translate-x-[100%] text-right flex justify-end '
          }`,
        },
        this.circleElement.domElement,
        thumb.prefixLabel
      );
    }
    let additionalInnerCirlceClasses = '';
    if (connectionType === ThumbConnectionType.end) {
      additionalInnerCirlceClasses = `flex items-center justify-center`;
    }

    if (disableInteraction) {
      additionalInnerCirlceClasses += ' pointer-events-none';
    }

    (
      this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
    ).classList.add('node-connector');

    const clipShapeNodeThumb = 'none'; //,'circle(50%)';

    isTransparent = false;
    // if (connectionType === ThumbConnectionType.start) {
    //   clipShapeNodeThumb =
    //     'polygon(100% 0%, 75% 50%, 100% 100%, 25% 100%, 50% 50%, 25% 0%)';
    // } else {
    //   clipShapeNodeThumb =
    //     'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)';
    // }

    // if (this.containerNode) {
    //   isTransparent = true;
    // }

    const leftPosition =
      connectionType === ThumbConnectionType.start
        ? 'left-[9px]'
        : 'left-[9px]';
    const innerCircle = createElement(
      'div',
      {
        class: `absolute rounded top-[3px] outline outline-[2px] outline-slate-800 outline-solid ${leftPosition} ${additionalInnerCirlceClasses}`, //top-[3px] left-[3px
        style: {
          width: `${(radius ?? thumbRadius) - 3}px`, // -6
          height: `${(radius ?? thumbRadius) * 2 - 6}px`, // -6
          'clip-path':
            thumbShape === 'diamond'
              ? 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%'
              : clipShapeNodeThumb,
          'background-color': isTransparent
            ? 'transparent'
            : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      },
      this.circleElement.domElement
    );
    if (thumb.thumbConstraint === 'vec3' || thumb.thumbConstraint === 'vec2') {
      const icon =
        thumb.thumbConstraint === 'vec3' ? thumbThreeDots() : thumbTwoDots();
      if (icon) {
        const element = createElementFromTemplate(createTemplate(icon));
        element.remove();

        const iconWrapper = createElement(
          'div',
          {
            class: 'pointer-events-none relative',
          },
          innerCircle.domElement
        );

        createElement(
          'div',
          {
            class: `pointer-events-none absolute ${
              thumb.connectionType === ThumbConnectionType.start
                ? 'top-[2px] -left-[4px]'
                : '-top-[10px] -left-[10px]'
            }`,
          },
          iconWrapper.domElement,
          element
        );
      }
    } else if (label) {
      let clipPath = '';
      let innerLabelClasses = `pointer-events-none absolute ${thumbFontSizeClass} flex items-center justify-center
        ${thumbInnerCircleSizeClasses} ${thumbTextBaseSizeClass}
        text-center
        top-[-1px] text-black `;

      if (
        (connectionType === ThumbConnectionType.end && !this.containerNode) ||
        (this.containerNode && connectionType === ThumbConnectionType.start)
      ) {
        innerLabelClasses = `pointer-events-none relative text-[8px] flex items-center justify-center
         ${thumbTextBaseSizeClass}
        text-center
        text-black h-[20px] w-[12px] pb-[1.5px] ${
          this.containerNode ? 'top-[2px]' : ''
        }`;
        clipPath = 'none';
      }

      createElement(
        'div',
        {
          class: innerLabelClasses,
          style: {
            'clip-path': clipPath,
          },
        },
        innerCircle.domElement,
        label
      );
    }
    elements.set(this.nodeComponent.id, this.nodeComponent);
    this.nodeComponent.connectionControllerType = connectionControllerType;
    this.nodeComponent.x = xInitial ? parseInt(xInitial.toString()) : 0;
    this.nodeComponent.y = yInitial ? parseInt(yInitial.toString()) : 0;
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

  newCurve: CubicBezierConnection<T> | undefined;

  onPointerOver = (_e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }

    console.log(
      'node-connector THUMB svg pointerover',
      this.nodeComponent?.id,
      this.nodeComponent,
      this.nodeComponent?.isConnectPoint
    );

    // TODO: Fix this scenaerio:
    // - hover over rect-thumb..
    // - when the below log appears...
    // - start dragging and chance is big that connection is being dragged away
    // ... which is NOT allowed

    // TODO : check if this node has a connection .. and if maxConnections is reached ...
    //   ... then dont allow to connect from this node
    //   ... but only do this when NOT while dragging a connection

    // TODO : check if hovering input thumb node-connector.. then dont change the below...
    //   ... but only do this when NOT while dragging a connection
    const state = this.interactionStateMachine.getCurrentInteractionState();

    if (state.state === InteractionState.Idle) {
      if (
        this.nodeComponent.thumbConnectionType === ThumbConnectionType.start
      ) {
        const node = this.nodeComponent.thumbLinkedToNode;
        if (node) {
          const connections = node.connections.filter((c) => {
            return c.startNodeThumb?.id === this.nodeComponent?.id;
          });

          const maxConnections = this.nodeComponent.maxConnections ?? 1;
          if (connections && connections.length > 0) {
            if (maxConnections !== -1) {
              if (connections.length >= maxConnections) {
                (
                  this.nodeComponent.domElement as unknown as SVGElement
                ).classList.remove('cursor-pointer');
                console.log('start thumb has max connections reached');
                return;
              }
            }
          }
        }
      } else if (
        this.nodeComponent.thumbConnectionType === ThumbConnectionType.end
      ) {
        const node = this.nodeComponent.thumbLinkedToNode;
        if (node) {
          const connections = node.connections.filter((c) => {
            return c.endNodeThumb?.id === this.nodeComponent?.id;
          });
          if (connections && connections.length > 0) {
            const maxConnections = this.nodeComponent.maxConnections ?? 1;
            if (maxConnections !== -1) {
              if (connections.length >= maxConnections) {
                (
                  this.nodeComponent.domElement as unknown as SVGElement
                ).classList.remove('cursor-pointer');
                console.log('end thumb has max connections reached');
                return;
              }
            }
          }
        }
      }
    }

    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      'cursor-pointer'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      'cursor-pointer'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      'hover'
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
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.remove('hover');

            console.log(
              'svg cant register drop target for current dragging element'
            );
            return;
          } else {
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.add('hover');
            // (
            //   this.nodeComponent.domElement as unknown as SVGElement
            // ).style.filter = 'invert(1)';
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
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        'hover'
      );
    }
    if (this.nodeComponent && this.nodeComponent.getThumbCircleElement) {
      console.log('RESET THUMB CIRCLE ELEMENT on pointer leave');
      const circleDomElement = this.nodeComponent.getThumbCircleElement();

      circleDomElement.classList.add('pointer-events-auto');
      circleDomElement.classList.remove('pointer-events-none');
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

    console.log(
      'node-connector THUMB initiateDraggingConnection',
      connectionThumb
    );

    const rectCamera = transformCameraSpaceToWorldSpace(
      elementRect.x,
      elementRect.y
    );

    let parentX = 0;
    let parentY = 0;
    if (this.containerNode) {
      if (this.containerNode && this.containerNode?.getParentedCoordinates) {
        const parentCoordinates =
          this.containerNode?.getParentedCoordinates() ?? {
            x: 0,
            y: 0,
          };
        // parentX = this.containerNode.x - paddingRect;
        // parentY = this.containerNode.y - paddingRect;
        parentX = parentCoordinates.x; // + paddingRect;
        parentY = parentCoordinates.y + paddingRect;
      }
    }

    const interactionInfoResult = pointerDown(
      x - rectCamera.x + parentX - paddingRect,
      y - rectCamera.y + parentY,
      connectionThumb,
      this.canvas,
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
    console.log(
      'node-connector Thumb onPointerDown',
      e.target,
      this.nodeComponent?.id,
      (this.nodeComponent?.domElement as any).classList
    );
    this.newCurve = undefined;
    if (this.disableInteraction) {
      return;
    }

    if (this.nodeComponent) {
      if (this.nodeComponent.thumbType === ThumbType.Center) {
        return;
      }

      if (this.nodeComponent.thumbLinkedToNode && this.canvas) {
        const endConnections =
          this.nodeComponent.thumbLinkedToNode?.connections.filter(
            (c) => c.endNodeThumb?.id === this.nodeComponent?.id
          );
        if (endConnections && endConnections.length > 0) {
          return;
        }
      }

      e.stopPropagation();

      if (
        this.nodeComponent.thumbConnectionType === ThumbConnectionType.start &&
        this.nodeComponent.isConnectPoint &&
        this.parentRectNode &&
        this.canvasElements
      ) {
        // thumb can (currently) have max 1 output connection
        if (this.nodeComponent.thumbLinkedToNode) {
          if (this.nodeComponent.maxConnections !== -1) {
            console.log('check outputs', this.nodeComponent.thumbLinkedToNode);
            const connections = (
              this.nodeComponent
                .thumbLinkedToNode as unknown as IRectNodeComponent<T>
            )?.connections;
            const connectionCount = connections?.filter((connection) => {
              return connection.startNodeThumb?.id === this.nodeComponent?.id;
            }).length;
            if (connectionCount && connectionCount > 0) {
              console.log('output connection already exists', connectionCount);
              return;
            }
          }
        }

        let parentX = 0;
        let parentY = 0;
        if (this.containerNode) {
          if (
            this.containerNode &&
            this.containerNode?.getParentedCoordinates
          ) {
            const parentCoordinates =
              this.containerNode?.getParentedCoordinates() ?? {
                x: 0,
                y: 0,
              };
            // parentX = this.containerNode.x - paddingRect;
            // parentY = this.containerNode.y - paddingRect;
            parentX = parentCoordinates.x - paddingRect;
            parentY = parentCoordinates.y - paddingRect;
          }
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

        if (curve.nodeComponent?.connectionEndNodeThumb) {
          const circleDomElement =
            curve.nodeComponent?.connectionEndNodeThumb.getThumbCircleElement?.();
          if (circleDomElement) {
            circleDomElement.classList.remove('pointer-events-auto');
            circleDomElement.classList.add('pointer-events-none');
          }
          const domEndNodeThumbElement = curve.nodeComponent
            .connectionEndNodeThumb.domElement as HTMLElement;
          domEndNodeThumbElement.classList.remove('pointer-events-auto');
          domEndNodeThumbElement.classList.add('pointer-events-none');
          domEndNodeThumbElement.classList.add('dragging');
        }
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
        this.newCurve = curve;

        if (this.setCanvasAction) {
          this.setCanvasAction(CanvasAction.newConnectionCreated, curve);
        }

        if (curve && this.canvas) {
          curve.nodeComponent.startNode = this.parentRectNode;
          curve.nodeComponent.startNodeThumb = this.nodeComponent;
          this.parentRectNode.connections?.push(curve.nodeComponent);

          if (curve.nodeComponent.startNodeThumb.isDataPort) {
            curve.nodeComponent.isData = true;
          }

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

      let parentX = 0;
      let parentY = 0;
      if (this.nodeComponent?.parent?.containerNode) {
        if (this.nodeComponent?.parent?.containerNode) {
          if (
            this.nodeComponent?.parent?.containerNode &&
            this.nodeComponent?.parent?.containerNode?.getParentedCoordinates
          ) {
            const parentCoordinates =
              this.nodeComponent?.parent?.containerNode?.getParentedCoordinates() ?? {
                x: 0,
                y: 0,
              };
            // parentX = this.nodeComponent?.parent?.containerNode.x; //- paddingRect;
            // parentY = this.nodeComponent?.parent?.containerNode.y; //- paddingRect;
            parentX = parentCoordinates.x;
            parentY = parentCoordinates.y;
          }
        }
      }
      console.log(
        'thumb 3',
        x,
        y,
        this.nodeComponent?.nodeType,
        this.nodeComponent?.thumbType,
        this.nodeComponent?.thumbConnectionType,
        'parent',
        this.nodeComponent?.parent,
        'containers',
        this.containerNode,
        this.nodeComponent?.parent?.containerNode
      );

      // TODO : check if wihtin container... then use container x/y as parentX/Y....
      const rectCamera = transformCameraSpaceToWorldSpace(
        elementRect.x,
        elementRect.y
      );

      const interactionInfoResult = pointerDown(
        x - rectCamera.x + parentX,
        y - rectCamera.y + parentY,
        this.nodeComponent,
        this.canvas as IElementNode<T>,
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
        this.canvas as IElementNode<T>,
        this.interactionInfo,
        this.interactionStateMachine
      );
    }
  };

  resetNodeThumbInteraction = () => {
    if (this.nodeComponent && this.nodeComponent.domElement) {
      (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
        'none';

      const circleDomElement = this.circleElement?.domElement as unknown as
        | HTMLElement
        | SVGElement;
      console.log(
        'THUMB onPointerUp circleDomElement (BEFORE remove pointer-events-none)',
        circleDomElement
      );
      circleDomElement.classList.add('pointer-events-auto');
      circleDomElement.classList.remove('pointer-events-none');
    }
  };

  onPointerUp = (e: PointerEvent) => {
    console.log(
      'thumb onPointerUp',
      this.nodeComponent?.id,
      this.interactionStateMachine.getCurrentInteractionState()
    );
    const state = this.interactionStateMachine.getCurrentInteractionState();
    if (state.state === InteractionState.Idle) {
      if (this.newCurve) {
        this.newCurve.startPointElement?.domElement?.remove();
        this.newCurve.endPointElement?.domElement?.remove();
        if (this.newCurve.nodeComponent) {
          this.newCurve.nodeComponent.domElement?.remove();
        }
        if (this.nodeComponent) {
          const node = this.nodeComponent.thumbLinkedToNode;
          if (node) {
            node.connections = node.connections.filter((c) => {
              return c.id !== this.newCurve?.nodeComponent?.id;
            });
          }
        }
        this.newCurve = undefined;
        this.resetNodeThumbInteraction();
      }
    }
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }
    this.resetNodeThumbInteraction();
    const { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
    pointerUp(
      x,
      y,
      this.nodeComponent,
      this.canvas as IElementNode<T>,
      this.interactionInfo,
      this.interactionStateMachine
    );
  };

  onPointerThumbUp = () => {
    console.log('thumb onPointerThumbUp', this.nodeComponent?.id);

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
    // const dropTarget =
    //   this.interactionStateMachine.getCurrentDropTarget() as unknown as IThumbNodeComponent<T>;
    // const state = this.interactionStateMachine.getCurrentInteractionState();
    // if (dropTarget && state) {
    //   console.log(
    //     'DROPPED ON TARGET',
    //     dropTarget.id,
    //     this.nodeComponent.id,
    //     this.nodeComponent.connectionControllerType,
    //     this.nodeComponent.onReceiveDraggedConnection
    //   );

    //   if (dropTarget.nodeType === NodeType.Shape) {
    //     const rectNode = dropTarget as unknown as IRectNodeComponent<T>;
    //     const connection = this.nodeComponent
    //       .parent as unknown as IConnectionNodeComponent<T>;
    //     if (connection) {
    //       if (rectNode.thumbConnectors?.[0].thumbType === ThumbType.Center) {
    //         connection.endNode = rectNode;
    //         connection.endNodeThumb = rectNode.thumbConnectors?.[0];

    //         rectNode.connections?.push(connection);

    //         connection.update?.(
    //           connection,
    //           connection.endNode?.x ?? 0,
    //           connection.endNode?.y ?? 0,
    //           rectNode
    //         );
    //       }
    //     }
    //   } else if (
    //     dropTarget.onReceiveDraggedConnection &&
    //     dropTarget.id !== this.nodeComponent.id
    //   ) {
    //     dropTarget.onReceiveDraggedConnection(dropTarget, this.nodeComponent);
    //   }
    // }

    // console.log(
    //   'THUMB svg pointerup nodecomponent (BEFORE remove pointer-events-none)',
    //   this.nodeComponent.id,
    //   this.nodeComponent,
    //   dropTarget
    // );
    // this.interactionStateMachine.clearDropTarget(this.nodeComponent);

    // // TODO : DO THIS ONLY IF NOT CONNECTED TO A RECT THUMB !?
    // //  ... looks like this happens AFTER the fix and not BEFORE !??

    // const circleDomElement = this.circleElement?.domElement as unknown as
    //   | HTMLElement
    //   | SVGElement;
    // circleDomElement.classList.add('pointer-events-auto');
    // circleDomElement.classList.remove('pointer-events-none');
  };
}
