import { transformCameraSpaceToWorldSpace } from '../camera';
import { paddingRect } from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
} from '../interfaces';
import { NodeType } from '../types';
import { pointerDown } from './events/pointer-events';
import { LineConnection } from './line-connection';
import { QuadraticBezierConnection } from './quadratic-bezier-connection';
import { Rect } from './rect';

// Should this component be called "RectConnectPoint"? Because it's not a thumb, it's a connect point.
// .. thumbs can be connect points or resize/move points.

export class RectThumb<T> extends Rect<T> {
  createStraightLineConnection = false;
  constructor(
    canvas: INodeComponent<T>,
    interactionStateMachine: InteractionStateMachine<T>,
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
    createStraightLineConnection?: boolean
  ) {
    super(
      canvas,
      interactionStateMachine,
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
      isStaticPosition
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent not created');
    }
    this.nodeComponent.isCircle = isCircle;
    this.nodeComponent.isThumb = true;
    this.createStraightLineConnection = createStraightLineConnection ?? false;

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

    this.nodeComponent.onCanReceiveDroppedComponent = () => {
      return true;
    };
  }

  protected override onPointerDown = (event: PointerEvent) => {
    if (event.shiftKey && this.canvasElements) {
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
      let { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
      );
      const xorg = x;
      const yorg = y;
      x = x - parentX;
      y = y - parentY;

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
            this.containerNode
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
            this.containerNode
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
        curve.nodeComponent.startNode = this.nodeComponent;
        curve.nodeComponent.startNodeThumb =
          this.nodeComponent.thumbConnectors?.[0];
        this.nodeComponent.connections?.push(curve.nodeComponent);

        if (curve.nodeComponent.startNodeThumb.isDataPort) {
          curve.nodeComponent.isData = true;
        }

        if (curve.nodeComponent.update) {
          curve.nodeComponent.update();
        }

        this.initiateDraggingConnection(curve.endPointElement, xorg, yorg);
      }

      return true;
    }
    return false;
  };

  initiateDraggingConnection = (
    connectionThumb: IThumbNodeComponent<T>,
    x: number,
    y: number
  ) => {
    if (!this.canvas) {
      return;
    }
    console.log(
      'RECT-THUMB initiateDraggingConnection',
      this.nodeComponent,
      connectionThumb
    );
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

    const interactionInfoResult = pointerDown(
      x - rectCamera.x + parentX,
      y - rectCamera.y + parentY,
      connectionThumb,
      this.containerNode
        ? (this.containerNode.nodeInfo as any)?.canvasAppInstance?.canvas
            ?.domElement
        : this.canvas.domElement,
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
      'cursor-pointer'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.add(
      'cursor-pointer'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      'cursor-not-allowed'
    );

    let canReceiveDrop = false;
    if (
      this.nodeComponent.onCanReceiveDroppedComponent //&&
      //(event as PointerEvent).shiftKey
    ) {
      const state = this.interactionStateMachine.getCurrentInteractionState();
      if (
        state &&
        state.element &&
        state.element.nodeType === NodeType.ConnectionController
      ) {
        canReceiveDrop = true;
        console.log('RECT-THUMB pointer-over state', state);

        // this.nodeComponent.onCanReceiveDroppedComponent(
        //   this.nodeComponent,
        //   state.element as unknown as IConnectionNodeComponent<T>,
        //   this.nodeComponent
        // );

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
            'RECT-THUMB svg cant register drop target for current dragging element'
          );
          return;
        } else {
          (
            this.nodeComponent.domElement as unknown as SVGElement
          ).style.filter = 'invert(1)';

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

  onPointerUp = (event: Event) => {
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

  onPointerLeave = (event: Event) => {
    if (!this.nodeComponent) {
      return;
    }

    console.log('RECT-THUMB svg unregister drop target', this.nodeComponent.id);
    this.interactionStateMachine.clearDropTarget(this.nodeComponent);

    (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
      'none';

    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      'cursor-not-allowed'
    );
    (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
      'cursor-pointer'
    );
  };

  protected override onReceiveDraggedConnection =
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
