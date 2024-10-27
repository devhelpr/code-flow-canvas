import { transformCameraSpaceToWorldSpace } from '../camera';
import { paddingRect } from '../constants/measures';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IConnectionNodeComponent,
  IDOMElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces';
import { getSelectedNode } from '../reactivity';
import { ConnectionControllerType, NodeType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { createElement } from '../utils/create-element';
import { getPointerPos } from '../utils/pointer-pos';
import { getRectNodeCssClasses } from './css-classes/rect-css-classes';
import { pointerDown } from './events/pointer-events';
import { LineConnection } from './line-connection';
import { NodeTransformer } from './node-transformer';
import { QuadraticBezierConnection } from './quadratic-bezier-connection';
import { Rect } from './rect';

// Should this component be called "RectConnectPoint"? Because it's not a thumb, it's a connect point.
// .. thumbs can be connect points or resize/move points.

export class RectThumb<T extends BaseNodeInfo> extends Rect<T> {
  createStraightLineConnection = false;
  toolTipUseShiftToDragConnection: IDOMElement | undefined = undefined;
  constructor(
    canvas: INodeComponent<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    nodeTransformer: NodeTransformer<BaseNodeInfo>,
    pathHiddenElement: IElementNode<T>,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    width: number,
    height: number,
    text?: string,
    thumbs?: IThumb[],
    markup?: string | INodeComponent<T>,
    layoutProperties?: {
      classNames?: string;
    },
    hasStaticWidthHeight?: boolean,
    disableInteraction?: boolean,
    disableManualResize?: boolean,
    canvasUpdated?: () => void,
    id?: string,
    containerNode?: IRectNodeComponent<T>,
    isStaticPosition?: boolean,
    isCircle?: boolean,
    createStraightLineConnection?: boolean,
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void,
    rootElement?: HTMLElement
  ) {
    super(
      canvas,
      interactionStateMachine,
      nodeTransformer,
      pathHiddenElement,
      elements,
      startX,
      startY,
      width,
      height,
      text,
      thumbs,
      markup,
      layoutProperties,
      hasStaticWidthHeight,
      disableInteraction,
      disableManualResize,
      canvasUpdated,
      id,
      containerNode,
      isStaticPosition,
      getRectNodeCssClasses().defaultRectThumbClasses,
      setCanvasAction,
      rootElement
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent not created');
    }
    this.nodeComponent.isCircle = isCircle;
    this.nodeComponent.isThumb = true;
    this.createStraightLineConnection = createStraightLineConnection ?? false;

    this.toolTipUseShiftToDragConnection = createElement(
      'div',
      {
        class: this.cssClasses.rectThumbTooltipClasses,
      },
      this.nodeComponent.domElement,
      'Hold shift to drag connections'
    );

    this.nodeComponent.domElement?.addEventListener(
      'pointerup',
      this.onPointerUp
    );
    this.nodeComponent.domElement?.addEventListener(
      'pointerover',
      this.onPointerOver
    );

    this.nodeComponent.domElement?.addEventListener(
      'pointerleave',
      this.onPointerLeave
    );

    this.nodeComponent.onReceiveDraggedConnection =
      this.onReceiveDraggedConnection(this.nodeComponent);

    // this.nodeComponent.onCanReceiveDroppedComponent = () => {
    //   return true;
    // };
    this.nodeComponent.onCanReceiveDroppedComponent =
      this.onCanReceiveDroppedComponent;
  }

  protected override onPointerDown = (event: PointerEvent) => {
    if (!this.canvas || !this.rootElement) {
      return false;
    }
    if (event.shiftKey && this.canvasElements) {
      // const elementRect = (
      //   this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      // ).getBoundingClientRect();
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
          parentX = parentCoordinates.x - paddingRect;
          parentY = parentCoordinates.y - paddingRect;
        }
      }
      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        event
      );
      let { x, y } = transformCameraSpaceToWorldSpace(pointerXPos, pointerYPos);
      const xorg = x;
      const yorg = y;
      x = x - parentX;
      y = y - parentY;

      const selectedNodeId = getSelectedNode();
      if (selectedNodeId) {
        const selectedNode = this.canvasElements?.get(
          selectedNodeId.id
        ) as unknown as INodeComponent<T>;
        if (
          selectedNode &&
          selectedNode.nodeType === NodeType.Connection &&
          event &&
          this.nodeComponent?.connections &&
          this.nodeComponent?.connections.length > 0
        ) {
          const startConnections = this.nodeComponent.connections.filter(
            (connection) => {
              return (
                connection.startNode &&
                connection.startNode?.id === this.nodeComponent?.id &&
                connection.id === selectedNode.id
              );
            }
          );
          if (startConnections.length > 0) {
            const connection = startConnections[0];

            console.log('thumb 2 start', x, y);
            if (connection.connectionStartNodeThumb) {
              connection.startNode = undefined;
              connection.startNodeThumb = undefined;

              this.initiateDraggingConnection(
                connection.connectionStartNodeThumb,
                xorg,
                yorg,
                connection
              );
            }
            return true;
          }

          const endConnections = this.nodeComponent.connections.filter(
            (connection) => {
              return (
                connection.endNode &&
                connection.endNode?.id === this.nodeComponent?.id &&
                connection.id === selectedNode.id
              );
            }
          );
          if (endConnections.length > 0) {
            const connection = endConnections[0];

            console.log('thumb 2 end', x, y);
            if (connection.connectionEndNodeThumb) {
              if (connection.endNode) {
                connection.endNode.connections =
                  connection.endNode.connections.filter((connection) => {
                    return connection.id !== connection.id;
                  });
              }
              connection.endNode = undefined;
              connection.endNodeThumb = undefined;

              this.initiateDraggingConnection(
                connection.connectionEndNodeThumb,
                xorg,
                yorg,
                connection
              );
            }
            return true;
          }
        }
      }

      const curve = this.createStraightLineConnection
        ? new LineConnection<T>(
            this.canvas as unknown as INodeComponent<T>,
            this.interactionStateMachine,
            this.pathHiddenElement as unknown as IElementNode<T>,
            this.canvasElements,
            x,
            y,
            x,
            y,
            0,
            0,
            false,
            undefined,
            this.canvasUpdated,
            undefined,
            this.containerNode,
            undefined,
            undefined,
            this.rootElement
          )
        : new QuadraticBezierConnection<T>(
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

            false,
            undefined,
            this.canvasUpdated,
            undefined,
            this.containerNode,
            undefined,
            undefined,
            this.rootElement
          );

      if (!curve || !curve.nodeComponent || !curve.endPointElement) {
        throw new Error('curve not created');
      }

      if (
        curve &&
        this.canvas &&
        this.nodeComponent &&
        this.nodeComponent.thumbConnectors &&
        this.nodeComponent.thumbConnectors.length > 0
      ) {
        const thumbConnector = this.nodeComponent.thumbConnectors.find(
          (thumbConnector) => {
            if (
              thumbConnector.thumbConnectionType ===
                ThumbConnectionType.start ||
              thumbConnector.thumbConnectionType ===
                ThumbConnectionType.startOrEnd
            ) {
              return true;
            }
            return false;
          }
        );
        if (!thumbConnector) {
          return false;
        }
        curve.nodeComponent.startNode = this.nodeComponent;
        curve.nodeComponent.startNodeThumb = thumbConnector; //this.nodeComponent.thumbConnectors?.[0];
        this.nodeComponent.connections?.push(curve.nodeComponent);

        if (thumbConnector.isDataPort) {
          curve.nodeComponent.isData = true;
        }

        if (this.setCanvasAction) {
          this.setCanvasAction(CanvasAction.newConnectionCreated, curve);
        }

        // if (curve.nodeComponent.update) {
        //   curve.nodeComponent.update();
        // }

        this.initiateDraggingConnection(
          curve.endPointElement,
          xorg,
          yorg,
          curve.nodeComponent
        );
      }

      return true;
    }
    return false;
  };

  initiateDraggingConnection = (
    connectionThumb: IThumbNodeComponent<T>,
    x: number,
    y: number,
    _connection: IConnectionNodeComponent<T>
  ) => {
    if (!this.canvas) {
      return;
    }

    const elementRect = (
      this.nodeComponent?.domElement as unknown as HTMLElement | SVGElement
    ).getBoundingClientRect();
    console.log(
      'RECT-THUMB initiateDraggingConnection',
      elementRect,
      this.nodeComponent?.width,
      this.nodeComponent?.height
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
        parentX = parentCoordinates.x - paddingRect;
        parentY = parentCoordinates.y - paddingRect;
      }
    }
    // console.log(
    //   'RECT-THUMB initiateDraggingConnection',
    //   this.nodeComponent,
    //   connectionThumb,
    //   x,
    //   y,
    //   parentX,
    //   parentY,
    //   rectCamera.x,
    //   rectCamera.y,
    //   x - rectCamera.x + parentX,
    //   y - rectCamera.y + parentY
    // );

    const interactionInfoResult = pointerDown(
      x - rectCamera.x + parentX,
      y - rectCamera.y + parentY,
      connectionThumb,
      this.canvas,
      // this.containerNode
      //   ? (this.containerNode.nodeInfo as any)?.canvasAppInstance?.canvas
      //       ?.domElement
      //   : this.canvas.domElement,
      this.interactionStateMachine
    );

    if (interactionInfoResult && connectionThumb.initPointerDown) {
      console.log(
        'xoffset yoffset',
        interactionInfoResult.xOffsetWithinElementOnFirstClick,
        interactionInfoResult.yOffsetWithinElementOnFirstClick
      );
      connectionThumb.initPointerDown(
        interactionInfoResult.xOffsetWithinElementOnFirstClick,
        interactionInfoResult.yOffsetWithinElementOnFirstClick
      );
    }

    if (connectionThumb.getThumbCircleElement) {
      const circleDomElement = connectionThumb.getThumbCircleElement();

      circleDomElement.classList.remove(this.cssClasses.draggingPointerAuto);
      circleDomElement.classList.add(this.cssClasses.draggingNoPointer);

      const domNodeElement =
        connectionThumb?.domElement as unknown as HTMLElement;
      domNodeElement.classList.remove(this.cssClasses.draggingPointerAuto);
      domNodeElement.classList.add(this.cssClasses.draggingNoPointer);
      domNodeElement.classList.add(this.cssClasses.dragging);
    }
  };

  onPointerOver = (event: Event) => {
    if (!this.nodeComponent) {
      return;
    }
    // console.log(
    //   'RECT-THUMB svg pointerover',
    //   this.nodeComponent.id,
    //   this.nodeComponent
    // );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.droppingCursorPointer
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      this.cssClasses.droppingCursorPointer
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.droppingNotAllowed
    );

    let canReceiveDrop = false;
    if (
      this.nodeComponent.onCanReceiveDroppedComponent //&&
      //(event as PointerEvent).shiftKey
    ) {
      console.log(
        'RECT-THUMB onCanReceiveDroppedComponent',
        this.nodeComponent.id
      );
      const state = this.interactionStateMachine.getCurrentInteractionState();
      if (
        state &&
        state.element &&
        state.element.nodeType === NodeType.ConnectionController
      ) {
        canReceiveDrop = true;
        const draggedConnectionController: IConnectionNodeComponent<T> =
          state.element as unknown as IConnectionNodeComponent<T>;
        if (
          this.nodeComponent.thumbConnectors &&
          this.nodeComponent.thumbConnectors.length > 0 &&
          (state.element as unknown as any).parent.startNodeThumb &&
          draggedConnectionController.connectionControllerType ===
            ConnectionControllerType.end
        ) {
          const thumb = (state.element as unknown as any).parent.startNodeThumb;
          if (thumb) {
            const thumbConnector = this.nodeComponent.thumbConnectors.find(
              (thumbConnector) => {
                if (
                  thumbConnector.thumbConnectionType ===
                    ThumbConnectionType.end ||
                  thumbConnector.thumbConnectionType ===
                    ThumbConnectionType.startOrEnd
                ) {
                  return true;
                }
                return false;
              }
            );
            if (thumbConnector) {
              canReceiveDrop = this.nodeComponent.onCanReceiveDroppedComponent(
                thumbConnector,
                state.element as unknown as IConnectionNodeComponent<T>,
                thumb
              );
              console.log('RECT-THUMB canReceiveDrop', canReceiveDrop);
            } else {
              canReceiveDrop = false;
            }
          }
        } else if (
          this.nodeComponent.thumbConnectors &&
          this.nodeComponent.thumbConnectors.length > 0 &&
          (state.element as unknown as any).parent.endNodeThumb &&
          draggedConnectionController.connectionControllerType ===
            ConnectionControllerType.begin
        ) {
          const thumb = (state.element as unknown as any).parent.endNodeThumb;
          if (thumb) {
            const thumbConnector = this.nodeComponent.thumbConnectors.find(
              (thumbConnector) => {
                if (
                  thumbConnector.thumbConnectionType ===
                    ThumbConnectionType.start ||
                  thumbConnector.thumbConnectionType ===
                    ThumbConnectionType.startOrEnd
                ) {
                  return true;
                }
                return false;
              }
            );
            if (thumbConnector) {
              canReceiveDrop = this.nodeComponent.onCanReceiveDroppedComponent(
                thumbConnector,
                state.element as unknown as IConnectionNodeComponent<T>,
                thumb
              );
              console.log('RECT-THUMB canReceiveDrop', canReceiveDrop);
            } else {
              canReceiveDrop = false;
            }
          }
        }

        if (!canReceiveDrop) {
          // (
          //   this.nodeComponent.domElement as unknown as SVGElement
          // ).style.filter = 'none';
          (
            this.nodeComponent.domElement as unknown as SVGElement
          ).classList.remove(this.cssClasses.dropping);

          (
            this.nodeComponent.domElement as unknown as SVGElement
          ).classList.remove(this.cssClasses.droppingCursorPointer);
          (
            this.nodeComponent.domElement as unknown as SVGElement
          ).classList.add(this.cssClasses.droppingNotAllowed);
          console.log(
            'RECT-THUMB svg cant register drop target for current dragging element'
          );
          return;
        } else {
          // (
          //   this.nodeComponent.domElement as unknown as SVGElement
          // ).style.filter = 'invert(1)';

          (
            this.nodeComponent.domElement as unknown as SVGElement
          ).classList.add(this.cssClasses.dropping);

          console.log(
            'RECT-THUMB svg register drop target',
            this.nodeComponent.id
          );
          this.interactionStateMachine.setCurrentDropTarget(this.nodeComponent);
          //event.preventDefault();
          event.stopPropagation();
        }
      }
    }
  };

  onPointerUp = (_event: Event) => {
    if (!this.nodeComponent) {
      return;
    }
    const dropTarget = this.interactionStateMachine.getCurrentDropTarget();
    const state = this.interactionStateMachine.getCurrentInteractionState();
    if (dropTarget && state) {
      console.log(
        'RECT-THUMB DROPPED ON RECT THUMB',
        dropTarget.id,
        state.element,
        this.nodeComponent.id,
        this.nodeComponent.connectionControllerType,
        this.nodeComponent.onReceiveDraggedConnection
      );
      //   if (state.element?.nodeType === NodeType.ConnectionController) {
      //     const connection = state.element
      //       .parent as unknown as IConnectionNodeComponent<T>;
      //     if (connection) {
      //       connection.endNode = this.nodeComponent;
      //       connection.endNodeThumb = this.nodeComponent.thumbConnectors?.[0];
      //       this.nodeComponent.connections?.push(connection);
      //       connection.update?.(
      //         connection,
      //         connection.startNode?.x ?? 0,
      //         connection.startNode?.y ?? 0,
      //         this.nodeComponent
      //       );
      //     }
      //   }
      //   if (this.canvasUpdated) {
      //     this.canvasUpdated();
      //   }
    }
    // this.interactionStateMachine.clearDropTarget(this.nodeComponent);
  };

  onPointerLeave = (_event: Event) => {
    if (!this.nodeComponent) {
      return;
    }

    console.log('RECT-THUMB svg unregister drop target', this.nodeComponent.id);
    this.interactionStateMachine.clearDropTarget(this.nodeComponent);

    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.dropping
    );

    (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
      'none';

    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.droppingNotAllowed
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      this.cssClasses.droppingCursorPointer
    );
  };

  public override onReceiveDraggedConnection =
    (rectNode: IRectNodeComponent<T>) =>
    (thumbNode: IThumbNodeComponent<T>, component: INodeComponent<T>) => {
      // component is not the path itself but it is the drag-handle of a path (the parent of that handle is the path node-component)
      if (!rectNode) {
        return;
      }
      console.log(
        'RECT-THUMB DROPPED ON RIGHT THUMB',
        thumbNode,
        component.id,
        component.parent,
        component.connectionControllerType,
        rectNode.x,
        rectNode.y,
        rectNode.id
      );

      // check for 'begin' or 'end' connectionControllerType which are the drag handlers of the connection/path
      // (not to be confused with the resize handlers)
      if (component) {
        // const draggedConnection =
        //   component.parent as unknown as IConnectionNodeComponent<T>;
        // let nodeReference = rectNode;
        // if (
        //   component.connectionControllerType === ConnectionControllerType.begin
        // ) {
        //   // remove connection from current start node
        //   const previousConnectionId = draggedConnection.id;
        //   if (previousConnectionId && draggedConnection.startNode) {
        //     draggedConnection.startNode.connections =
        //       draggedConnection.startNode.connections.filter((connection) => {
        //         return connection.id !== previousConnectionId;
        //       });
        //   }
        //   draggedConnection.startNode = this.rectNode;
        //   draggedConnection.startNodeThumb = thumbNode;
        // } else {
        //   // remove connection from current end node
        //   const previousConnectionId = draggedConnection.id;
        //   if (draggedConnection.endNode) {
        //     draggedConnection.endNode.connections =
        //       draggedConnection.endNode.connections.filter((connection) => {
        //         return connection.id !== previousConnectionId;
        //       });
        //   }
        //   draggedConnection.endNode = this.rectNode;
        //   draggedConnection.endNodeThumb = thumbNode;
        //   if (draggedConnection.startNode) {
        //     // use start node as reference for the curve's begin point
        //     nodeReference = draggedConnection.startNode;
        //   }
        // }
        // component.parent.isControlled = true;
        // rectNode.connections?.push(draggedConnection);
        // // Update both sides of the connection to get a correct curve
        // if (component.parent.update) {
        //   component.parent.update(
        //     component.parent,
        //     nodeReference.x,
        //     nodeReference.y,
        //     this.rectNode
        //   );
        //   if (
        //     component.connectionControllerType ===
        //     ConnectionControllerType.begin
        //   ) {
        //     if (draggedConnection.endNode) {
        //       component.parent.update(
        //         component.parent,
        //         nodeReference.x,
        //         nodeReference.y,
        //         draggedConnection.endNode
        //       );
        //     }
        //   } else {
        //     if (draggedConnection.startNode) {
        //       component.parent.update(
        //         component.parent,
        //         nodeReference.x,
        //         nodeReference.y,
        //         draggedConnection.startNode
        //       );
        //     }
        //   }
        // }
        // (this.canvas?.domElement as unknown as HTMLElement | SVGElement).append(
        //   draggedConnection.startNode?.domElement as unknown as HTMLElement
        // );
        // if (this.canvasUpdated) {
        //   this.canvasUpdated();
        // }
      }
    };
}
