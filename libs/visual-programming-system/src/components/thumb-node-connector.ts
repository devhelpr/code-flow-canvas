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
import { getPointerPos } from '../utils/pointer-pos';
import { BaseNodeInfo } from '../types/base-node-info';

export class ThumbNodeConnector<T extends BaseNodeInfo> extends ThumbNode<T> {
  rootElement: HTMLElement | undefined = undefined;
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
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void,
    rootElement?: HTMLElement
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
    this.rootElement = rootElement;
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
        class: `${this.cssClasses.nodePortClasses} ${
          disableInteraction
            ? this.cssClasses.noPointerEvents
            : this.cssClasses.autoPointerEvents
        }        
        `,
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
    if (!this.circleElement) {
      throw new Error('circleElement is undefined');
    }
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
          class: `${this.cssClasses.prefixIconClasses} ${thumb.prefixIcon}`,
        },
        this.circleElement.domElement
      );
    }
    if (thumb.prefixLabel) {
      createElement(
        'div',
        {
          class: `${this.cssClasses.prefixLabelClasses} ${
            thumb.prefixLabelCssClass ?? 'text-white'
          } ${
            thumb.connectionType === ThumbConnectionType.end
              ? this.cssClasses.prefixLabelEndClasses
              : this.cssClasses.prefixLabelStartClasses
          }`,
        },
        this.circleElement.domElement,
        thumb.prefixLabel
      );
    }
    let additionalInnerCirlceClasses = '';
    if (connectionType === ThumbConnectionType.end) {
      additionalInnerCirlceClasses = this.cssClasses.innerCircleClasses;
    }

    if (disableInteraction) {
      additionalInnerCirlceClasses += ` ${this.cssClasses.autoPointerEvents}`;
    }

    (
      this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
    ).classList.add(this.cssClasses.nodePort);

    const clipShapeNodeThumb = 'none';

    isTransparent = false;

    const leftPosition =
      connectionType === ThumbConnectionType.start
        ? this.cssClasses.circlePositionConnectionTypeStart
        : this.cssClasses.circlePositionConnectionTypeEnd;

    const innerCircle = createElement(
      'div',
      {
        class: `${this.cssClasses.innerCircleDefaultClasses} ${leftPosition} ${additionalInnerCirlceClasses}`,
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
    if (!innerCircle) {
      throw new Error('iconWrapper is undefined');
    }
    if (thumb.thumbConstraint === 'vec3' || thumb.thumbConstraint === 'vec2') {
      const icon =
        thumb.thumbConstraint === 'vec3' ? thumbThreeDots() : thumbTwoDots();
      if (icon) {
        const element = createElementFromTemplate(createTemplate(icon));
        if (element) {
          element.remove();
        }

        const iconWrapper = createElement(
          'div',
          {
            class: this.cssClasses.iconWrapperClasses,
          },
          innerCircle.domElement
        );
        if (!iconWrapper) {
          throw new Error('iconWrapper is undefined');
        }

        createElement(
          'div',
          {
            class: `${this.cssClasses.iconClasses} ${
              thumb.connectionType === ThumbConnectionType.start
                ? this.cssClasses.iconPositionConnectionTypeStart
                : this.cssClasses.iconPositionConnectionTypeEnd
            }`,
          },
          iconWrapper.domElement,
          element
        );
      }
    } else if (label) {
      let clipPath = '';
      let innerLabelClasses = `${this.cssClasses.innerLabelClasses} 
        ${thumbFontSizeClass} 
        ${thumbInnerCircleSizeClasses} ${thumbTextBaseSizeClass}        
        `;

      if (
        (connectionType === ThumbConnectionType.end && !this.containerNode) ||
        (this.containerNode && connectionType === ThumbConnectionType.start)
      ) {
        innerLabelClasses = `${
          this.cssClasses.innerLabelAltClasses
        }              
         ${thumbTextBaseSizeClass} ${this.containerNode ? 'top-[2px]' : ''}`;
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

    const rectBounds = (
      innerCircle.domElement as HTMLElement
    ).getBoundingClientRect();
    let nodeThumbWidth = thumbWidth;
    let nodeThumbHeight = thumbHeight;
    if (rectBounds) {
      nodeThumbWidth = rectBounds.width;
      nodeThumbHeight = rectBounds.height;
    }
    this.nodeComponent.connectionControllerType = connectionControllerType;
    this.nodeComponent.x = xInitial ? parseInt(xInitial.toString()) : 0;
    this.nodeComponent.y = yInitial ? parseInt(yInitial.toString()) : 0;
    this.nodeComponent.nodeType = nodeType;
    this.nodeComponent.width = nodeThumbWidth;
    this.nodeComponent.height = nodeThumbHeight;
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
        circleDomElement.classList.remove(this.cssClasses.noPointerEvents);
        circleDomElement.classList.add(this.cssClasses.autoPointerEvents);
      } else {
        circleDomElement.classList.remove(this.cssClasses.autoPointerEvents);
        circleDomElement.classList.add(this.cssClasses.noPointerEvents);
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
                ).classList.remove(this.cssClasses.onPointerOverCursor);
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
                ).classList.remove(this.cssClasses.onPointerOverCursor);
                console.log('end thumb has max connections reached');
                return;
              }
            }
          }
        }
      }
    }

    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.onPointerOverCursor
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      this.cssClasses.onPointerOverCursor
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      this.cssClasses.hover
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.cursorNotAllowed
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
            ).classList.remove(this.cssClasses.onPointerOverCursor);
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.add(this.cssClasses.cursorNotAllowed);
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.remove(this.cssClasses.hover);

            console.log(
              'svg cant register drop target for current dragging element'
            );
            return;
          } else {
            (
              this.nodeComponent.domElement as unknown as SVGElement
            ).classList.add(this.cssClasses.hover);
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
        this.cssClasses.cursorNotAllowed
      );
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        this.cssClasses.onPointerOverCursor
      );
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        this.cssClasses.hover
      );
    }
    if (this.nodeComponent && this.nodeComponent.getThumbCircleElement) {
      console.log('RESET THUMB CIRCLE ELEMENT on pointer leave');
      const circleDomElement = this.nodeComponent.getThumbCircleElement();

      circleDomElement.classList.add(this.cssClasses.autoPointerEvents);
      circleDomElement.classList.remove(this.cssClasses.noPointerEvents);
    }
  };

  initiateDraggingConnection = (
    connectionThumb: IThumbNodeComponent<T>,
    x: number,
    y: number,
    rootX: number,
    rootY: number
  ) => {
    if (!this.canvas || !this.rootElement) {
      return;
    }

    // TODO: use different reference ??? maybe the node-thumb ??
    const elementRect =
      //connectionThumb.domElement as unknown as HTMLElement | SVGElement
      (
        this.nodeComponent?.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();
    // const rootBounds = (
    //   this.rootElement as HTMLElement
    // ).getBoundingClientRect();

    // const rectCamera = transformCameraSpaceToWorldSpace(
    //   elementRect.x - rootBounds.x, // window.scrollX,
    //   elementRect.y - rootBounds.y // window.scrollY
    // );

    const rectCamera = this.containerNode
      ? transformCameraSpaceToWorldSpace(elementRect.x, elementRect.y)
      : transformCameraSpaceToWorldSpace(
          elementRect.x - rootX,
          elementRect.y - rootY
        );

    const parentX = 0;
    const parentY = 0;
    // if (this.containerNode) {
    //   if (this.containerNode && this.containerNode?.getParentedCoordinates) {
    //     const parentCoordinates =
    //       this.containerNode?.getParentedCoordinates() ?? {
    //         x: 0,
    //         y: 0,
    //       };
    //     // parentX = this.containerNode.x - paddingRect;
    //     // parentY = this.containerNode.y - paddingRect;
    //     parentX = parentCoordinates.x; // + paddingRect;
    //     parentY = parentCoordinates.y + paddingRect;
    //   }
    // }

    console.log(
      'node-connector THUMB initiateDraggingConnection',
      this.canvas.id,
      this.canvas,
      connectionThumb,
      this.containerNode,
      elementRect.x,
      elementRect.y,
      // x - rectCamera.x + parentX - paddingRect,
      // y - rectCamera.y + parentY,
      // x + parentX,
      // y + parentY
      rectCamera.x,
      rectCamera.y
      // parentX,
      // parentY
      // x,
      // y
    );

    const interactionInfoResult = pointerDown(
      x - rectCamera.x + parentX - (this.containerNode ? 0 : paddingRect),
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

      circleDomElement.classList.remove(this.cssClasses.autoPointerEvents);
      circleDomElement.classList.add(this.cssClasses.noPointerEvents);
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
    if (!this.rootElement) {
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
        this.canvasElements &&
        this.rootElement
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
        if (!this.canvas) {
          return;
        }
        const { pointerXPos, pointerYPos, rootX, rootY } = getPointerPos(
          this.canvas.domElement as HTMLElement,
          this.rootElement,
          e
        );
        let { x, y } = transformCameraSpaceToWorldSpace(
          pointerXPos,
          pointerYPos
        );
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
          x, //+ 40,
          y,
          x, // + 20,
          y,
          x, //+ 40,
          y,
          false,
          undefined,
          this.canvasUpdated,
          undefined,
          this.containerNode,
          undefined,
          undefined,
          this.rootElement
        );

        // Waarom is x/y kleiner dan 0?
        console.log(
          'x y',
          event?.target,
          xorg,
          yorg,
          x,
          y,
          parentX,
          parentY,
          this.canvas.domElement as HTMLElement,
          this.rootElement
        );
        if (curve.nodeComponent?.connectionEndNodeThumb) {
          const circleDomElement =
            curve.nodeComponent?.connectionEndNodeThumb.getThumbCircleElement?.();
          if (circleDomElement) {
            circleDomElement.classList.remove(
              this.cssClasses.autoPointerEvents
            );
            circleDomElement.classList.add(this.cssClasses.noPointerEvents);
          }
          const domEndNodeThumbElement = curve.nodeComponent
            .connectionEndNodeThumb.domElement as HTMLElement;
          domEndNodeThumbElement.classList.remove(
            this.cssClasses.autoPointerEvents
          );
          domEndNodeThumbElement.classList.add(this.cssClasses.noPointerEvents);
          domEndNodeThumbElement.classList.add(this.cssClasses.dragging);
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

        if (
          curve &&
          this.canvas
          //curve.nodeComponent.connectionEndNodeThumb
        ) {
          curve.nodeComponent.startNode = this.parentRectNode;
          curve.nodeComponent.startNodeThumb = this.nodeComponent;
          this.parentRectNode.connections?.push(curve.nodeComponent);

          if (curve.nodeComponent.startNodeThumb.isDataPort) {
            curve.nodeComponent.isData = true;
          }

          // uncommenting this causes a weird initial positioning issue when dragging a new
          // connection from a node/thumb-node-connector

          if (!this.containerNode) {
            if (curve.nodeComponent.update) {
              curve.nodeComponent.update();
            }
          }

          this.initiateDraggingConnection(
            curve.endPointElement,
            //curve.nodeComponent.connectionEndNodeThumb,
            xorg + parentX,
            yorg + parentY,
            rootX,
            rootY
          );
        }

        return;
      }

      if (this.nodeComponent.isControlled) {
        return;
      }

      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      if (!this.canvas || !this.rootElement) {
        return;
      }
      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        e
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );

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

      const rootBounds = (
        this.rootElement as HTMLElement
      ).getBoundingClientRect();
      // TODO : check if wihtin container... then use container x/y as parentX/Y....
      const rectCamera = transformCameraSpaceToWorldSpace(
        elementRect.x - rootBounds.x, //+ window.scrollX,
        elementRect.y - rootBounds.y //+ window.scrollY
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
        circleDomElement.classList.remove(this.cssClasses.autoPointerEvents);
        circleDomElement.classList.add(this.cssClasses.noPointerEvents);
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
      if (!this.canvas || !this.rootElement) {
        return;
      }
      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        e
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );
      //console.log('pointermove thumb-node-connector', x, y);
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
      circleDomElement.classList.add(this.cssClasses.autoPointerEvents);
      circleDomElement.classList.remove(this.cssClasses.noPointerEvents);
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
    if (!this.canvas || !this.rootElement) {
      return;
    }
    const { pointerXPos, pointerYPos } = getPointerPos(
      this.canvas.domElement as HTMLElement,
      this.rootElement,
      e
    );
    const { x, y } = transformCameraSpaceToWorldSpace(pointerXPos, pointerYPos);
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
    // console.log('thumb onPointerThumbUp', this.nodeComponent?.id);
    // if (this.disableInteraction) {
    //   return;
    // }
    // if (!this.nodeComponent) {
    //   return;
    //}
  };
}
