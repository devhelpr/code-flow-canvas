/* eslint-disable @typescript-eslint/no-unused-vars */
import { compileMarkup } from '@devhelpr/markup-compiler';
import { getCamera, transformCameraSpaceToWorldSpace } from '../camera';
import { InteractionStateMachine } from '../interaction-state-machine';
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
import { setSelectNode } from '../reactivity';
import { ConnectionControllerType, ThumbType } from '../types';
import { createASTNodeElement, createNodeElement } from '../utils';
import { pointerDown } from './events/pointer-events';
import {
  calculateConnectorX,
  calculateConnectorY,
  thumbPosition,
} from './utils/calculate-connector-thumbs';
import { setPosition } from './utils/set-position';
import { NodeType } from '../types/node-type';
import { thumbHeight, thumbWidth } from '../constants/measures';
import { ThumbNodeConnector } from './thumb-node-connector';
import { NodeTransformer } from './node-transformer';

export class Rect<T> {
  public nodeComponent?: IRectNodeComponent<T>;
  public isStaticPosition?: boolean;

  protected rectInfo: ReturnType<typeof this.createRectElement>;
  protected nodeTransformer: NodeTransformer<T>;

  protected canvas: IElementNode<T> | undefined;
  protected canvasElements?: ElementNodeMap<T>;
  protected pathHiddenElement?: IElementNode<T>;
  protected canvasUpdated?: () => void;
  protected interactionStateMachine: InteractionStateMachine<T>;
  protected hasStaticWidthHeight?: boolean;
  public containerNode?: IRectNodeComponent<T>;

  protected minHeight = 0;

  protected updateEventListeners: ((
    target?: INodeComponent<T>,
    x?: number,
    y?: number,
    initiator?: INodeComponent<T>
  ) => void)[] = [];
  protected points = {
    beginX: 0,
    beginY: 0,
    width: 0,
    height: 0,
  };

  constructor(
    canvas: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    nodeTransformer: NodeTransformer<T>,
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
    parentNodeClassName?: string
  ) {
    this.canvas = canvas;
    this.canvasElements = elements;
    this.canvasUpdated = canvasUpdated;
    this.nodeTransformer = nodeTransformer;
    this.nodeTransformer.detachNode();

    this.interactionStateMachine = interactionStateMachine;
    this.hasStaticWidthHeight = hasStaticWidthHeight;

    this.containerNode = containerNode;
    this.isStaticPosition = isStaticPosition;
    this.pathHiddenElement = pathHiddenElement;

    if (thumbs) {
      // TODO : refactor this so it uses real thumbs placements instead of constant values 55 and 24
      // ... do after creating rect and also in .resze() method
      // see also lines 213 (approx)
      let minHeightAdd = 0;
      if (
        markup !== undefined &&
        typeof markup !== 'string' &&
        markup.domElement
      ) {
        const titleTopLabelField = (
          markup.domElement as HTMLElement
        ).querySelector(`.node-top-label`) as HTMLElement;
        if (titleTopLabelField) {
          const bounds = titleTopLabelField.getBoundingClientRect();
          minHeightAdd = bounds.height || 0; // TODO Fix this!!! (bounds.height is 0 because element is not rendered)
        }
      }

      const thumbStartItemsCount = thumbs.filter((thumb) => {
        return thumb.connectionType === ThumbConnectionType.start;
      }).length;
      const thumbEndItemsCount = thumbs.filter((thumb) => {
        return thumb.connectionType === ThumbConnectionType.end;
      }).length;
      this.minHeight =
        minHeightAdd + Math.max(thumbStartItemsCount, thumbEndItemsCount) * 55;
    }

    this.rectInfo = this.createRectElement(
      canvas.domElement,
      elements,
      startX,
      startY,
      width,
      Math.max(height, this.minHeight),
      pathHiddenElement,
      text,
      (
        thumbType: ThumbType,
        index?: number,
        _offsetY?: number,
        thumb?: IThumbNodeComponent<T>
      ) => {
        return thumbPosition<T>(this.nodeComponent!, thumbType, index, thumb);
      },
      markup,
      layoutProperties,
      hasStaticWidthHeight,
      disableInteraction,
      canvasUpdated,
      id,
      parentNodeClassName ?? 'rect-node'
    );
    this.nodeComponent = this.rectInfo.nodeComponent;
    this.nodeComponent.setSize = this.setSize;

    this.nodeComponent.isStaticPosition = isStaticPosition ?? false;
    this.nodeComponent.canBeResized =
      hasStaticWidthHeight === true &&
      !isStaticPosition &&
      !disableManualResize &&
      !disableInteraction;
    this.nodeComponent.containerNode = containerNode;
    this.nodeComponent.getParentedCoordinates = this.getParentedCoordinates;

    this.nodeComponent.update = this.onUpdate(
      this.rectInfo.astElement,
      (
        thumbType: ThumbType,
        index?: number,
        _offsetY?: number,
        thumb?: IThumbNodeComponent<T>
      ) => {
        if (!this.nodeComponent) {
          throw new Error('this.nodeComponent is undefined');
        }
        return thumbPosition<T>(this.nodeComponent, thumbType, index, thumb);
      }
    );

    this.nodeComponent.updateEnd = () => {
      if (canvasUpdated) {
        canvasUpdated();
      }
    };

    // precalculate height/width to place thumbs correctly for some thumb types (e.g. StartConnectorCenter and EndConnectorTop etc)

    this.updateNodeSize(
      startX,
      startY,
      width,
      height,
      hasStaticWidthHeight ?? false
    );

    const thumbConnectors: IThumbNodeComponent<T>[] = [];

    if (thumbs) {
      thumbs.forEach((thumb) => {
        if (!this.nodeComponent) {
          return;
        }
        const { x, y } = thumbPosition(
          this.nodeComponent,
          thumb.thumbType,
          thumb.thumbIndex ?? 0,
          {
            thumbLinkedToNode: this.nodeComponent,
          } as IThumbNodeComponent<T>
        );

        const thumbNode = new ThumbNodeConnector<T>(
          thumb,
          this.nodeComponent.domElement,
          canvas,
          this.interactionStateMachine,
          this.nodeComponent.elements,
          thumb.name ??
            (thumb.connectionType === ThumbConnectionType.start
              ? 'output'
              : 'input'),
          thumb.thumbType,
          thumb.connectionType,
          thumb.color ?? '#008080',
          x,
          y,
          undefined,
          NodeType.Connector,
          `top-0 left-0 origin-center z-[1150]  ${thumb.class ?? ''} ${
            thumb.hidden ? 'invisible pointer-events-none' : ''
          }`,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          thumb.thumbIndex ?? 0,
          true,

          elements,
          this.nodeComponent,
          pathHiddenElement,
          disableInteraction,
          thumb.label,
          thumb.thumbShape ?? 'circle',
          canvasUpdated,
          containerNode
        );

        if (!thumbNode.nodeComponent) {
          throw new Error('ThumbNode.nodeComponent is undefined');
        }
        thumbNode.nodeComponent.pathName = thumb.pathName;
        thumbNode.nodeComponent.isControlled = true;
        thumbNode.nodeComponent.isConnectPoint = true;
        thumbNode.nodeComponent.thumbConnectionType = thumb.connectionType;
        thumbNode.nodeComponent.thumbControlPointDistance =
          thumb.controlPointDistance;
        thumbNode.nodeComponent.thumbLinkedToNode = this.nodeComponent;
        thumbNode.nodeComponent.thumbConstraint = thumb.thumbConstraint;
        thumbNode.nodeComponent.isDataPort = thumb.isDataPort;
        thumbNode.nodeComponent.maxConnections = thumb.maxConnections;
        thumbNode.nodeComponent.thumbFormId = thumb.formId;
        thumbNode.nodeComponent.thumbFormFieldName = thumb.formFieldName;

        if (!disableInteraction) {
          thumbNode.nodeComponent.onCanReceiveDroppedComponent =
            this.onCanReceiveDroppedComponent;
          thumbNode.nodeComponent.onReceiveDraggedConnection =
            this.onReceiveDraggedConnection(this.nodeComponent);
        }
        thumbNode.nodeComponent.update = this.onEndThumbConnectorElementupdate;

        thumbConnectors.push(thumbNode.nodeComponent);
      });
    }
    this.nodeComponent.thumbConnectors = thumbConnectors;

    // Recalculate thumb positions after the nodes have been rendered and init height/width again

    let minHeightAdd = 0;

    const titleTopLabelField = (
      this.nodeComponent.domElement as HTMLElement
    ).querySelector(`.node-top-label`) as HTMLElement;
    if (titleTopLabelField) {
      const bounds = titleTopLabelField.getBoundingClientRect();
      minHeightAdd = bounds.height || 0;
    }

    let thumbStartHeight = 0;
    let thumbEndHeight = 0;
    this.nodeComponent.thumbConnectors.forEach((thumb) => {
      if (thumb.thumbType === ThumbType.StartConnectorRight) {
        const offsetTop = (thumb.domElement as HTMLElement)?.offsetTop ?? 0;
        const bounds = (
          thumb.domElement as HTMLElement
        ).getBoundingClientRect();
        const top = offsetTop + bounds?.height ?? 0;

        if (top > thumbStartHeight) {
          thumbStartHeight = top;
        }
      }
      return thumb.thumbConnectionType === ThumbConnectionType.start;
    });
    this.nodeComponent.thumbConnectors.forEach((thumb) => {
      if (thumb.thumbType === ThumbType.EndConnectorLeft) {
        const offsetTop = (thumb.domElement as HTMLElement)?.offsetTop ?? 0;
        const bounds = (
          thumb.domElement as HTMLElement
        ).getBoundingClientRect();
        const top = offsetTop + bounds?.height ?? 0;

        if (top > thumbEndHeight) {
          thumbEndHeight = top;
        }
      }
      return thumb.thumbConnectionType === ThumbConnectionType.end;
    });
    this.minHeight = minHeightAdd + Math.max(thumbEndHeight, thumbStartHeight);

    this.updateNodeSize(
      startX,
      startY,
      width,
      height,
      hasStaticWidthHeight ?? false
    );

    this.nodeComponent.update(
      this.nodeComponent,
      startX,
      startY,
      this.nodeComponent
    );

    this.nodeComponent.onClick = () => {
      if (!this.nodeComponent) {
        return;
      }
      console.log('CLICKED ON RECT', this.nodeComponent.id);
      setSelectNode({
        id: this.nodeComponent.id,
        containerNode: this.nodeComponent
          .containerNode as unknown as IRectNodeComponent<unknown>,
      });
      this.nodeTransformer.attachNode(this.nodeComponent);
    };
    this.nodeComponent.connections = [];
  }

  private updateNodeSize(
    startX: number,
    startY: number,
    width: number,
    height: number,
    hasStaticWidthHeight: boolean
  ) {
    if (!this.nodeComponent) {
      return;
    }
    this.nodeComponent.x = startX;
    this.nodeComponent.y = startY;
    this.nodeComponent.width = width;
    this.nodeComponent.height = Math.max(height, this.minHeight);
    this.oldWidth = width;
    this.oldHeight = Math.max(height, this.minHeight);

    if (!hasStaticWidthHeight) {
      const astElementSize = (
        this.rectInfo.astElement?.domElement as unknown as HTMLElement
      ).getBoundingClientRect();

      const { scale } = getCamera();
      this.nodeComponent.width = astElementSize.width / scale;
      this.nodeComponent.height = astElementSize.height / scale; // - 20;
      this.points.width = astElementSize.width / scale;
      this.points.height = astElementSize.height / scale; // - 20;
      if (this.points.height < this.minHeight) {
        this.points.height = this.minHeight;
        this.nodeComponent.height = this.minHeight;
      }
    }

    (
      this.nodeComponent.domElement as HTMLElement
    ).style.height = `${this.nodeComponent.height}px`;
  }
  public resize(width?: number) {
    if (this.hasStaticWidthHeight || !this.nodeComponent) {
      return;
    }
    const { scale } = getCamera();
    if (this.nodeComponent.thumbConnectors) {
      let minHeightAdd = 0;

      const titleTopLabelField = (
        this.nodeComponent.domElement as HTMLElement
      ).querySelector(`.node-top-label`) as HTMLElement;
      if (titleTopLabelField) {
        const bounds = titleTopLabelField.getBoundingClientRect();
        minHeightAdd = (bounds.height || 0) / scale; // TODO Fix this!!! (bounds.height is 0 because element is not rendered)
      }

      let thumbStartHeight = 0;
      let thumbEndHeight = 0;
      this.nodeComponent.thumbConnectors.forEach((thumb) => {
        if (thumb.thumbType === ThumbType.StartConnectorRight) {
          const offsetTop =
            ((thumb.domElement as HTMLElement)?.offsetTop ?? 0) / scale;
          const bounds = (
            thumb.domElement as HTMLElement
          ).getBoundingClientRect();
          const top = offsetTop + (bounds?.height ?? 0) / scale;

          if (top > thumbStartHeight) {
            thumbStartHeight = top;
          }
        }
        return thumb.thumbConnectionType === ThumbConnectionType.start;
      });
      this.nodeComponent.thumbConnectors.forEach((thumb) => {
        if (thumb.thumbType === ThumbType.EndConnectorLeft) {
          const offsetTop =
            ((thumb.domElement as HTMLElement)?.offsetTop ?? 0) / scale;
          const bounds = (
            thumb.domElement as HTMLElement
          ).getBoundingClientRect();
          const top = offsetTop + (bounds?.height ?? 0) / scale;

          if (top > thumbEndHeight) {
            thumbEndHeight = top;
          }
        }
        return thumb.thumbConnectionType === ThumbConnectionType.end;
      });
      this.minHeight =
        minHeightAdd + Math.max(thumbEndHeight, thumbStartHeight);
    }

    const astElementHtmlElement = this.rectInfo.astElement
      ?.domElement as unknown as HTMLElement;
    if (astElementHtmlElement) {
      astElementHtmlElement.style.width = width ? `${width}px` : 'auto';
      astElementHtmlElement.style.height = 'auto';
    }

    const rectContainerDOMElement = this.nodeComponent
      .domElement as unknown as HTMLElement;
    rectContainerDOMElement.style.width = width ? `${width}px` : 'auto';
    rectContainerDOMElement.style.height = `auto`;

    const astElementSize = astElementHtmlElement.getBoundingClientRect();

    this.nodeComponent.width = astElementSize.width
      ? astElementSize.width / scale
      : this.nodeComponent.width ?? 0;
    this.nodeComponent.height = astElementSize.height / scale;
    if (this.nodeComponent.height < this.minHeight) {
      this.nodeComponent.height = this.minHeight;
    }
    this.points.width = this.nodeComponent.width;
    this.points.height = this.nodeComponent.height;

    rectContainerDOMElement.style.width = `${this.nodeComponent.width}px`;
    rectContainerDOMElement.style.height = `${this.nodeComponent.height}px`;

    if (this.nodeComponent.update) {
      this.nodeComponent.update(
        this.nodeComponent,
        this.nodeComponent.x,
        this.nodeComponent.y,
        this.nodeComponent
      );
    }
    return {
      width: this.nodeComponent.width,
      height: this.nodeComponent.height,
    };
  }

  public getParentedCoordinates = () => {
    console.log('getParentedCoordinates', !!this.nodeComponent?.containerNode);
    let parentX = 0;
    let parentY = 0;
    if (
      this.nodeComponent?.containerNode &&
      this.nodeComponent?.containerNode.getParentedCoordinates
    ) {
      const { x, y } =
        this.nodeComponent.containerNode.getParentedCoordinates();
      parentX = x;
      parentY = y;
      console.log('parentX', parentX, 'parentY', parentY);
    }
    return {
      x: parentX + (this.nodeComponent?.x ?? 0),
      y: parentY + (this.nodeComponent?.y ?? 0),
    };
  };

  public addUpdateEventListener = (
    onUpdate: (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => void
  ) => {
    this.updateEventListeners.push(onUpdate);
  };

  public onReceiveDraggedConnection =
    (rectNode: IRectNodeComponent<T>) =>
    (thumbNode: IThumbNodeComponent<T>, component: INodeComponent<T>) => {
      // component is not the path itself but it is the drag-handle of a path (the parent of that handle is the path node-component)
      if (!rectNode) {
        return;
      }
      console.log(
        'DROPPED ON RIGHT THUMB',
        thumbNode,
        component.id,
        component.parent,
        component.connectionControllerType,
        rectNode.x,
        rectNode.y,
        rectNode.id
      );

      if (
        (component &&
          component.parent &&
          thumbNode.thumbConnectionType === ThumbConnectionType.end &&
          component.connectionControllerType ===
            ConnectionControllerType.end) ||
        (component &&
          component.parent &&
          thumbNode.thumbConnectionType === ThumbConnectionType.start &&
          component.connectionControllerType === ConnectionControllerType.begin)
      ) {
        const draggedConnection =
          component.parent as unknown as IConnectionNodeComponent<T>;
        let nodeReference = rectNode;
        if (
          component.connectionControllerType === ConnectionControllerType.begin
        ) {
          // remove connection from current start node
          const previousConnectionId = draggedConnection.id;
          if (previousConnectionId && draggedConnection.startNode) {
            draggedConnection.startNode.connections =
              draggedConnection.startNode.connections.filter((connection) => {
                return connection.id !== previousConnectionId;
              });
          }
          draggedConnection.startNode = this.nodeComponent;
          draggedConnection.startNodeThumb = thumbNode;
        } else {
          // remove connection from current end node
          const previousConnectionId = draggedConnection.id;
          if (draggedConnection.endNode) {
            draggedConnection.endNode.connections =
              draggedConnection.endNode.connections.filter((connection) => {
                return connection.id !== previousConnectionId;
              });
          }
          draggedConnection.endNode = this.nodeComponent;
          draggedConnection.endNodeThumb = thumbNode;
          if (draggedConnection.startNode) {
            // use start node as reference for the curve's begin point
            nodeReference = draggedConnection.startNode;
          }
        }
        component.parent.isControlled = true;

        // only push connection to rectNode if it is not already there
        // (because the user tried to reconnect it to another node but then decided to reconnect it to the same node again)
        if (
          !rectNode.connections?.find(
            (connection) => connection.id === draggedConnection.id
          )
        ) {
          rectNode.connections?.push(draggedConnection);
        }

        // Update both sides of the connection to get a correct curve
        if (component.parent.update) {
          component.parent.update(
            component.parent,
            nodeReference.x,
            nodeReference.y,
            this.nodeComponent
          );
          if (
            component.connectionControllerType ===
            ConnectionControllerType.begin
          ) {
            if (draggedConnection.endNode) {
              component.parent.update(
                component.parent,
                nodeReference.x,
                nodeReference.y,
                draggedConnection.endNode
              );
            }
          } else {
            if (draggedConnection.startNode) {
              component.parent.update(
                component.parent,
                nodeReference.x,
                nodeReference.y,
                draggedConnection.startNode
              );
            }
          }
        }

        (this.canvas?.domElement as unknown as HTMLElement | SVGElement).append(
          draggedConnection.startNode?.domElement as unknown as HTMLElement
        );

        if (this.canvasUpdated) {
          this.canvasUpdated();
        }
      }
    };

  public onCanReceiveDroppedComponent(
    thumbNodeDropTarget: IThumbNodeComponent<T>,
    draggedConnectionController: INodeComponent<T>,
    receivingThumbNode: IThumbNodeComponent<T>
  ) {
    // thumbNodeDropTarget is the thumb that is being dropped on
    // thumbNodeDropTarget.thumbLinkedToNode is the node that is being dropped on

    // draggedConnectionController is connection-controller
    // draggedConnectionController.parent is the connection that is being dragged

    let connectionCount = 0;
    const connections = (
      thumbNodeDropTarget.thumbLinkedToNode as unknown as IRectNodeComponent<T>
    )?.connections;
    if (thumbNodeDropTarget.thumbConnectionType === ThumbConnectionType.start) {
      connectionCount = connections?.filter((connection) => {
        return connection.startNodeThumb?.id === thumbNodeDropTarget.id;
      }).length;
    } else {
      connectionCount = connections.filter((connection) => {
        return connection.endNodeThumb?.id === thumbNodeDropTarget.id;
      }).length;
    }
    console.log(
      'onCanReceiveDroppedComponent',
      thumbNodeDropTarget.thumbConnectionType,
      draggedConnectionController.connectionControllerType,
      draggedConnectionController,
      thumbNodeDropTarget.thumbLinkedToNode?.id,
      connections,
      thumbNodeDropTarget,

      receivingThumbNode,
      connectionCount
    );

    if (
      (thumbNodeDropTarget.maxConnections !== undefined &&
        thumbNodeDropTarget.maxConnections !== -1 &&
        connectionCount >= thumbNodeDropTarget.maxConnections) ||
      (thumbNodeDropTarget.maxConnections === undefined && connectionCount >= 1)
    ) {
      console.log('onCanReceiveDroppedComponent FALSE1');
      return false;
    }

    if (
      draggedConnectionController &&
      draggedConnectionController.parent &&
      thumbNodeDropTarget.thumbConnectionType === ThumbConnectionType.end &&
      draggedConnectionController.connectionControllerType ===
        ConnectionControllerType.end
    ) {
      console.log(
        'DROPPED ON RIGHT THUMB',
        thumbNodeDropTarget.thumbConstraint,
        (
          draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
        ).startNodeThumb?.thumbConstraint
      );

      if (
        thumbNodeDropTarget.thumbConstraint !==
        (
          draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
        ).startNodeThumb?.thumbConstraint
      ) {
        const thumbConstraint = (
          draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
        ).startNodeThumb?.thumbConstraint;
        if (
          Array.isArray(thumbNodeDropTarget.thumbConstraint) &&
          !Array.isArray(thumbConstraint) &&
          typeof thumbConstraint === 'string'
        ) {
          if (
            thumbNodeDropTarget.thumbConstraint.indexOf(thumbConstraint) < 0
          ) {
            console.log('onCanReceiveDroppedComponent FALSE2');
            return false;
          }
        }
        if (
          typeof thumbNodeDropTarget.thumbConstraint === 'string' &&
          typeof thumbConstraint === 'string' &&
          thumbNodeDropTarget.thumbConstraint &&
          (
            draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
          ).startNodeThumb?.thumbConstraint
        ) {
          console.log('onCanReceiveDroppedComponent FALSE2');
          return false;
        }
      }
      return true;
    } else if (
      draggedConnectionController &&
      draggedConnectionController.parent &&
      thumbNodeDropTarget.thumbConnectionType === ThumbConnectionType.start &&
      draggedConnectionController.connectionControllerType ===
        ConnectionControllerType.begin
    ) {
      console.log(
        'DROPPED ON LEFT THUMB',
        thumbNodeDropTarget.thumbConstraint,
        (
          draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
        ).endNodeThumb?.thumbConstraint
      );

      if (
        (
          draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
        ).endNodeThumb?.thumbConstraint !== undefined &&
        thumbNodeDropTarget.thumbConstraint !==
          (
            draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
          ).endNodeThumb?.thumbConstraint
      ) {
        if (
          thumbNodeDropTarget.thumbConstraint &&
          (
            draggedConnectionController.parent as unknown as IConnectionNodeComponent<T>
          ).endNodeThumb?.thumbConstraint
        ) {
          console.log('onCanReceiveDroppedComponent FALSE3');
          return false;
        }
      }
      return true;
    }
    console.log('onCanReceiveDroppedComponent FALSE4');
    return false;
  }
  oldWidth = -1;
  oldHeight = -1;
  onEndThumbConnectorElementupdate = (
    target?: INodeComponent<T>,
    x?: number,
    y?: number,
    initiator?: INodeComponent<T>
  ) => {
    if (!target || x === undefined || y === undefined || !initiator) {
      return false;
    }
    if (
      this.oldWidth === -1 ||
      this.oldHeight === -1 ||
      this.oldWidth !== this.nodeComponent?.width ||
      this.oldHeight !== this.nodeComponent?.height
    ) {
      this.oldWidth = this.nodeComponent?.width ?? -1;
      this.oldHeight = this.nodeComponent?.height ?? -1;
      this.nodeComponent?.thumbConnectors?.forEach((thumbConnector) => {
        if (thumbConnector.domElement && this.nodeComponent) {
          const { x, y } = thumbPosition(
            this.nodeComponent,
            thumbConnector.thumbType ?? ThumbType.None,
            thumbConnector.thumbIndex ?? 0,
            thumbConnector
          );

          (
            thumbConnector.domElement as HTMLElement
          ).style.left = `calc(${x}px - ${thumbWidth / 2}px)`;
          (
            thumbConnector.domElement as HTMLElement
          ).style.top = `calc(${y}px - ${thumbHeight / 2}px)`;
        }
      });
    }
    setPosition(target, x, y, initiator?.nodeType !== NodeType.Shape, false);
    return true;
  };

  protected setSize = (width: number, height: number) => {
    this.points.width = width;
    this.points.height = height;
  };

  protected createRectElement = (
    canvasElement: DOMElementNode,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    width: number,
    height: number,
    _pathHiddenElement: IElementNode<T>,
    _text?: string,

    _getThumbPosition?: (
      thumbType: ThumbType,
      index?: number,
      offsetY?: number,
      thumb?: IThumbNodeComponent<T>
    ) => { x: number; y: number },
    markup?: string | INodeComponent<T>,
    layoutProperties?: {
      classNames?: string;
    },
    _hasStaticWidthHeight?: boolean,
    disableInteraction?: boolean,
    _canvasUpdated?: () => void,
    id?: string,
    parentNodeClassName?: string
  ) => {
    /*
      draw svg path based on bbox of the hidden path
        
        - add padding to the bbox x and y and width and height
  
        - subtract bbox x and y from the path points
        - set transform of svg to the bbox x and y
        - set the width and height of the svg to the bbox width and height   
    */

    this.points = {
      beginX: startX,
      beginY: startY,
      width: width,
      height: height,
    };

    const pathPoints = {
      beginX: this.points.beginX,
      beginY: this.points.beginY,
      width: this.points.width,
      height: this.points.height,
    };

    const rectContainerElement = createNodeElement(
      'div',
      {
        class: `${
          parentNodeClassName ?? 'rect-node'
        } absolute top-0 left-0 select-none `, //will-change-transform,
        ['data-node-id']: id ?? '',
      },
      canvasElement,
      undefined,
      id
    ) as unknown as IRectNodeComponent<T> | undefined;

    if (!rectContainerElement)
      throw new Error('rectContainerElement is undefined');

    rectContainerElement.nodeType = NodeType.Shape;
    if (!id && rectContainerElement.id) {
      (rectContainerElement.domElement as HTMLElement).setAttribute(
        'data-node-id',
        rectContainerElement.id
      );
    }

    let astElement: any;

    const hasPointerEvents = !disableInteraction;

    if (markup !== undefined && typeof markup === 'string') {
      const compiledMarkup = compileMarkup(
        `<div class="${layoutProperties?.classNames ?? ''} overflow-hidden">
          ${markup ?? ''}
        </div>`
      );
      if (!compiledMarkup) {
        throw new Error('Invalid markup');
      }

      if (
        compiledMarkup &&
        rectContainerElement &&
        rectContainerElement.domElement
      ) {
        astElement = createASTNodeElement(
          compiledMarkup.body,
          rectContainerElement.domElement,
          rectContainerElement.elements
        );
      }
    } else if (markup !== undefined) {
      astElement = markup as unknown as INodeComponent<T>;
      rectContainerElement.domElement.appendChild(astElement.domElement);
      rectContainerElement.elements.set(astElement.id, astElement);
    } else {
      throw new Error('No markup or INodeComponent');
    }

    if (astElement && hasPointerEvents) {
      astElement.domElement.addEventListener(
        'pointerdown',
        this.astElementOnPointerDown
      );
    }

    if (!rectContainerElement) throw new Error('nodeComponent is undefined');

    const bbox = this.getBBoxPath(pathPoints);

    const divDomElement =
      rectContainerElement.domElement as unknown as HTMLElement;
    divDomElement.style.width = `${bbox.width}px`;
    divDomElement.style.height = `${bbox.height}px`;
    divDomElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    elements.set(rectContainerElement.id, rectContainerElement);

    return {
      nodeComponent: rectContainerElement,
      astElement,
    };
  };

  protected onPointerDown = (_e: PointerEvent) => {
    return false;
  };

  private astElementOnPointerDown = (event: PointerEvent) => {
    console.log(
      'astElementOnPointerDown',
      event.target,
      this.nodeComponent?.id,
      this.nodeComponent?.nodeInfo
    );
    if (
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
        (event.target as HTMLElement)?.tagName
      ) >= 0
    )
      return;

    event.stopPropagation();

    if (this.onPointerDown(event)) {
      return;
    }

    if (this.nodeComponent && this.canvas) {
      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      // todo : use offsetY ?? because of mobile keyboard?
      //  .. if window.visualViewport.offsetTop gebruiken??
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY - (window?.visualViewport?.offsetTop ?? 0)
      );
      const rect = transformCameraSpaceToWorldSpace(
        elementRect.x,
        elementRect.y
      );
      const bbox = this.getBBoxPath(this.points);

      let parentX = 0;
      let parentY = 0;
      if (this.containerNode) {
        if (this.containerNode && this.containerNode?.getParentedCoordinates) {
          const parentCoordinates =
            this.containerNode?.getParentedCoordinates() ?? {
              x: 0,
              y: 0,
            };
          // parentX = this.containerNode.x;
          // parentY = this.containerNode.y;
          parentX = parentCoordinates.x;
          parentY = parentCoordinates.y;
        }
      }

      const interactionInfoResult = pointerDown(
        x - rect.x + parentX - (this.points.beginX - bbox.x),
        y - rect.y + parentY - (this.points.beginY - bbox.y),
        this.nodeComponent,
        this.canvas,
        this.interactionStateMachine
      );

      if (interactionInfoResult) {
        // .. this is a hack to make sure that the element is always on top
        // .. this causes a refresh of the iframe-html-node
        // (this.canvas?.domElement as unknown as HTMLElement | SVGElement).append(
        //   this.nodeComponent.domElement
        // );
      }
    }
  };

  protected getBBoxPath(pathPoints: {
    beginX: number;
    beginY: number;
    width: number;
    height: number;
  }) {
    return {
      x: pathPoints.beginX,
      y: pathPoints.beginY,
      width: pathPoints.width,
      height: pathPoints.height,
    };
  }

  protected onUpdate =
    (
      astElement: INodeComponent<T>,
      getThumbPosition?: (
        thumbType: ThumbType,
        index?: number,
        offsetY?: number,
        thumb?: IThumbNodeComponent<T>
      ) => { x: number; y: number }
    ) =>
    (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      if (
        this.nodeComponent &&
        target.nodeType === NodeType.Shape &&
        initiator.nodeType === NodeType.Shape
      ) {
        this.points.beginX = x;
        this.points.beginY = y;

        if (
          initiator.containerNode &&
          initiator.containerNode.id === target.id
        ) {
          // a node within this container was updated (resize!)
          if (
            initiator.x > 0 &&
            (initiator.width ?? 0) + initiator.x > this.points.width
          ) {
            this.points.width = (initiator.width ?? 0) + initiator.x;
          }
          if (
            initiator.y > 0 &&
            (initiator.height ?? 0) + initiator.y > this.points.height
          ) {
            this.points.height = (initiator.height ?? 0) + initiator.y;
          }
          let updateInitiator = false;
          let newX = initiator.x;
          let newY = initiator.y;
          if (initiator.x < 0) {
            this.points.beginX = this.points.beginX + initiator.x;
            this.points.width = this.points.width - initiator.x;

            updateInitiator = true;
            newX = 0;
          }
          if (initiator.y < 0) {
            this.points.beginY = this.points.beginY + initiator.y;
            this.points.height = this.points.height - initiator.y;
            updateInitiator = true;
            newY = 0;
          }
          if (updateInitiator && initiator.update) {
            const state =
              this.interactionStateMachine.getCurrentInteractionState();
            if (state && state.target && state.target.interactionInfo) {
              if (newX === 0) {
                state.target.interactionInfo.xOffsetWithinElementOnFirstClick +=
                  initiator.x;
              }
              if (newY === 0) {
                state.target.interactionInfo.yOffsetWithinElementOnFirstClick +=
                  initiator.y;
              }
            }

            initiator.update(initiator, newX, newY, this.nodeComponent);
          }
          // TODO : update inner thumbs which are rectNodes
          // TODO : update all other child rectNodes and connections
          // TODO : store container width and height
        }

        this.nodeComponent.x = this.points.beginX;
        this.nodeComponent.y = this.points.beginY;

        if (getThumbPosition) {
          target?.thumbConnectors?.forEach(
            (connector: IThumbNodeComponent<T>) => {
              if (connector && connector.update && connector.thumbType) {
                const position = getThumbPosition(
                  connector.thumbType,
                  connector.thumbIndex ?? 0,
                  undefined,
                  connector
                );
                connector.update(connector, position.x, position.y, initiator);
              }
            }
          );
        }

        const pathPoints = {
          beginX: this.points.beginX,
          beginY: this.points.beginY,
          width: this.points.width,
          height: this.points.height,
        };

        const bbox = this.getBBoxPath(pathPoints);

        const divDomElement = this.nodeComponent
          .domElement as unknown as HTMLElement;
        divDomElement.style.width = `${bbox.width}px`;
        divDomElement.style.height = `${bbox.height}px`;
        divDomElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

        this.nodeComponent.x = this.points.beginX;
        this.nodeComponent.y = this.points.beginY;
        this.nodeComponent.width = this.points.width;
        this.nodeComponent.height = this.points.height;

        const astDomElement = astElement.domElement as unknown as HTMLElement;
        astDomElement.style.width = `${bbox.width}px`;
        astDomElement.style.height = `${bbox.height}px`;
      } else if (
        this.nodeComponent &&
        target.nodeType === NodeType.Shape &&
        initiator.nodeType === NodeType.Connection &&
        !this.isStaticPosition
      ) {
        const startThumb = (initiator as unknown as IConnectionNodeComponent<T>)
          .startNodeThumb;
        const startNode = (initiator as unknown as IConnectionNodeComponent<T>)
          .startNode;

        const endThumb = (initiator as unknown as IConnectionNodeComponent<T>)
          .endNodeThumb;
        const endNode = (initiator as unknown as IConnectionNodeComponent<T>)
          .endNode;

        if (startThumb && startNode && startNode.id === target.id) {
          const tx = calculateConnectorX(
            startThumb?.thumbType ?? ThumbType.None,
            startNode?.width ?? 0
          );
          const ty = calculateConnectorY(
            startThumb?.thumbType ?? ThumbType.None,
            startNode?.width ?? 0,
            startNode?.height ?? 0,
            startThumb?.thumbIndex ?? 0,
            startThumb
          );

          this.points.beginX = x - tx;
          this.points.beginY = y - ty;
        }
        if (endThumb && endNode && endNode.id === target.id) {
          const tx = calculateConnectorX(
            endThumb?.thumbType ?? ThumbType.None,
            endNode?.width ?? 0
          );
          const ty = calculateConnectorY(
            endThumb?.thumbType ?? ThumbType.None,
            endNode?.width ?? 0,
            endNode?.height ?? 0,
            endThumb?.thumbIndex ?? 0,
            endThumb
          );
          this.points.beginX = x - tx;
          this.points.beginY = y - ty;
        }

        if (this.nodeComponent) {
          this.nodeComponent.x = this.points.beginX;
          this.nodeComponent.y = this.points.beginY;
        }

        const pathPoints = {
          beginX: this.points.beginX,
          beginY: this.points.beginY,
          width: this.points.width,
          height: this.points.height,
        };

        const bbox = this.getBBoxPath(pathPoints);

        const divDomElement = this.nodeComponent
          .domElement as unknown as HTMLElement;
        divDomElement.style.width = `${bbox.width}px`;
        divDomElement.style.height = `${bbox.height}px`;
        divDomElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

        this.nodeComponent.x = this.points.beginX;
        this.nodeComponent.y = this.points.beginY;
        this.nodeComponent.width = this.points.width;
        this.nodeComponent.height = this.points.height;

        const astDomElement = astElement.domElement as unknown as HTMLElement;
        astDomElement.style.width = `${bbox.width}px`;
        astDomElement.style.height = `${bbox.height}px`;
      }

      if (this.nodeComponent) {
        // get all connections that have this node as start or end
        this.nodeComponent.connections?.forEach((connection) => {
          if (
            initiator?.nodeType === NodeType.Connection &&
            connection.id === initiator.id
          ) {
            return;
          }
          if (connection.nodeType === NodeType.Connection) {
            const start =
              connection.startNode === this.nodeComponent && connection;
            const end = connection.endNode === this.nodeComponent && connection;
            if (start && connection && connection.update) {
              connection.update(
                connection,
                this.points.beginX,
                this.points.beginY,
                this.nodeComponent
              );
              if (connection.endNode) {
                connection.update(
                  connection,
                  this.points.beginX,
                  this.points.beginY,
                  connection.endNode
                );
              }
            }
            if (end && connection && connection.update && this.nodeComponent) {
              connection.update(
                connection,
                this.points.beginX,
                this.points.beginY,
                this.nodeComponent
              );
              if (connection.startNode) {
                connection.update(
                  connection,
                  this.points.beginX,
                  this.points.beginY,
                  connection.startNode
                );
              }
            }
          }
        });

        if (
          this.containerNode &&
          this.containerNode.update &&
          initiator &&
          initiator.id !== this.containerNode.id
        ) {
          this.containerNode.update(
            this.containerNode,
            this.containerNode.x,
            this.containerNode.y,
            this.nodeComponent
          );
        }
      }

      this.updateEventListeners.forEach((onUpdate) => {
        onUpdate(this.nodeComponent, x, y, initiator);
      });

      this.nodeTransformer.updateCamera();

      return true;
    };
}
