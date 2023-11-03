import { transformCameraSpaceToWorldSpace } from '../camera';
import { paddingRect, totalPaddingRect } from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { setSelectNode } from '../reactivity';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown } from './events/pointer-events';
import {
  onCubicCalculateControlPoints,
  onGetConnectionToThumbOffset,
} from './utils/calculate-cubic-control-points';

export class Connection<T> {
  nodeComponent?: IConnectionNodeComponent<T>;
  points = {
    beginX: 0,
    beginY: 0,

    cx1: 0,
    cy1: 0,
    cx2: 0,
    cy2: 0,
    endX: 0,
    endY: 0,
  };
  orgPoints = {
    beginX: 0,
    beginY: 0,

    cx1: 0,
    cy1: 0,
    cx2: 0,
    cy2: 0,
    endX: 0,
    endY: 0,
  };

  onCalculateControlPoints = onCubicCalculateControlPoints;
  pathElement: IElementNode<T> | undefined = undefined;
  pathTransparentElement: IElementNode<T> | undefined = undefined;
  svgParent: IElementNode<T> | undefined = undefined;
  canvas: IElementNode<T> | undefined;
  canvasElement: DOMElementNode;
  interactionStateMachine: InteractionStateMachine<T>;

  pathHiddenElement: IElementNode<T> | null = null;
  containerNode?: INodeComponent<T>;

  constructor(
    canvas: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number,
    pathHiddenElement: IElementNode<T>,
    isDashed = false,
    onCalculateControlPoints = onCubicCalculateControlPoints,
    canvasUpdated?: () => void,
    id?: string,
    containerNode?: IRectNodeComponent<T>
  ) {
    /*
    draw svg path based on bbox of the hidden path
      
      - add padding to the bbox x and y and width and height

      - subtract bbox x and y from the path points
      - set transform of svg to the bbox x and y
      - set the width and height of the svg to the bbox width and height   
    */
    this.onCalculateControlPoints = onCalculateControlPoints;
    this.pathHiddenElement = pathHiddenElement;
    this.canvas = canvas;
    this.canvasElement = canvas.domElement;
    this.interactionStateMachine = interactionStateMachine;
    this.containerNode = containerNode;

    this.points = {
      beginX: startX,
      beginY: startY,

      cx1: controlPoint1X,
      cy1: controlPoint1Y,
      cx2: controlPoint2X,
      cy2: controlPoint2Y,
      endX: endX,
      endY: endY,
    };

    this.svgParent = createNSElement(
      'svg',
      {
        width: 0,
        height: 0,
        class: `connection absolute top-0 left-0 pointer-events-none`, //pointer-events-bounding-box',
      },
      this.canvasElement
    );
    (this.canvasElement as unknown as HTMLElement).prepend(
      this.svgParent.domElement
    );

    (this.svgParent.domElement as HTMLElement).setAttribute(
      'connection-id',
      id ?? ''
    );

    this.createArrowMarker();

    this.nodeComponent = createSVGNodeComponent(
      'g',
      {},
      this.svgParent.domElement,
      undefined,
      undefined,
      id
    ) as unknown as IConnectionNodeComponent<T>;

    if (!this.nodeComponent) throw new Error('nodeComponent is undefined');

    this.nodeComponent.nodeType = NodeType.Connection;
    this.nodeComponent.onCalculateControlPoints = onCalculateControlPoints;
    this.nodeComponent.controlPointNodes = [];
    this.nodeComponent.containerNode = containerNode;
    this.nodeComponent.connectorWrapper = this.svgParent;
    this.nodeComponent.delete = () => {
      if (this.svgParent) {
        this.svgParent.domElement.remove();
      }
    };

    this.nodeComponent.controlPoints = this.setControlPoints();

    const { offsetX: startOffsetX, offsetY: startOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.start,
        this.nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
      );
    const { offsetX: endOffsetX, offsetY: endOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.end,
        this.nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
      );
    const bbox = this.getBBoxPath(
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );
    const svgParentElement = this.svgParent
      .domElement as unknown as HTMLElement;
    svgParentElement.style.width = `${bbox.width}px`;
    svgParentElement.style.height = `${bbox.height}px`;
    svgParentElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    const dashedStroke =
      isDashed || this.nodeComponent.isData
        ? {
            'stroke-dasharray': '10,10',
          }
        : undefined;

    const path = this.getPath(
      bbox,
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );

    this.pathTransparentElement = createNSElement(
      'path',
      {
        class: 'connection-path pointer-events-auto cursor-pointer',
        d: path,
        stroke: 'transparent',
        'stroke-width': 50,
        fill: 'transparent',
        pointerdown: this.onPointerDown,
      },
      this.nodeComponent.domElement
    );

    this.pathElement = createNSElement(
      'path',
      {
        class: 'pointer-events-none',
        d: path,
        stroke: 'white',
        //'marker-start': 'url(#arrowbegin)',
        'marker-end': 'url(#arrow)',
        'stroke-width': 3,
        ...dashedStroke,
        fill: 'transparent',
      },
      this.nodeComponent.domElement
    );
    this.nodeComponent.pathElement = this.pathElement;

    if (!this.pathElement) throw new Error('pathElement is undefined');
    if (!this.pathTransparentElement)
      throw new Error('pathTransparentElement is undefined');

    elements.set(this.nodeComponent.id, this.nodeComponent);
    this.nodeComponent.elements.set(this.pathElement.id, this.pathElement);

    this.nodeComponent.update = this.onUpdate;

    this.nodeComponent.updateEnd = () => {
      if (canvasUpdated) {
        canvasUpdated();
      }
    };

    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;
    this.nodeComponent.endX = 0;
    this.nodeComponent.endY = 0;
  }

  getBBoxPath = (
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ) => {
    this.setHiddenPath(startOffsetX, startOffsetY, endOffsetX, endOffsetY);

    const bbox = (
      this.pathHiddenElement?.domElement as unknown as SVGPathElement
    ).getBBox();

    return {
      x: bbox.x - paddingRect,
      y: bbox.y - paddingRect,
      width: bbox.width + totalPaddingRect,
      height: bbox.height + totalPaddingRect,
    };
  };

  interactionInfo: false | IPointerDownResult = false;

  onPointerDown = (e: PointerEvent) => {
    console.log('CONNECTION POINTER DOWN', this.nodeComponent?.isControlled);
    if (this.nodeComponent) {
      e.stopPropagation();
      setSelectNode({
        id: this.nodeComponent.id,
        containerNode: this.nodeComponent
          .containerNode as unknown as INodeComponent<unknown>,
      });

      this.orgPoints = { ...this.points };

      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      const { offsetX: startOffsetX, offsetY: startOffsetY } =
        onGetConnectionToThumbOffset(
          ControlAndEndPointNodeType.start,
          this.nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
        );
      const { offsetX: endOffsetX, offsetY: endOffsetY } =
        onGetConnectionToThumbOffset(
          ControlAndEndPointNodeType.end,
          this.nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
        );
      const bbox = this.getBBoxPath(
        startOffsetX,
        startOffsetY,
        endOffsetX,
        endOffsetY
      );

      const { x, y } = transformCameraSpaceToWorldSpace(e.clientX, e.clientY);
      const rect = transformCameraSpaceToWorldSpace(
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
          // parentX = this.containerNode.x ;
          // parentY = this.containerNode.y;
          parentX = parentCoordinates.x;
          parentY = parentCoordinates.y;
        }
      }

      const interactionInfoResult = pointerDown<T>(
        x - rect.x - (this.points.beginX - bbox.x - paddingRect) + parentX,
        y - rect.y - (this.points.beginY - bbox.y - paddingRect) + parentY,
        this.nodeComponent,
        this.canvas as IElementNode<T>,
        this.interactionStateMachine
      );
      this.interactionInfo = interactionInfoResult;
    }
  };

  onUpdate = (
    target?: INodeComponent<T>,
    x?: number,
    y?: number,
    initiator?: INodeComponent<T>
  ) => {
    const connection = target as unknown as IConnectionNodeComponent<T>;
    if (!target && x === undefined && y === undefined && !initiator) {
      // eslint-disable-next-line no-console
      // update all in this condition...
    }

    if (this.nodeComponent && this.nodeComponent.layer) {
      const layer = this.nodeComponent.layer ?? 1;
      const parentDomElement = this.svgParent?.domElement as SVGElement;
      if (layer > 1) {
        if (!parentDomElement.classList.contains('layer-2')) {
          parentDomElement.classList.add('layer-2');
        }
      } else {
        if (parentDomElement.classList.contains('layer-2')) {
          parentDomElement.classList.remove('layer-2');
        }
      }
    }
    if (this.nodeComponent && this.nodeComponent.isData) {
      (this.nodeComponent.domElement as SVGPathElement).setAttribute(
        'stroke-dasharray',
        '5,5'
      );
    }

    let skipChecks = false;
    let updateThumbs = false;

    if (!target || x === undefined || y === undefined || !initiator) {
      // needed for updating without using parameters (...update() )
      if (this.nodeComponent?.startNode) {
        const start = this.onCalculateControlPoints(
          this.nodeComponent?.startNode,
          ControlAndEndPointNodeType.start,
          this.nodeComponent.startNodeThumb?.thumbType ??
            (this.nodeComponent.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          this.nodeComponent.startNodeThumb,
          this.nodeComponent.startNodeThumb?.thumbIndex,
          this.nodeComponent.endNode ??
            ({
              x: this.points.endX,
              y: this.points.endY,
              width: 0,
              height: 0,
            } as IRectNodeComponent<T>),
          this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
          this.nodeComponent.endNodeThumb
        );

        this.points.beginX = start.x;
        this.points.beginY = start.y;

        this.points.cx1 = start.cx;
        this.points.cy1 = start.cy;
        skipChecks = true;
        updateThumbs = true;
      } else {
        this.points.cx1 = this.points.beginX + 150;
        this.points.cy1 = this.points.beginY;
      }

      if (this.nodeComponent?.endNode) {
        const end = this.onCalculateControlPoints(
          this.nodeComponent?.endNode,
          ControlAndEndPointNodeType.end,
          this.nodeComponent.endNodeThumb?.thumbType ??
            (this.nodeComponent.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          this.nodeComponent.endNodeThumb,
          this.nodeComponent.endNodeThumb?.thumbIndex,
          this.nodeComponent.startNode,
          this.nodeComponent.endNodeThumb?.thumbControlPointDistance,
          this.nodeComponent.startNodeThumb
        );
        this.points.endX = end.x;
        this.points.endY = end.y;

        this.points.cx2 = end.cx;
        this.points.cy2 = end.cy;
        skipChecks = true;
        updateThumbs = true;
      } else {
        this.points.cx2 = this.points.endX - 150;
        this.points.cy2 = this.points.endY;

        if (this.nodeComponent?.startNode) {
          const start = this.onCalculateControlPoints(
            this.nodeComponent?.startNode,
            ControlAndEndPointNodeType.start,
            this.nodeComponent.startNodeThumb?.thumbType ??
              (this.nodeComponent.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None),
            this.nodeComponent.startNodeThumb,
            this.nodeComponent.startNodeThumb?.thumbIndex,
            this.nodeComponent.endNode ??
              ({
                x: this.points.endX,
                y: this.points.endY,
                width: 0,
                height: 0,
              } as IRectNodeComponent<T>),
            this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
            this.nodeComponent.endNodeThumb
          );

          this.points.beginX = start.x;
          this.points.beginY = start.y;

          this.points.cx1 = start.cx;
          this.points.cy1 = start.cy;
        }

        skipChecks = true;

        updateThumbs = true;
      }

      if (!updateThumbs) {
        return false;
      }
    }

    if (
      !skipChecks &&
      target &&
      initiator &&
      x !== undefined &&
      y !== undefined &&
      target.nodeType === NodeType.Connection &&
      (initiator.nodeType === NodeType.Connection ||
        initiator.nodeType === NodeType.Shape)
    ) {
      if (connection.startNode && initiator.id === connection.startNode.id) {
        const start = this.onCalculateControlPoints(
          initiator as unknown as IRectNodeComponent<T>,
          ControlAndEndPointNodeType.start,
          connection.startNodeThumb?.thumbType ??
            (connection.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          connection.startNodeThumb,
          connection.startNodeThumb?.thumbIndex,
          connection.endNode ??
            ({
              x: this.points.endX,
              y: this.points.endY,
              width: 0,
              height: 0,
            } as IRectNodeComponent<T>),
          connection.startNodeThumb?.thumbControlPointDistance,
          connection.endNodeThumb
        );
        this.points.beginX = start.x;
        this.points.beginY = start.y;

        this.points.cx1 = start.cx;
        this.points.cy1 = start.cy;
      } else if (connection.endNode && initiator.id === connection.endNode.id) {
        const end = this.onCalculateControlPoints(
          initiator as unknown as IRectNodeComponent<T>,
          ControlAndEndPointNodeType.end,
          connection.endNodeThumb?.thumbType ??
            (connection.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          connection.endNodeThumb,
          connection.endNodeThumb?.thumbIndex,
          connection.startNode,
          connection.endNodeThumb?.thumbControlPointDistance,
          connection.startNodeThumb
        );
        this.points.endX = end.x;
        this.points.endY = end.y;

        this.points.cx2 = end.cx;
        this.points.cy2 = end.cy;
      } else {
        const isStaticStart = connection.startNode?.isStaticPosition ?? false;
        const isStaticEnd = connection.endNode?.isStaticPosition ?? false;
        const diffC1x = this.points.cx1 - this.points.beginX;
        const diffC1y = this.points.cy1 - this.points.beginY;
        let diffC2x = this.points.cx2 - this.points.beginX;
        let diffC2y = this.points.cy2 - this.points.beginY;
        let diffEndX = this.points.endX - this.points.beginX;
        let diffEndY = this.points.endY - this.points.beginY;
        if (isStaticStart && !isStaticEnd) {
          // this needs to be the org distance at the moment the drag started...

          diffC2x = this.orgPoints.cx2 - this.points.beginX;
          diffC2y = this.orgPoints.cy2 - this.points.beginY;
          diffEndX = this.orgPoints.endX - this.points.beginX;
          diffEndY = this.orgPoints.endY - this.points.beginY;
        }

        if (!isStaticStart) {
          this.points.beginX = x;
          this.points.beginY = y;

          this.points.cx1 = x + diffC1x;
          this.points.cy1 = y + diffC1y;
        }

        if (!isStaticEnd && !isStaticStart) {
          this.points.cx2 = x + diffC2x;
          this.points.cy2 = y + diffC2y;
          this.points.endX = x + diffEndX;
          this.points.endY = y + diffEndY;
        } else if (!isStaticEnd && isStaticStart) {
          this.points.cx2 = x + diffC2x;
          this.points.cy2 = y + diffC2y;
          this.points.endX = x + diffEndX;
          this.points.endY = y + diffEndY;
        }
      }

      if (this.nodeComponent?.startNode) {
        const circle =
          this.nodeComponent.connectionStartNodeThumb?.getThumbCircleElement?.();
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          'pointer-events-auto'
        );
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          'pointer-events-none'
        );
      }

      if (this.nodeComponent?.endNode) {
        const circle =
          this.nodeComponent.connectionEndNodeThumb?.getThumbCircleElement?.();
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          'pointer-events-auto'
        );
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          'pointer-events-none'
        );
      }
      if (this.nodeComponent?.controlPoints?.length) {
        const { offsetX: startOffsetX, offsetY: startOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.start,
            this.nodeComponent?.startNodeThumb?.thumbType ??
              (this.nodeComponent.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None)
          );
        const { offsetX: endOffsetX, offsetY: endOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.end,
            this.nodeComponent?.endNodeThumb?.thumbType ??
              (this.nodeComponent.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None)
          );

        this.nodeComponent.connectionStartNodeThumb?.update?.(
          this.nodeComponent?.connectionStartNodeThumb,
          this.points.beginX + startOffsetX,
          this.points.beginY + startOffsetY,
          this.nodeComponent
        );

        this.nodeComponent.connectionEndNodeThumb?.update?.(
          this.nodeComponent?.connectionEndNodeThumb,
          this.points.endX + endOffsetX,
          this.points.endY + endOffsetY,
          this.nodeComponent
        );
      }
    } else if (!skipChecks) {
      if (initiator && !initiator.connectionControllerType) {
        return false;
      }

      // Neem de x en y van de controller-thumb over...
      if (initiator && x !== undefined && y !== undefined) {
        if (this.nodeComponent?.startNode) {
          const start = this.onCalculateControlPoints(
            this.nodeComponent?.startNode,
            ControlAndEndPointNodeType.start,
            this.nodeComponent.startNodeThumb?.thumbType ??
              (this.nodeComponent.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None),
            this.nodeComponent.startNodeThumb,
            this.nodeComponent.startNodeThumb?.thumbIndex,
            this.nodeComponent.endNode ??
              ({
                x: this.points.endX,
                y: this.points.endY,
                width: 0,
                height: 0,
              } as IRectNodeComponent<T>),
            this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
            this.nodeComponent.endNodeThumb
          );

          this.points.beginX = start.x;
          this.points.beginY = start.y;

          this.points.cx1 = start.cx;
          this.points.cy1 = start.cy;
        }

        const { offsetX: startOffsetX, offsetY: startOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.start,
            this.nodeComponent?.startNodeThumb?.thumbType ??
              (this.nodeComponent?.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None)
          );
        const { offsetX: endOffsetX, offsetY: endOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.end,
            this.nodeComponent?.endNodeThumb?.thumbType ??
              (this.nodeComponent?.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None)
          );

        if (
          initiator.connectionControllerType === ConnectionControllerType.begin
        ) {
          this.points.beginX = x - startOffsetX;
          this.points.beginY = y - startOffsetY;

          if (!this.nodeComponent?.startNode) {
            this.points.cx1 = this.points.beginX + 150;
            this.points.cy1 = this.points.beginY;

            if (this.nodeComponent) {
              this.nodeComponent.connectionStartNodeThumb?.update?.(
                this.nodeComponent.connectionStartNodeThumb,
                this.points.beginX,
                this.points.beginY,
                this.nodeComponent
              );
            }
          }
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.c1
        ) {
          this.points.cx1 = x;
          this.points.cy1 = y;
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.c2
        ) {
          this.points.cx2 = x;
          this.points.cy2 = y;
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.end
        ) {
          this.points.endX = x - endOffsetX;
          this.points.endY = y - endOffsetY;

          if (!this.nodeComponent?.endNode) {
            this.points.cx2 = this.points.endX - 150;
            this.points.cy2 = this.points.endY;
          }

          if (this.nodeComponent) {
            this.nodeComponent.connectionEndNodeThumb?.update?.(
              this.nodeComponent.connectionEndNodeThumb,
              this.points.endX,
              this.points.endY,
              this.nodeComponent
            );
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    if (
      this.nodeComponent &&
      initiator &&
      initiator.nodeType === NodeType.Connection
    ) {
      if (this.nodeComponent.startNode) {
        this.nodeComponent.startNode.update?.(
          this.nodeComponent.startNode,
          this.points.beginX,
          this.points.beginY,
          this.nodeComponent
        );
      }

      if (this.nodeComponent.endNode) {
        this.nodeComponent.endNode.update?.(
          this.nodeComponent.endNode,
          this.points.endX,
          this.points.endY,
          this.nodeComponent
        );
      }
    }

    if (this.nodeComponent && !this.nodeComponent.controlPoints) {
      this.nodeComponent.controlPoints = this.initializeControlPoints();
    }

    this.updateControlPoints();

    const { offsetX: startOffsetX, offsetY: startOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.start,
        this.nodeComponent?.startNodeThumb?.thumbType ??
          (this.nodeComponent?.isAnnotationConnection
            ? ThumbType.Center
            : ThumbType.None)
      );
    const { offsetX: endOffsetX, offsetY: endOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.end,
        this.nodeComponent?.endNodeThumb?.thumbType ??
          (this.nodeComponent?.isAnnotationConnection
            ? ThumbType.Center
            : ThumbType.None)
      );

    const bbox = this.getBBoxPath(
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );
    this.setPath(bbox, startOffsetX, startOffsetY, endOffsetX, endOffsetY);
    if (updateThumbs && this.nodeComponent) {
      this.nodeComponent.connectionStartNodeThumb?.update?.(
        this.nodeComponent.connectionStartNodeThumb,
        this.points.beginX + startOffsetX,
        this.points.beginY + startOffsetY,
        this.nodeComponent
      );

      this.nodeComponent.connectionEndNodeThumb?.update?.(
        this.nodeComponent.connectionEndNodeThumb,
        this.points.endX + endOffsetX,
        this.points.endY + endOffsetY,
        this.nodeComponent
      );

      this.nodeComponent.x = this.points.beginX;
      this.nodeComponent.y = this.points.beginY;
      this.nodeComponent.endX = this.points.endX;
      this.nodeComponent.endY = this.points.endY;
    }
    if (this.svgParent) {
      const svgParentElement = this.svgParent
        .domElement as unknown as HTMLElement;
      svgParentElement.style.width = `${bbox.width}px`;
      svgParentElement.style.height = `${bbox.height}px`;
      svgParentElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;
    }
    return true;
  };

  createArrowMarker() {
    if (!this.svgParent) {
      return;
    }
    const defs = createNSElement('defs', {}, this.svgParent.domElement);
    const marker = createNSElement(
      'marker',
      {
        id: 'arrow',
        refX: '1.5',
        refY: '2',
        markerUnits: 'strokeWidth',
        markerWidth: '4',
        markerHeight: '4',
        orient: 'auto',
      },
      defs.domElement
    );
    createNSElement(
      'path',
      {
        d: 'M0,0 V4 L2,2 Z',
        fill: 'white',
      },
      marker.domElement
    );

    const markerBegin = createNSElement(
      'marker',
      {
        id: 'arrowbegin',
        refX: '2',
        refY: '2',
        markerUnits: 'strokeWidth',
        markerWidth: '4',
        markerHeight: '4',
        orient: 'auto',
      },
      defs.domElement
    );
    createNSElement(
      'path',
      {
        d: 'M2,2 L2,2 L0,2 Z', // 'M2,0 L2,4 L0,2 Z',
        stroke: 'white',
        fill: 'white',
      },
      markerBegin.domElement
    );
  }

  protected initializeControlPoints(): { x: number; y: number }[] {
    return [];
  }

  protected setControlPoints(): { x: number; y: number }[] {
    return [];
  }

  protected updateControlPoints(): void {
    //
  }

  protected getPath(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bbox: { x: number; y: number; width: number; height: number },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetY: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetY: number
  ): string {
    return '';
  }

  protected setHiddenPath(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetY: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetY: number
  ): void {
    //
  }

  protected setPath(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bbox: { x: number; y: number; width: number; height: number },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetY: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetY: number
  ): void {
    //
  }
}
