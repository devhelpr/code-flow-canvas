import { transformToCamera } from '../camera';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  CurveType,
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { ThumbType } from '../types';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown } from './events/pointer-events';
import { onCalculateControlPoints as onCalculateCubicBezierControlPoints } from './utils/calculate-control-points';

const thumbRadius = 10;
const thumbWidth = 100;
const thumbHeight = 100;

const thumbOffsetX = -thumbWidth / 2 + thumbRadius;
const thumbOffsetY = -thumbHeight / 2 + thumbRadius;

const thumbTransformX = thumbWidth / 2;
const thumbTransformY = thumbHeight / 2;

// TODO : make the "50" a constant or incoming parameter
function getPoint(x: number, y: number) {
  const pt = new DOMPoint();
  pt.x = x + thumbTransformX;
  pt.y = y + thumbTransformY;

  return {
    x: pt.x,
    y: pt.y,
  };
}

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

  pathPoints = {
    beginX: 0,
    beginY: 0,
    cx1: 0,
    cy1: 0,
    cx2: 0,
    cy2: 0,
    endX: 0,
    endY: 0,
  };

  onCalculateControlPoints = onCalculateCubicBezierControlPoints;
  pathElement: IElementNode<T> | undefined = undefined;
  svgParent: IElementNode<T> | undefined = undefined;
  canvasElement: DOMElementNode;
  interactionStateMachine: InteractionStateMachine<T>;

  pathHiddenElement: IElementNode<T> | null = null;
  isQuadratic = false;

  constructor(
    canvasElement: DOMElementNode,
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
    isQuadratic = false,
    isDashed = false,
    onCalculateControlPoints = onCalculateCubicBezierControlPoints,
    canvasUpdated?: () => void,
    id?: string
  ) {
    /*
    draw svg path based on bbox of the hidden path
      
      - add padding to the bbox x and y and width and height

      - subtract bbox x and y from the path points
      - set transform of svg to the bbox x and y
      - set the width and height of the svg to the bbox width and height   
  */
    this.onCalculateControlPoints = onCalculateControlPoints;
    this.isQuadratic = isQuadratic;
    this.pathHiddenElement = pathHiddenElement;
    this.canvasElement = canvasElement;
    this.interactionStateMachine = interactionStateMachine;

    // let interactionInfo: IPointerDownResult = {
    //   xOffsetWithinElementOnFirstClick: 0,
    //   yOffsetWithinElementOnFirstClick: 0,
    // };

    // let isClicking = false;
    // let isMoving = false;

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

    const begin = getPoint(this.points.beginX, this.points.beginY);
    const cPoint1 = getPoint(this.points.cx1, this.points.cy1);
    const cPoint2 = getPoint(this.points.cx2, this.points.cy2);
    const end = getPoint(this.points.endX, this.points.endY);

    this.pathPoints = {
      beginX: begin.x,
      beginY: begin.y,
      cx1: cPoint1.x,
      cy1: cPoint1.y,
      cx2: cPoint2.x,
      cy2: cPoint2.y,
      endX: end.x,
      endY: end.y,
    };

    this.svgParent = createNSElement(
      'svg',
      {
        width: 0,
        height: 0,
        class: 'absolute top-0 left-0 pointer-events-none',
      },
      canvasElement
    );
    (canvasElement as unknown as HTMLElement).prepend(
      this.svgParent.domElement
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

    this.nodeComponent.nodeType = 'connection';
    this.nodeComponent.onCalculateControlPoints = onCalculateControlPoints;
    this.nodeComponent.controlPointNodes = [];
    this.nodeComponent.delete = () => {
      if (this.svgParent) {
        this.svgParent.domElement.remove();
      }
    };

    if (isQuadratic) {
      this.nodeComponent.controlPoints = [
        { x: this.pathPoints.cx1, y: this.pathPoints.cy1 },
      ];
    } else {
      this.nodeComponent.controlPoints = [
        { x: this.pathPoints.cx1, y: this.pathPoints.cy1 },
        { x: this.pathPoints.cx2, y: this.pathPoints.cy2 },
      ];
    }
    const bbox = this.getBBoxPath();
    const svgParentElement = this.svgParent
      .domElement as unknown as HTMLElement;
    svgParentElement.style.width = `${bbox.width}px`;
    svgParentElement.style.height = `${bbox.height}px`;
    svgParentElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    const dashedStroke = isDashed
      ? {
          'stroke-dasharray': '10,10',
        }
      : undefined;

    this.pathElement = createNSElement(
      'path',
      {
        class: 'pointer-events-auto',
        d: isQuadratic
          ? `M${this.pathPoints.beginX - bbox.x} ${
              this.pathPoints.beginY - bbox.y
            } Q${this.pathPoints.cx1 - bbox.x} ${
              this.pathPoints.cy1 - bbox.y
            } ${this.pathPoints.endX - bbox.x} ${this.pathPoints.endY - bbox.y}`
          : `M${this.pathPoints.beginX - bbox.x} ${
              this.pathPoints.beginY - bbox.y
            } C${this.pathPoints.cx1 - bbox.x} ${
              this.pathPoints.cy1 - bbox.y
            } ${this.pathPoints.cx2 - bbox.x} ${this.pathPoints.cy2 - bbox.y} ${
              this.pathPoints.endX - bbox.x
            } ${this.pathPoints.endY - bbox.y}`,
        stroke: 'white',
        'marker-start': 'url(#arrowbegin)',
        'marker-end': 'url(#arrow)',
        'stroke-width': 3,
        ...dashedStroke,
        fill: 'transparent',
        pointerdown: this.onPointerDown,
      },
      this.nodeComponent.domElement
    );

    if (!this.pathElement) throw new Error('pathElement is undefined');

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

  getBBoxPath() {
    if (this.isQuadratic && this.pathHiddenElement) {
      (this.pathHiddenElement.domElement as any).setAttribute(
        'd',
        `M${this.pathPoints.beginX} ${this.pathPoints.beginY} Q${this.pathPoints.cx1} ${this.pathPoints.cy1} ${this.pathPoints.endX} ${this.pathPoints.endY}`
      );
    } else {
      (this.pathHiddenElement?.domElement as any).setAttribute(
        'd',
        `M${this.pathPoints.beginX} ${this.pathPoints.beginY} C${this.pathPoints.cx1} ${this.pathPoints.cy1} ${this.pathPoints.cx2} ${this.pathPoints.cy2}  ${this.pathPoints.endX} ${this.pathPoints.endY}`
      );
    }
    const bbox = (
      this.pathHiddenElement?.domElement as unknown as SVGPathElement
    ).getBBox();

    return {
      x: bbox.x - 10,
      y: bbox.y - 10,
      width: bbox.width + 20,
      height: bbox.height + 20,
    };
  }

  onPointerDown = (e: PointerEvent) => {
    if (this.nodeComponent?.isControlled) {
      return;
    }
    if (this.nodeComponent) {
      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      const bbox = this.getBBoxPath();

      const { x, y } = transformToCamera(e.clientX, e.clientY);
      const rectCamera = transformToCamera(elementRect.x, elementRect.y);

      const interactionInfoResult = pointerDown<T>(
        x - rectCamera.x - (this.pathPoints.beginX - bbox.x - 10),
        y - rectCamera.y - (this.pathPoints.beginY - bbox.y - 10),
        this.nodeComponent,
        this.canvasElement,
        this.interactionStateMachine
      );
      if (interactionInfoResult && this.svgParent) {
        // interactionInfo = interactionInfoResult;
        // isClicking = true;
        // isMoving = false;
        (this.canvasElement as unknown as HTMLElement | SVGElement).append(
          this.svgParent.domElement
        );

        (this.canvasElement as unknown as HTMLElement | SVGElement).append(
          this.nodeComponent.connectionStartNodeThumb?.domElement as Node
        );

        (this.canvasElement as unknown as HTMLElement | SVGElement).append(
          this.nodeComponent.connectionEndNodeThumb?.domElement as Node
        );

        if (this.nodeComponent.controlPointNodes) {
          if (this.isQuadratic) {
            (this.canvasElement as unknown as HTMLElement | SVGElement).append(
              this.nodeComponent.controlPointNodes[0].domElement as Node
            );
          } else {
            (this.canvasElement as unknown as HTMLElement | SVGElement).append(
              this.nodeComponent.controlPointNodes[0].domElement as Node
            );
            (this.canvasElement as unknown as HTMLElement | SVGElement).append(
              this.nodeComponent.controlPointNodes[1].domElement as Node
            );
          }
        }
      }
    }
  };

  onUpdate = (
    incomingComponent?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    const connection =
      incomingComponent as unknown as IConnectionNodeComponent<T>;
    if (
      !incomingComponent &&
      x === undefined &&
      y === undefined &&
      !actionComponent
    ) {
      // eslint-disable-next-line no-console
      // update all in this condition...
    }

    let skipChecks = false;
    let updateThumbs = false;

    if (
      !incomingComponent ||
      x === undefined ||
      y === undefined ||
      !actionComponent
    ) {
      // needed for updating without using parameters (...update() )
      if (this.nodeComponent?.startNode) {
        const start = this.onCalculateControlPoints(
          this.nodeComponent?.startNode,
          ControlAndEndPointNodeType.start,
          this.nodeComponent.startNodeThumb?.thumbType ??
            ThumbType.StartConnectorCenter,
          this.nodeComponent.startNodeThumb?.thumbIndex,
          this.nodeComponent.endNode,
          this.nodeComponent.startNodeThumb?.thumbOffsetY ?? 0,
          this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
          this.nodeComponent.endNodeThumb
        );

        this.points.beginX = start.x;
        this.points.beginY = start.y;
        this.points.cx1 = start.cx;
        this.points.cy1 = start.cy;
        skipChecks = true;
        updateThumbs = true;
      }

      if (this.nodeComponent?.endNode) {
        const end = this.onCalculateControlPoints(
          this.nodeComponent?.endNode,
          ControlAndEndPointNodeType.end,
          this.nodeComponent.endNodeThumb?.thumbType ??
            ThumbType.EndConnectorCenter,
          this.nodeComponent.endNodeThumb?.thumbIndex,
          this.nodeComponent.startNode,
          this.nodeComponent.endNodeThumb?.thumbOffsetY ?? 0,
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
        skipChecks = true;

        updateThumbs = true;
      }

      if (!updateThumbs) {
        return false;
      }
    }

    if (
      !skipChecks &&
      incomingComponent &&
      actionComponent &&
      x !== undefined &&
      y !== undefined &&
      incomingComponent.nodeType === 'connection' &&
      (actionComponent.nodeType === 'connection' ||
        actionComponent.nodeType === 'shape')
    ) {
      if (
        connection.startNode &&
        actionComponent.id === connection.startNode.id
      ) {
        const start = this.onCalculateControlPoints(
          actionComponent as unknown as IRectNodeComponent<T>,
          ControlAndEndPointNodeType.start,
          connection.startNodeThumb?.thumbType ??
            ThumbType.StartConnectorCenter,
          connection.startNodeThumb?.thumbIndex,
          connection.endNode,
          connection.startNodeThumb?.thumbOffsetY ?? 0,
          connection.startNodeThumb?.thumbControlPointDistance,
          connection.endNodeThumb
        );
        this.points.beginX = start.x;
        this.points.beginY = start.y;
        this.points.cx1 = start.cx;
        this.points.cy1 = start.cy;
      } else if (
        connection.endNode &&
        actionComponent.id === connection.endNode.id
      ) {
        const end = this.onCalculateControlPoints(
          actionComponent as unknown as IRectNodeComponent<T>,
          ControlAndEndPointNodeType.end,
          connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
          connection.endNodeThumb?.thumbIndex,
          connection.startNode,
          connection.endNodeThumb?.thumbOffsetY ?? 0,
          connection.endNodeThumb?.thumbControlPointDistance,
          connection.startNodeThumb
        );
        this.points.endX = end.x;
        this.points.endY = end.y;
        this.points.cx2 = end.cx;
        this.points.cy2 = end.cy;
      } else {
        const diffC1x = this.points.cx1 - this.points.beginX;
        const diffC1y = this.points.cy1 - this.points.beginY;
        const diffC2x = this.points.cx2 - this.points.beginX;
        const diffC2y = this.points.cy2 - this.points.beginY;
        const diffEndX = this.points.endX - this.points.beginX;
        const diffEndY = this.points.endY - this.points.beginY;

        this.points.beginX = x - thumbTransformX;
        this.points.beginY = y - thumbTransformY;

        this.points.cx1 = x - thumbTransformX + diffC1x;
        this.points.cy1 = y - thumbTransformY + diffC1y;
        this.points.cx2 = x - thumbTransformX + diffC2x;
        this.points.cy2 = y - thumbTransformY + diffC2y;
        this.points.endX = x - thumbTransformX + diffEndX;
        this.points.endY = y - thumbTransformY + diffEndY;
      }

      if (this.nodeComponent?.startNode) {
        // nodeComponent.startNode?.update?.(
        //   nodeComponent.startNode,
        //   points.beginX,
        //   points.beginY,
        //   actionComponent
        // );

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
        // nodeComponent.endNode?.update?.(
        //   nodeComponent.endNode,
        //   points.endX,
        //   points.endY,
        //   actionComponent
        // );
        const circle =
          this.nodeComponent.connectionEndNodeThumb?.getThumbCircleElement?.();
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          'pointer-events-auto'
        );
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          'pointer-events-none'
        );
      }
      if (this.nodeComponent?.controlPointNodes?.length) {
        this.nodeComponent.controlPointNodes[0].setVisibility?.(
          !(this.nodeComponent?.startNode || this.nodeComponent?.endNode)
        );
        this.nodeComponent.controlPointNodes[0].update?.(
          this.nodeComponent.controlPointNodes[0],
          this.points.cx1,
          this.points.cy1,
          actionComponent
        );
        if (!this.isQuadratic) {
          this.nodeComponent.controlPointNodes[1].setVisibility?.(
            !(this.nodeComponent?.startNode || this.nodeComponent?.endNode)
          );
          this.nodeComponent.controlPointNodes[1].update?.(
            this.nodeComponent.controlPointNodes[1],
            this.points.cx2,
            this.points.cy2,
            actionComponent
          );
        }
      }
    } else if (!skipChecks) {
      if (actionComponent && !actionComponent.connectionControllerType) {
        return false;
      }

      // Neem de x en y van de controller-thumb over...
      if (actionComponent && x !== undefined && y !== undefined) {
        if (actionComponent.connectionControllerType === 'c1') {
          this.points.cx1 = x;
          this.points.cy1 = y;
        } else if (actionComponent.connectionControllerType === 'c2') {
          this.points.cx2 = x;
          this.points.cy2 = y;
        } else if (actionComponent.connectionControllerType === 'end') {
          this.points.endX = x;
          this.points.endY = y;

          this.points.cx2 = this.points.endX - 150;
          this.points.cy2 = this.points.endY;
        } else if (actionComponent.connectionControllerType === 'begin') {
          this.points.beginX = x;
          this.points.beginY = y;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    const begin = getPoint(this.points.beginX, this.points.beginY);
    const cPoint1 = getPoint(this.points.cx1, this.points.cy1);
    const cPoint2 = getPoint(this.points.cx2, this.points.cy2);
    const end = getPoint(this.points.endX, this.points.endY);

    this.pathPoints = {
      beginX: begin.x,
      beginY: begin.y,
      cx1: cPoint1.x,
      cy1: cPoint1.y,
      cx2: cPoint2.x,
      cy2: cPoint2.y,
      endX: end.x,
      endY: end.y,
    };

    if (this.nodeComponent && !this.nodeComponent.controlPoints) {
      if (this.isQuadratic) {
        this.nodeComponent.controlPoints = [{ x: 0, y: 0 }];
      } else {
        this.nodeComponent.controlPoints = [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ];
      }
    }

    if (this.nodeComponent && this.nodeComponent.controlPoints) {
      if (this.isQuadratic) {
        if (this.nodeComponent.controlPoints.length === 1) {
          this.nodeComponent.controlPoints[0].x = this.points.cx1;
          this.nodeComponent.controlPoints[0].y = this.points.cy1;
        }
      } else if (this.nodeComponent.controlPoints.length === 2) {
        this.nodeComponent.controlPoints[0].x = this.points.cx1;
        this.nodeComponent.controlPoints[0].y = this.points.cy1;
        this.nodeComponent.controlPoints[1].x = this.points.cx2;
        this.nodeComponent.controlPoints[1].y = this.points.cy2;
      }
    }

    const bbox = this.getBBoxPath();
    if (this.isQuadratic) {
      (this.pathElement?.domElement as HTMLElement).setAttribute(
        'd',
        `M${this.pathPoints.beginX - bbox.x} ${
          this.pathPoints.beginY - bbox.y
        } Q${this.pathPoints.cx1 - bbox.x} ${this.pathPoints.cy1 - bbox.y}  ${
          this.pathPoints.endX - bbox.x
        } ${this.pathPoints.endY - bbox.y}`
      );
    } else {
      (this.pathElement?.domElement as HTMLElement).setAttribute(
        'd',
        `M${this.pathPoints.beginX - bbox.x} ${
          this.pathPoints.beginY - bbox.y
        } C${this.pathPoints.cx1 - bbox.x} ${this.pathPoints.cy1 - bbox.y} ${
          this.pathPoints.cx2 - bbox.x
        } ${this.pathPoints.cy2 - bbox.y}  ${this.pathPoints.endX - bbox.x} ${
          this.pathPoints.endY - bbox.y
        }`
      );
    }

    if (updateThumbs && this.nodeComponent) {
      this.nodeComponent.connectionStartNodeThumb?.update?.(
        this.nodeComponent.connectionStartNodeThumb,
        this.points.beginX,
        this.points.beginY,
        this.nodeComponent
      );

      this.nodeComponent.connectionEndNodeThumb?.update?.(
        this.nodeComponent.connectionEndNodeThumb,
        this.points.endX,
        this.points.endY,
        this.nodeComponent
      );

      if (this.nodeComponent?.controlPointNodes?.length) {
        this.nodeComponent.controlPointNodes?.[0].setVisibility?.(false);
        this.nodeComponent.controlPointNodes?.[0].update?.(
          this.nodeComponent.controlPointNodes?.[0],
          this.points.cx1,
          this.points.cy1,
          this.nodeComponent
        );
      }

      if (!this.isQuadratic) {
        if (this.nodeComponent?.controlPointNodes?.length) {
          this.nodeComponent.controlPointNodes?.[1].setVisibility?.(false);
        }
        this.nodeComponent.controlPointNodes?.[1].update?.(
          this.nodeComponent.controlPointNodes?.[1],
          this.points.cx1,
          this.points.cy1,
          this.nodeComponent
        );
      }
      this.nodeComponent.x = this.points.beginX;
      this.nodeComponent.y = this.points.beginY;
      this.nodeComponent.endX = this.points.endX;
      this.nodeComponent.endY = this.points.endY;

      //console.log('connection update', nodeComponent);
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
}
