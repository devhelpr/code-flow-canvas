import { transformCameraSpaceToWorldSpace } from '../camera';
import { IBaseFlow } from '../canvas-app/base-flow';
import {
  thumbRadius,
  thumbWidth,
  thumbHeight,
  thumbHalfWidth,
  thumbHalfHeight,
} from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  IRectNodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { ConnectionControllerType, ThumbType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { NodeType } from '../types/node-type';
import { createElement } from '../utils';
import { getPointerPos } from '../utils/pointer-pos';
import { Connection, ConnectionUpdateState } from './connection';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';
import { ThumbNode } from './thumb';

export class ThumbConnectionController<
  T extends BaseNodeInfo
> extends ThumbNode<T> {
  rootElement: HTMLElement | undefined = undefined;
  connectionInstance: Connection<T> | undefined = undefined;
  canvasApp?: IBaseFlow<T>;
  constructor(
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
    rootElement?: HTMLElement,
    connectionInstance?: Connection<T>,
    canvasApp?: IBaseFlow<T>
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
      `${additionalClasses}`,
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
      containerNode
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }

    this.connectionInstance = connectionInstance;
    this.canvasApp = canvasApp;
    this.rootElement = rootElement;
    if (connectionControllerType !== undefined) {
      (this.nodeComponent.domElement as HTMLElement).classList.add(
        `connection-controller-${connectionControllerType}`
      );
    }
    (this.nodeComponent.domElement as HTMLElement).classList.remove(
      this.cssClasses.noPointerEvents
    );
    this.nodeComponent.thumbName = thumbName;
    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;

    (this.nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
      this.nodeComponent.id;

    (
      this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
    ).style.clipPath = this.cssClasses.clipPathStyle;
    (
      this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
    ).classList.add(this.cssClasses.connectionController);

    const clipPathMainElement = this.cssClasses.clipPathStyle;
    const size = (radius ?? thumbRadius) * 2;
    const tx = -(radius ?? thumbRadius) + (width ?? thumbWidth) / 2;
    const ty = -(radius ?? thumbRadius) + (height ?? thumbHeight) / 2;

    // const clipPathMainElement = 'circle(100%)';
    // const customWidhtHeight = 14;
    // const customRadius = 7;
    // const size = customRadius * 2;
    // // const tx = -customRadius + customWidhtHeight / 2;
    // // const ty = -customRadius + customWidhtHeight / 2;
    // const tx = -(radius ?? thumbRadius) + (width ?? thumbWidth) / 2;
    // const ty = -(radius ?? thumbRadius) + (height ?? thumbHeight) / 2;
    this.circleElement = createElement(
      'div',
      {
        class: `${
          this.cssClasses.noPointerEvents
          // disableInteraction
          //   ? this.cssClasses.noPointerEvents
          //   : this.cssClasses.autoPointerEvents
        }                
        ${this.cssClasses.circleClasses}`,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          transform: `translate(${tx}px, ${ty}px)`,
          'clip-path': clipPathMainElement,
          'background-color': isTransparent
            ? 'transparent'
            : borderColor
            ? borderColor
            : 'black',
        },
      },
      this.nodeComponent.domElement
    );
    const domElement = this.nodeComponent.domElement as HTMLElement;
    domElement.addEventListener('pointerover', this.onPointerOver);
    domElement.addEventListener('pointerleave', this.onPointerLeave);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.classList.remove(this.cssClasses.noPointerEvents);
    domElement.classList.add(this.cssClasses.autoPointerEvents);
    if (!this.circleElement) throw new Error('circleElement is undefined');

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
      console.log('setVisibilty thumb connection: remove noPointerEvents');
      // if (visible && !disableInteraction) {
      //   const circleDomElement = this.circleElement
      //     ?.domElement as unknown as SVGElement;
      //   circleDomElement.classList.remove(this.cssClasses.noPointerEvents);
      //   circleDomElement.classList.add(this.cssClasses.autoPointerEvents);
      // }
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

  connectConnection = () => {
    (this.nodeComponent?.domElement as HTMLElement).setAttribute(
      'connection-id',
      this.nodeComponent?.parent?.id ?? ''
    );
  };

  onPointerOver = (_e: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }

    console.log(
      'connection-controller THUMB svg pointerover',
      this.nodeComponent?.id,
      this.nodeComponent,
      this.nodeComponent?.isConnectPoint
    );

    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      this.cssClasses.onPointerOverPointer
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      this.cssClasses.hovering
    );
  };

  onPointerLeave = (event: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.onPointerOverCreateConnection
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.onPointerOverPointer
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.hovering
    );
    const element = document.elementFromPoint(event.pageX, event.pageY);

    if (
      !this.nodeComponent ||
      (element && element !== event.target && element.id !== 'root')
    ) {
      if (element) {
        element.dispatchEvent(new PointerEvent('pointerleave', event));
      }
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
        this.cssClasses.onPointerOverCreateConnection
      );
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        this.cssClasses.onPointerOverPointer
      );
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        this.cssClasses.hovering
      );
    }
  };

  initiateDraggingConnection = (
    connectionThumb: IThumbNodeComponent<T>,
    _x: number,
    _y: number
    // _rootX: number,
    // _rootY: number,
    // _parentXcaller: number,
    // _parentYcaller: number
  ) => {
    if (!this.canvas || !this.rootElement) {
      return;
    }

    // const elementRect = (
    //   connectionThumb.domElement as unknown as HTMLElement | SVGElement
    // ).getBoundingClientRect();

    // const rectCamera = this.nodeComponent?.parent?.containerNode
    //   ? transformCameraSpaceToWorldSpace(elementRect.x, elementRect.y)
    //   : transformCameraSpaceToWorldSpace(
    //       elementRect.x - rootX,
    //       elementRect.y - rootY
    //     );

    // console.log(
    //   'connection-controller THUMB initiateDraggingConnection',
    //   this.canvas,
    //   connectionThumb,
    //   this.nodeComponent?.parent?.containerNode,
    //   elementRect.x,
    //   elementRect.y,
    //   rectCamera.x,
    //   rectCamera.y
    // );

    const interactionInfoResult = pointerDown(
      thumbHalfWidth, //x - rectCamera.x + parentX,
      thumbHalfHeight, //y - rectCamera.y + parentY,
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
      // const circleDomElement = connectionThumb.getThumbCircleElement();

      // circleDomElement.classList.remove(this.cssClasses.autoPointerEvents);

      // circleDomElement.classList.add(this.cssClasses.noPointerEvents);
      console.log('NOPOINTEREVENTS (ADD)');

      const domNodeElement = this.nodeComponent
        ?.domElement as unknown as HTMLElement;
      domNodeElement.classList.remove(this.cssClasses.autoPointerEvents);
      domNodeElement.classList.add(this.cssClasses.noPointerEvents);
      domNodeElement.classList.add(this.cssClasses.dragging);
    }
  };
  previousStartNode: IRectNodeComponent<T> | undefined = undefined;
  previousEndNode: IRectNodeComponent<T> | undefined = undefined;
  onPointerDown = (e: PointerEvent) => {
    console.log(
      'connection-controller onPointerDown',
      this.nodeComponent?.id,
      this.canvasApp?.sendDebugInfo
    );
    if (this.disableInteraction) {
      return;
    }

    this.oldElement = null;
    if (this.nodeComponent) {
      if (this.nodeComponent.thumbType === ThumbType.Center) {
        return;
      }

      e.stopPropagation();

      // lookup connection to with this connection-controller as start point
      const connection = this.nodeComponent
        .parent as unknown as IConnectionNodeComponent<T>;
      console.log(
        'connection-controller thumb 1',
        this.nodeComponent.connectionControllerType,
        connection
      );
      if (connection && this.canvas && connection.startNodeThumb) {
        const connectionThumb =
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.begin
            ? connection.connectionStartNodeThumb
            : undefined;
        if (connectionThumb && this.rootElement) {
          const {
            pointerXPos,
            pointerYPos,
            rootX,
            rootY,
            eventClientX,
            eventClientY,
          } = getPointerPos(
            this.canvas.domElement as HTMLElement,
            this.rootElement,
            e
          );
          const { x: rootXCamera, y: rootYCamera } =
            transformCameraSpaceToWorldSpace(rootX, rootY);

          const { x: clientXCamera, y: clientYCamera } =
            transformCameraSpaceToWorldSpace(eventClientX, eventClientY);

          const xpos = clientXCamera - rootXCamera;
          const ypos = clientYCamera - rootYCamera;
          const { x, y } = transformCameraSpaceToWorldSpace(
            pointerXPos,
            pointerYPos
          );

          this.previousStartNode = connection.startNode;
          connection.startNode = undefined;
          connection.startNodeThumb = undefined;
          console.log('x y', event?.target, x, y);

          console.log('initiateDraggingConnection 1');
          this.initiateDraggingConnection(
            connectionThumb,
            xpos, //x + parentX,
            ypos //y + parentY,
          );
          return;
        }
      }
      console.log(
        'connection-controller thumb 2',
        connection.endNodeThumb,
        this.canvas,
        this.rootElement,
        this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.end
      );
      if (
        connection &&
        this.canvas &&
        connection.endNodeThumb &&
        this.canvasApp
      ) {
        const connectionThumb =
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.end
            ? connection.connectionEndNodeThumb
            : undefined;
        console.log(
          'connection-controller thumb 3',
          connectionThumb,
          this.rootElement
        );
        if (connectionThumb && this.rootElement) {
          const { x, y } = this.canvasApp.getPointerPositionInLocalSpace(e);

          this.previousEndNode = connection.endNode;
          connection.endNode = undefined;
          connection.endNodeThumb = undefined;

          console.log('x y (2)', event?.target, x, y);
          console.log('initiateDraggingConnection 2');
          this.initiateDraggingConnection(connectionThumb, x, y);
          return;
        }
      }

      if (this.nodeComponent.isControlled) {
        return;
      }
      if (!this.canvas || !this.rootElement) {
        return;
      }

      // handle dragging of connection thumbs when not connected to node

      const {
        pointerXPos,
        pointerYPos,
        rootX,
        rootY,
        eventClientX,
        eventClientY,
      } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        e
      );
      const { x: rootXCamera, y: rootYCamera } =
        transformCameraSpaceToWorldSpace(rootX, rootY);

      const { x: clientXCamera, y: clientYCamera } =
        transformCameraSpaceToWorldSpace(eventClientX, eventClientY);

      const xpos = clientXCamera - rootXCamera;
      const ypos = clientYCamera - rootYCamera;
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );

      console.log('x y (3)', event?.target, x, y);

      console.log(
        'initiateDraggingConnection 3',
        event?.target,
        this.nodeComponent
      );
      this.initiateDraggingConnection(this.nodeComponent, xpos, ypos);
    }
  };
  oldElement: Element | null = null;
  onPointerMove = (event: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    if (!this.nodeComponent) {
      return;
    }
    let element = document.elementFromPoint(event.pageX, event.pageY);
    let dispatchEventToNode = false;
    if (element && element !== event.target && element.id !== 'root') {
      if (element.getAttribute('data-nodecomponent')) {
        dispatchEventToNode = true;
      } else if (
        element.parentElement &&
        element.parentElement.getAttribute('data-nodecomponent')
      ) {
        element = element.parentElement;
        dispatchEventToNode = true;
      } else if (
        element.parentElement &&
        element.parentElement.parentElement &&
        element.parentElement.parentElement.getAttribute('data-nodecomponent')
      ) {
        element = element.parentElement.parentElement;
        dispatchEventToNode = true;
      }
      if (dispatchEventToNode) {
        if (this.oldElement !== element) {
          if (this.oldElement !== null) {
            this.oldElement.dispatchEvent(
              new PointerEvent('pointerleave', event)
            );
          }
          console.log('dispatchEventToNode', element);
          element.dispatchEvent(new PointerEvent('pointerover', event));
        }
        this.oldElement = element;

        element.dispatchEvent(new PointerEvent('pointermove', event));
      }
    }

    if (
      !dispatchEventToNode &&
      this.nodeComponent &&
      this.nodeComponent.domElement &&
      this.canvas &&
      this.rootElement
    ) {
      this.oldElement = null;
      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        event
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );

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

  onPointerUp = (event: PointerEvent) => {
    console.log('connection-controller onPointerUp', this.nodeComponent?.id);
    if (this.disableInteraction) {
      return;
    }
    const element = document.elementFromPoint(event.pageX, event.pageY);

    if (!this.nodeComponent) {
      return;
    }

    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.onPointerOverCreateConnection
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.onPointerOverPointer
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.hovering
    );

    let skipevent = false;
    if (element && element !== event.target) {
      console.log('connection-controller onPointerUp (element)', element);
      element.dispatchEvent(new PointerEvent('pointerup', event));
      element.dispatchEvent(new PointerEvent('pointerleave', event));
      skipevent = true;
    }

    if (this.nodeComponent.domElement && this.canvas && this.rootElement) {
      (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
        'none';
      if (!skipevent) {
        const { pointerXPos, pointerYPos } = getPointerPos(
          this.canvas.domElement as HTMLElement,
          this.rootElement,
          event
        );
        const { x, y } = transformCameraSpaceToWorldSpace(
          pointerXPos,
          pointerYPos
        );
        pointerUp(
          x,
          y,
          this.nodeComponent,
          this.canvas as IElementNode<T>,
          this.interactionInfo,
          this.interactionStateMachine
        );
      }
      const circleDomElement = this.circleElement?.domElement as unknown as
        | HTMLElement
        | SVGElement;
      console.log(
        'connection-controller onPointerUp circleDomElement (BEFORE remove pointer-events-none)',
        circleDomElement
      );
      // circleDomElement.classList.add(this.cssClasses.autoPointerEvents);
      // circleDomElement.classList.remove(this.cssClasses.noPointerEvents);

      const domNodeElement = this.nodeComponent
        ?.domElement as unknown as HTMLElement;
      domNodeElement.classList.remove(this.cssClasses.noPointerEvents);
      domNodeElement.classList.add(this.cssClasses.autoPointerEvents);
    }
  };

  onPointerThumbUp = () => {
    console.log(
      'connection-controller onPointerThumbUp',
      this.nodeComponent?.id
    );

    // if (this.disableInteraction) {
    //   return;
    // }

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
          const thumbConnector = rectNode.thumbConnectors?.find(
            (thumbConnector) => {
              if (
                this.nodeComponent?.connectionControllerType ===
                  ConnectionControllerType.begin &&
                (thumbConnector.thumbConnectionType ===
                  ThumbConnectionType.start ||
                  thumbConnector.thumbConnectionType ===
                    ThumbConnectionType.startOrEnd)
              ) {
                return true;
              } else if (
                this.nodeComponent?.connectionControllerType ===
                  ConnectionControllerType.end &&
                (thumbConnector.thumbConnectionType ===
                  ThumbConnectionType.end ||
                  thumbConnector.thumbConnectionType ===
                    ThumbConnectionType.startOrEnd)
              ) {
                return true;
              }
              return false;
            }
          );

          if (thumbConnector) {
            //rectNode.thumbConnectors?.[0].thumbType === ThumbType.Center) {
            if (
              this.nodeComponent.connectionControllerType ===
              ConnectionControllerType.begin
            ) {
              if (this.previousStartNode) {
                this.previousStartNode.connections =
                  this.previousStartNode.connections?.filter(
                    (c) => c.id !== connection.id
                  );

                this.previousStartNode = undefined;
              }
              connection.startNode = rectNode;
              connection.startNodeThumb = thumbConnector; //rectNode.thumbConnectors?.[0];

              rectNode.connections?.push(connection);
              if (this.connectionInstance) {
                this.connectionInstance.connectionUpdateState =
                  ConnectionUpdateState.ConnectConnection;
              }

              if (connection.startNode?.isThumb) {
                this.setDisableInteraction();
              } else {
                this.setEnableInteraction();
              }

              connection.update?.(
                connection,
                connection.startNode?.x ?? 0,
                connection.startNode?.y ?? 0,
                rectNode
              );
            } else {
              connection.endNode = rectNode;
              connection.endNodeThumb = thumbConnector; //rectNode.thumbConnectors?.[0];
              if (this.previousEndNode) {
                this.previousEndNode.connections =
                  this.previousEndNode.connections?.filter(
                    (c) => c.id !== connection.id
                  );

                this.previousEndNode = undefined;
              }
              rectNode.connections?.push(connection);
              console.log(
                'CONNECTION CONNECTED TO END NODE',
                connection,
                rectNode
              );

              if (this.connectionInstance) {
                this.connectionInstance.connectionUpdateState =
                  ConnectionUpdateState.ConnectConnection;
              }

              if (connection.endNode?.isThumb) {
                this.setDisableInteraction();
              } else {
                this.setEnableInteraction();
              }

              connection.update?.(
                connection,
                connection.endNode?.x ?? 0,
                connection.endNode?.y ?? 0,
                rectNode
              );
            }
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
          console.log('HERE');
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
            } else {
              console.log('HERE 2 : (new) connection without end node');
            }
          }
        }
      }
    }

    console.log(
      'Connection-controller: THUMB svg pointerup nodecomponent (BEFORE remove pointer-events-none)',
      this.nodeComponent.id,
      this.nodeComponent,
      dropTarget
    );
    this.interactionStateMachine.clearDropTarget(this.nodeComponent);

    this.setEnableInteraction();

    // const circleDomElement = this.circleElement?.domElement as unknown as
    //   | HTMLElement
    //   | SVGElement;
    // circleDomElement.classList.add(this.cssClasses.autoPointerEvents);
    // circleDomElement.classList.remove(this.cssClasses.noPointerEvents);

    const domNodeElement = this.nodeComponent
      ?.domElement as unknown as HTMLElement;
    domNodeElement.classList.remove(this.cssClasses.noPointerEvents);
    domNodeElement.classList.add(this.cssClasses.autoPointerEvents);
    domNodeElement.classList.remove(this.cssClasses.dragging);

    if (
      this.nodeComponent.parent &&
      this.nodeComponent.parent.nodeType === NodeType.Connection
    ) {
      this.nodeComponent.parent.update?.();
    }
  };
}
