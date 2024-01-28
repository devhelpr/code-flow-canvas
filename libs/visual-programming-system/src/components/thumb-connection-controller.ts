import { transformCameraSpaceToWorldSpace } from '../camera';
import {
  thumbRadius,
  thumbWidth,
  thumbHeight,
  paddingRect,
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
import { NodeType } from '../types/node-type';
import { createElement } from '../utils';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';
import { ThumbNode } from './thumb';

export class ThumbConnectionController<T> extends ThumbNode<T> {
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
    containerNode?: IRectNodeComponent<T>
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
      containerNode
    );

    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }

    if (connectionControllerType !== undefined) {
      (this.nodeComponent.domElement as HTMLElement).classList.add(
        `connection-controller-${connectionControllerType}`
      );
    }
    (this.nodeComponent.domElement as HTMLElement).classList.remove(
      'pointer-events-none'
    );
    this.nodeComponent.thumbName = thumbName;
    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;

    (this.nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
      this.nodeComponent.id;

    (
      this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
    ).style.clipPath = 'circle(25%)';
    (
      this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
    ).classList.add('connection-controller');

    const clipPathMainElement = 'circle(25%)';
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
          disableInteraction ? 'pointer-events-none' : 'pointer-events-auto'
        }        
        origin-center relative`,
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

        // pointerover: this.onPointerOver,
        // pointerleave: this.onPointerLeave,
        // pointerdown: this.onPointerDown,
        // pointermove: this.onPointerMove,
        // pointerup: this.onPointerUp,
      },
      this.nodeComponent.domElement
    );
    const domElement = this.nodeComponent.domElement as HTMLElement;
    domElement.addEventListener('pointerover', this.onPointerOver);
    domElement.addEventListener('pointerleave', this.onPointerLeave);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.classList.remove('pointer-events-none');
    domElement.classList.add('pointer-events-auto');
    if (!this.circleElement) throw new Error('circleElement is undefined');

    elements.set(this.nodeComponent.id, this.nodeComponent);
    //this.nodeComponent.elements.set(this.circleElement.id, this.circleElement);
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
        // console.log(
        //   'THUMB SET VISIBILITY  (BEFORE remove pointer-events-none)'
        // );
        const circleDomElement = this.circleElement
          ?.domElement as unknown as SVGElement;
        circleDomElement.classList.remove('pointer-events-none');
        circleDomElement.classList.add('pointer-events-auto');
      } else {
        // circleDomElement.classList.remove('pointer-events-auto');
        // circleDomElement.classList.add('pointer-events-none');
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
      'cursor-pointer'
    );
  };

  onPointerLeave = (event: PointerEvent) => {
    if (this.disableInteraction) {
      return;
    }
    const element = document.elementFromPoint(event.clientX, event.clientY);

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
        'cursor-not-allowed'
      );
      (this.nodeComponent.domElement as unknown as SVGElement).classList.remove(
        'cursor-pointer'
      );
    }
    // if (this.nodeComponent && this.nodeComponent.getThumbCircleElement) {
    //   console.log('RESET THUMB CIRCLE ELEMENT on pointer leave');
    //   const circleDomElement = this.nodeComponent.getThumbCircleElement();

    //   circleDomElement.classList.add('pointer-events-auto');
    //   circleDomElement.classList.remove('pointer-events-none');
    // }
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
      'connection-controller THUMB initiateDraggingConnection',
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
        parentX = parentCoordinates.x - paddingRect;
        parentY = parentCoordinates.y - paddingRect;
      }
    }

    const interactionInfoResult = pointerDown(
      x - rectCamera.x + parentX,
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

      const domNodeElement = this.nodeComponent
        ?.domElement as unknown as HTMLElement;
      domNodeElement.classList.remove('pointer-events-auto');
      domNodeElement.classList.add('pointer-events-none');
      domNodeElement.classList.add('dragging');
    }
  };

  onPointerDown = (e: PointerEvent) => {
    console.log(
      'connection-controller onPointerDown',
      this.disableInteraction,
      this.nodeComponent?.connectionControllerType,
      e.target,
      this.nodeComponent?.id,
      this.nodeComponent?.parent &&
        this.nodeComponent?.parent.nodeType === NodeType.Connection
    );
    if (this.disableInteraction) {
      return;
    }
    this.oldElement = null;
    if (this.nodeComponent) {
      if (this.nodeComponent.parent) {
        if (
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.end
        ) {
          if (this.nodeComponent.parent.nodeType === NodeType.Connection) {
            const connection = this.nodeComponent
              .parent as unknown as IConnectionNodeComponent<T>;
            if (connection.endNode?.isThumb) {
              console.log("Can't drag from 'end' rect-thumb");
              return;
            }
          }
        }
        if (
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.begin
        ) {
          if (this.nodeComponent.parent.nodeType === NodeType.Connection) {
            const connection = this.nodeComponent
              .parent as unknown as IConnectionNodeComponent<T>;
            if (connection.startNode?.isThumb) {
              console.log("Can't drag from 'end' rect-thumb");
              return;
            }
          }
        }
      }

      if (this.nodeComponent.thumbType === ThumbType.Center) {
        return;
      }

      e.stopPropagation();

      // const selectedNodeId = getSelectedNode();
      // if (selectedNodeId) {
      //   console.log('thumb 1');
      //   const selectedNode = this.canvasElements?.get(
      //     selectedNodeId.id
      //   ) as unknown as INodeComponent<T>;
      //   const connectionNode =
      //     this.nodeComponent.thumbLinkedToNode?.nodeType === NodeType.Shape
      //       ? this.nodeComponent.thumbLinkedToNode?.connections.find(
      //           (c) => c.id === selectedNodeId.id
      //         )
      //       : undefined;
      //   if (
      //     connectionNode &&
      //     selectedNode &&
      //     selectedNode.nodeType === NodeType.Connection &&
      //     this.canvas
      //   ) {
      //     const { x, y } = transformCameraSpaceToWorldSpace(
      //       e.clientX,
      //       e.clientY
      //     );
      //     const curve = selectedNode as unknown as IConnectionNodeComponent<T>;
      //     const connectionThumb =
      //       this.nodeComponent.thumbConnectionType === 'start'
      //         ? curve.connectionStartNodeThumb
      //         : curve.connectionEndNodeThumb;

      //     // remove existing connection
      //     const connection =
      //       connectionThumb?.parent as unknown as IConnectionNodeComponent<T>;

      //     if (this.nodeComponent?.thumbConnectionType === 'start') {
      //       connection.startNode = undefined;
      //       connection.startNodeThumb = undefined;
      //     } else {
      //       connection.endNode = undefined;
      //       connection.endNodeThumb = undefined;
      //     }

      //     if (connectionThumb) {
      //       this.initiateDraggingConnection(connectionThumb, x, y);
      //     }

      //     return;
      //   }
      // }

      // loopup connection to with this connection-controller as start point
      const connection = this.nodeComponent
        .parent as unknown as IConnectionNodeComponent<T>;

      if (connection && this.canvas && connection.startNodeThumb) {
        const connectionThumb =
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.begin
            ? connection.connectionStartNodeThumb
            : undefined;
        if (connectionThumb) {
          const { x, y } = transformCameraSpaceToWorldSpace(
            e.clientX,
            e.clientY
          );
          connection.startNode = undefined;
          connection.startNodeThumb = undefined;
          console.log('thumb 2 start', x, y);
          this.initiateDraggingConnection(connectionThumb, x, y);
          return;
        }
      }

      if (connection && this.canvas && connection.endNodeThumb) {
        const connectionThumb =
          this.nodeComponent.connectionControllerType ===
          ConnectionControllerType.end
            ? connection.connectionEndNodeThumb
            : undefined;

        if (connectionThumb) {
          const { x, y } = transformCameraSpaceToWorldSpace(
            e.clientX,
            e.clientY
          );
          connection.endNode = undefined;
          connection.endNodeThumb = undefined;
          console.log('thumb 2 end', x, y);
          this.initiateDraggingConnection(connectionThumb, x, y);
          return;
        }
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
        'connection-controller thumb 3',
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

        const domNodeElement = this.nodeComponent
          ?.domElement as unknown as HTMLElement;
        domNodeElement.classList.remove('pointer-events-auto');
        domNodeElement.classList.add('pointer-events-none');

        domNodeElement.classList.add('dragging');
      }
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
    let element = document.elementFromPoint(event.clientX, event.clientY);
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
      this.nodeComponent.domElement
    ) {
      this.oldElement = null;
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
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
    const element = document.elementFromPoint(event.clientX, event.clientY);

    if (!this.nodeComponent) {
      return;
    }
    // if (!this.nodeComponent || (element && element !== event.target)) {
    //   if (element) {
    //     console.log(
    //       'connection-controller onPointerUp (element)',
    //       this.nodeComponent?.id,
    //       element
    //     );
    //     element.dispatchEvent(new PointerEvent('pointerup', event));
    //   }
    //   return;
    // }

    let skipevent = false;
    if (element && element !== event.target) {
      console.log('connection-controller onPointerUp (element)', element);
      element.dispatchEvent(new PointerEvent('pointerup', event));
      element.dispatchEvent(new PointerEvent('pointerleave', event));
      skipevent = true;
    }

    if (this.nodeComponent.domElement) {
      (this.nodeComponent.domElement as unknown as SVGElement).style.filter =
        'none';
      if (!skipevent) {
        const { x, y } = transformCameraSpaceToWorldSpace(
          event.clientX,
          event.clientY
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
      circleDomElement.classList.add('pointer-events-auto');
      circleDomElement.classList.remove('pointer-events-none');

      const domNodeElement = this.nodeComponent
        ?.domElement as unknown as HTMLElement;
      domNodeElement.classList.remove('pointer-events-none');
      domNodeElement.classList.add('pointer-events-auto');
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
          if (rectNode.thumbConnectors?.[0].thumbType === ThumbType.Center) {
            if (
              this.nodeComponent.connectionControllerType ===
              ConnectionControllerType.begin
            ) {
              connection.startNode = rectNode;
              connection.startNodeThumb = rectNode.thumbConnectors?.[0];

              rectNode.connections?.push(connection);

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
              connection.endNodeThumb = rectNode.thumbConnectors?.[0];

              rectNode.connections?.push(connection);

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

    const circleDomElement = this.circleElement?.domElement as unknown as
      | HTMLElement
      | SVGElement;
    circleDomElement.classList.add('pointer-events-auto');
    circleDomElement.classList.remove('pointer-events-none');

    const domNodeElement = this.nodeComponent
      ?.domElement as unknown as HTMLElement;
    domNodeElement.classList.remove('pointer-events-none');
    domNodeElement.classList.add('pointer-events-auto');
    domNodeElement.classList.remove('dragging');

    if (
      this.nodeComponent.parent &&
      this.nodeComponent.parent.nodeType === NodeType.Connection
    ) {
      this.nodeComponent.parent.update?.();
    }
  };
}
