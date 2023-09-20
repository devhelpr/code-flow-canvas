import { transformCameraSpaceToWorldSpace } from '../camera';
import {
  paddingRect,
  thumbRadius,
  totalPaddingRect,
} from '../constants/measures';
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
import { setSelectNode } from '../reactivity';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown } from './events/pointer-events';
import {
  calculateQuadraticBezierLineIntersections,
  splitQuadraticBezierCurve,
} from './utils/bezier-math';
import {
  onCalculateControlPoints as onCalculateCubicBezierControlPoints,
  onGetConnectionToThumbOffset,
} from './utils/calculate-control-points';
import {
  Vector,
  intersectionCircleLine,
  normalizeVector,
  perpendicularVector,
} from './utils/vector-math';

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

  onCalculateControlPoints = onCalculateCubicBezierControlPoints;
  pathElement: IElementNode<T> | undefined = undefined;
  pathTransparentElement: IElementNode<T> | undefined = undefined;
  svgParent: IElementNode<T> | undefined = undefined;
  canvas: IElementNode<T> | undefined;
  canvasElement: DOMElementNode;
  interactionStateMachine: InteractionStateMachine<T>;

  pathHiddenElement: IElementNode<T> | null = null;
  isQuadratic = false;
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
    isQuadratic = false,
    isDashed = false,
    onCalculateControlPoints = onCalculateCubicBezierControlPoints,
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
    this.isQuadratic = isQuadratic;
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
        class: 'absolute top-0 left-0 pointer-events-none', //pointer-events-bounding-box',
      },
      this.canvasElement
    );
    (this.canvasElement as unknown as HTMLElement).prepend(
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

    this.nodeComponent.nodeType = NodeType.Connection;
    this.nodeComponent.onCalculateControlPoints = onCalculateControlPoints;
    this.nodeComponent.controlPointNodes = [];
    this.nodeComponent.containerNode = containerNode;
    this.nodeComponent.delete = () => {
      if (this.svgParent) {
        this.svgParent.domElement.remove();
      }
    };

    if (isQuadratic) {
      this.nodeComponent.controlPoints = [
        { x: this.points.cx1, y: this.points.cy1 },
      ];
    } else {
      this.nodeComponent.controlPoints = [
        { x: this.points.cx1, y: this.points.cy1 },
        { x: this.points.cx2, y: this.points.cy2 },
      ];
    }

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

    const path = isQuadratic
      ? `M${this.points.beginX - bbox.x + startOffsetX} ${
          this.points.beginY - bbox.y + startOffsetY
        } Q${this.points.cx1 - bbox.x} ${this.points.cy1 - bbox.y} ${
          this.points.endX - bbox.x + endOffsetX
        } ${this.points.endY - bbox.y + endOffsetY}`
      : `M${this.points.beginX - bbox.x + startOffsetX} ${
          this.points.beginY - bbox.y + startOffsetY
        } C${this.points.cx1 - bbox.x} ${this.points.cy1 - bbox.y} ${
          this.points.cx2 - bbox.x
        } ${this.points.cy2 - bbox.y} ${
          this.points.endX - bbox.x + endOffsetX
        } ${this.points.endY - bbox.y + endOffsetY}`;

    this.pathTransparentElement = createNSElement(
      'path',
      {
        class: 'pointer-events-auto cursor-pointer',
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
    if (this.isQuadratic && this.pathHiddenElement) {
      const x1 = this.points.beginX + startOffsetX;
      const y1 = this.points.beginY + startOffsetY;
      const cx = this.points.cx1;
      const cy = this.points.cy1;
      const x2 = this.points.endX + endOffsetX;
      const y2 = this.points.endY + endOffsetY;

      const path = this.getQuadraticBezierPath(
        { x: 0, y: 0 },
        startOffsetX,
        startOffsetY,
        x1,
        y1,
        cx,
        cy,
        x2,
        y2
      );

      (this.pathHiddenElement.domElement as HTMLElement).setAttribute(
        'd',
        path
      );
    } else {
      (this.pathHiddenElement?.domElement as HTMLElement).setAttribute(
        'd',
        `M${this.points.beginX + startOffsetX} ${
          this.points.beginY + startOffsetY
        } C${this.points.cx1} ${this.points.cy1} ${this.points.cx2} ${
          this.points.cy2
        }  ${this.points.endX + endOffsetX} ${this.points.endY + endOffsetY}`
      );
    }
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

  getQuadraticBezierPath = (
    bbox: { x: number; y: number },
    startOffsetX: number,
    startOffsetY: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    x2: number,
    y2: number
  ) => {
    const isCircleStart = this.nodeComponent?.startNode?.isCircle ?? false;
    const isCircleEnd = this.nodeComponent?.endNode?.isCircle ?? false;

    const perpendicularVectorFactor = 1000;
    const spacingAABB = 10;
    const circleSpacingFactor = 4;
    const circlePadding = 10;
    let t = 0;
    let intersections: Vector[] = [];
    if (isCircleStart) {
      const circleRadius =
        (this.nodeComponent?.startNode?.width ?? 100) / 2 + circlePadding;
      intersections = intersectionCircleLine(
        {
          center: { x: x1, y: y1 },
          radius: circleRadius, //thumbRadius * circleSpacingFactor,
        },
        { p1: { x: x1, y: y1 }, p2: { x: cx, y: cy } }
      );

      if (intersections.length > 0) {
        const xi = intersections[0].x;
        const yi = intersections[0].y;

        const normalVector = normalizeVector({ x: cx - x1, y: cy - y1 });
        const pVector = perpendicularVector(normalVector);
        const pi1x = xi - pVector.x * perpendicularVectorFactor;
        const pi1y = yi - pVector.y * perpendicularVectorFactor;
        const pi2x = xi + pVector.x * perpendicularVectorFactor;
        const pi2y = yi + pVector.y * perpendicularVectorFactor;

        const interseccionsStart = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: pi1x, y: pi1y },
          { x: pi2x, y: pi2y }
        );

        if (interseccionsStart[0]?.t !== undefined) {
          t = interseccionsStart[0]?.t;
        } else {
          console.log('interseccionsStart UNDEFINED');
        }
      }
    } else {
      if (this.nodeComponent?.startNode) {
        const xleft =
          this.nodeComponent.startNode.x - bbox.x + startOffsetX - spacingAABB;
        const yleft =
          this.nodeComponent.startNode.y - bbox.y + startOffsetY - spacingAABB;
        const width =
          (this.nodeComponent.startNode.width ?? 0) + spacingAABB * 2;
        const height =
          (this.nodeComponent.startNode.height ?? 0) + spacingAABB * 2;

        const AABBLeftIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft, y: yleft },
          { x: xleft, y: yleft + height }
        );

        const AABBTopIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft, y: yleft },
          { x: xleft + width, y: yleft }
        );

        const AABBRightIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft + width, y: yleft },
          { x: xleft + width, y: yleft + height }
        );

        const AABBBottomIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft, y: yleft + height },
          { x: xleft + width, y: yleft + height }
        );

        if (AABBLeftIntersect.length > 0) {
          t = AABBLeftIntersect[0]?.t;
        }
        if (AABBTopIntersect.length > 0) {
          t = AABBTopIntersect[0]?.t;
        }
        if (AABBRightIntersect.length > 0) {
          t = AABBRightIntersect[0]?.t;
        }
        if (AABBBottomIntersect.length > 0) {
          t = AABBBottomIntersect[0]?.t;
        }
      }
    }

    const split1 = splitQuadraticBezierCurve(x1, y1, cx, cy, x2, y2, t ?? 0);

    let tEnd = 1;
    if (isCircleEnd) {
      const circleRadius =
        (this.nodeComponent?.endNode?.width ?? 100) / 2 + circlePadding;

      intersections = intersectionCircleLine(
        {
          center: {
            x: x2,
            y: y2,
          },
          radius: circleRadius + 10, // thumbRadius * circleSpacingFactor + 20,
        },
        {
          p1: { x: x2, y: y2 },
          p2: { x: cx, y: cy },
        }
      );

      if (intersections.length > 0) {
        const xi = intersections[0].x;
        const yi = intersections[0].y;

        const normalVector = normalizeVector({ x: cx - x2, y: cy - y2 });
        const pVector = perpendicularVector(normalVector);
        const pi1x = xi - pVector.x * perpendicularVectorFactor;
        const pi1y = yi - pVector.y * perpendicularVectorFactor;
        const pi2x = xi + pVector.x * perpendicularVectorFactor;
        const pi2y = yi + pVector.y * perpendicularVectorFactor;

        const intersectionsEnd = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: pi1x, y: pi1y },
          { x: pi2x, y: pi2y },
          true
        );

        if (intersectionsEnd[0]?.t !== undefined) {
          tEnd = intersectionsEnd[0]?.t;
        } else {
          console.log(
            'interseccionsEnd UNDEFINED',
            intersectionsEnd,
            x1,
            y1,
            cx,
            cy,
            x2,
            y2,
            pi1x,
            pi1y,
            pi2x,
            pi2y
          );
        }
      }
    } else {
      // do 4x calculateQuadraticBezierLineIntersections for each of AABB sides
      // and take the point closest to the center point of AABB??
      // lets start with the first found...
      if (this.nodeComponent?.endNode) {
        const xleft =
          this.nodeComponent.endNode.x -
          bbox.x +
          startOffsetX -
          spacingAABB * 2;
        const yleft =
          this.nodeComponent.endNode.y -
          bbox.y +
          startOffsetY -
          spacingAABB * 2;
        const width = (this.nodeComponent.endNode.width ?? 0) + spacingAABB * 4;
        const height =
          (this.nodeComponent.endNode.height ?? 0) + spacingAABB * 4;
        console.log('AABB to end', width, height);
        const AABBLeftIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft, y: yleft },
          { x: xleft, y: yleft + height }
        );

        const AABBTopIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft, y: yleft },
          { x: xleft + width, y: yleft }
        );

        const AABBRightIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft + width, y: yleft },
          { x: xleft + width, y: yleft + height }
        );

        const AABBBottomIntersect = calculateQuadraticBezierLineIntersections(
          { x: x1, y: y1 },
          { x: cx, y: cy },
          { x: x2, y: y2 },
          { x: xleft, y: yleft + height },
          { x: xleft + width, y: yleft + height }
        );

        if (AABBLeftIntersect.length > 0) {
          tEnd = AABBLeftIntersect[0]?.t;
        }
        if (AABBTopIntersect.length > 0) {
          tEnd = AABBTopIntersect[0]?.t;
        }
        if (AABBRightIntersect.length > 0) {
          tEnd = AABBRightIntersect[0]?.t;
        }
        if (AABBBottomIntersect.length > 0) {
          tEnd = AABBBottomIntersect[0]?.t;
        }
      }
    }

    const curves = splitQuadraticBezierCurve(
      split1.curve2.x1,
      split1.curve2.y1,
      split1.curve2.c1x,
      split1.curve2.c1y,
      split1.curve2.x2,
      split1.curve2.y2,
      tEnd ?? 1
    );

    return `M${curves.curve1.x1} ${curves.curve1.y1} Q${curves.curve1.c1x} ${curves.curve1.c1y}  ${curves.curve1.x2} ${curves.curve1.y2}`;
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
          this.nodeComponent.startNodeThumb?.thumbType ?? ThumbType.None,
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
          this.nodeComponent.endNodeThumb?.thumbType ?? ThumbType.None,
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
            this.nodeComponent.startNodeThumb?.thumbType ?? ThumbType.None,
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
            ThumbType.StartConnectorCenter,
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
          connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
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
            this.nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
          );
        const { offsetX: endOffsetX, offsetY: endOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.end,
            this.nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
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
            this.nodeComponent.startNodeThumb?.thumbType ?? ThumbType.None,
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
            this.nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
          );
        const { offsetX: endOffsetX, offsetY: endOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.end,
            this.nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
          );
        if (
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
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.begin
        ) {
          this.points.beginX = x - startOffsetX;
          this.points.beginY = y - startOffsetY;

          if (!this.nodeComponent?.startNode) {
            this.points.cx1 = this.points.beginX + 150;
            this.points.cy1 = this.points.beginY;
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
    if (this.isQuadratic) {
      const x1 = this.points.beginX - bbox.x + startOffsetX;
      const y1 = this.points.beginY - bbox.y + startOffsetY;
      const cx = this.points.cx1 - bbox.x;
      const cy = this.points.cy1 - bbox.y;
      const x2 = this.points.endX - bbox.x + endOffsetX;
      const y2 = this.points.endY - bbox.y + endOffsetY;
      const path = this.getQuadraticBezierPath(
        bbox,
        startOffsetX,
        startOffsetY,
        x1,
        y1,
        cx,
        cy,
        x2,
        y2
      );

      (this.pathElement?.domElement as HTMLElement).setAttribute('d', path);
      (this.pathTransparentElement?.domElement as HTMLElement).setAttribute(
        'd',
        path
      );
    } else {
      const path = `M${this.points.beginX - bbox.x + startOffsetX} ${
        this.points.beginY - bbox.y + startOffsetY
      } C${this.points.cx1 - bbox.x} ${this.points.cy1 - bbox.y} ${
        this.points.cx2 - bbox.x
      } ${this.points.cy2 - bbox.y}  ${
        this.points.endX - bbox.x + endOffsetX
      } ${this.points.endY - bbox.y + endOffsetY}`;

      (this.pathElement?.domElement as HTMLElement).setAttribute('d', path);
      (this.pathTransparentElement?.domElement as HTMLElement).setAttribute(
        'd',
        path
      );
    }

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
}
