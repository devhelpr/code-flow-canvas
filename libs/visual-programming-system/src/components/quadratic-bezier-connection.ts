/* eslint-disable @typescript-eslint/no-unused-vars */
import { thumbHalfWidth, thumbHalfHeight } from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '../interfaces/element';
import {
  createEffect,
  getVisbility,
  getSelectedNode,
  setSelectNode,
} from '../reactivity';
import { ConnectionControllerType, NodeType, ThumbType } from '../types';
import { LineType } from '../types/line-type';
import { Connection } from './connection';
import { ThumbNode } from './thumb';
import {
  calculateQuadraticBezierLineIntersections,
  splitQuadraticBezierCurve,
} from './utils/bezier-math';
import { onQuadraticCalculateControlPoints } from './utils/calculate-quadratic-control-points';
import {
  Vector,
  intersectionCircleLine,
  normalizeVector,
  perpendicularVector,
} from './utils/vector-math';

export class QuadraticBezierConnection<T> extends Connection<T> {
  startPointElement: IThumbNodeComponent<T> | undefined;
  endPointElement: IThumbNodeComponent<T> | undefined;

  // protected override doSomeCalculation() {
  //   console.log(
  //     'doSomeCalculation QuadraticBezierConnection',
  //     this.points.beginX
  //   );
  // }

  // MOVE To connection
  // protected doSomeCalculation() {
  //   console.log(
  //     'doSomeCalculation in connection',
  //     this.points.beginX,
  //     this.points.beginY,
  //     this.points.endX,
  //     this.points.endY
  //   );
  // }
  // call in connector update this.doSomeCalculation();

  constructor(
    canvas: INodeComponent<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    pathHiddenElement: IElementNode<T>,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint1X: number,
    controlPoint1Y: number,
    isControlled = false,
    isDashed = false,
    canvasUpdated?: () => void,
    id?: string,
    containerNode?: IRectNodeComponent<T>
  ) {
    super(
      canvas,
      interactionStateMachine,
      elements,
      startX,
      startY,
      endX,
      endY,
      controlPoint1X,
      controlPoint1Y,
      0,
      0,
      pathHiddenElement,
      isDashed,
      onQuadraticCalculateControlPoints,
      canvasUpdated,
      id,
      containerNode
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }
    this.nodeComponent.lineType = LineType.BezierQuadratic;
    this.nodeComponent.isControlled = isControlled;
    this.nodeComponent.onClick = () => {
      if (!this.nodeComponent || this.nodeComponent?.isControlled) {
        return;
      }
      console.log('connection click', this.nodeComponent.id);
      setSelectNode({
        id: this.nodeComponent.id,
        containerNode: this.nodeComponent
          .containerNode as unknown as INodeComponent<unknown>,
      });
    };

    function setPosition(
      element: INodeComponent<T>,
      x: number,
      y: number,
      updateConnection = true
    ) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;

      if (!updateConnection) {
        return;
      }

      // update the connection of this thumb
      if (element.parent && element.parent.update) {
        element.parent.update(
          element.parent,
          x + thumbHalfWidth,
          y + thumbHalfHeight,
          element
        );
      }
    }
    const startPointNode = new ThumbNode<T>(
      canvas.domElement,
      canvas,
      interactionStateMachine,
      this.nodeComponent.elements,
      'start',
      ThumbType.Start,
      undefined,
      '#ff000080',
      startX,
      startY,
      ConnectionControllerType.begin,
      NodeType.ConnectionController,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false // disableInteraction
    );
    if (!startPointNode.nodeComponent) {
      throw new Error('startPointNode.nodeComponent is undefined');
    }
    startPointNode.nodeComponent.parent = this.nodeComponent;
    startPointNode.nodeComponent.isControlled = isControlled;
    startPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }
      if (this.nodeComponent?.startNode) {
        startPointNode.setDisableInteraction();
      }

      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };
    this.svgParent?.domElement.after(startPointNode.nodeComponent.domElement);

    const endPointNode = new ThumbNode<T>(
      canvas.domElement,
      canvas,
      interactionStateMachine,
      this.nodeComponent.elements,
      'end',
      ThumbType.End,
      undefined,
      '#ff000080',
      endX,
      endY,
      ConnectionControllerType.end,
      NodeType.ConnectionController,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );
    if (!endPointNode.nodeComponent) {
      throw new Error('endPointNode.nodeComponent is undefined');
    }
    endPointNode.nodeComponent.parent = this.nodeComponent;
    endPointNode.nodeComponent.isControlled = isControlled;
    endPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      if (this.nodeComponent?.endNode) {
        endPointNode.setDisableInteraction();
      }
      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };
    this.svgParent?.domElement.after(endPointNode.nodeComponent.domElement);

    this.nodeComponent.connectionStartNodeThumb = startPointNode.nodeComponent;
    this.nodeComponent.connectionEndNodeThumb = endPointNode.nodeComponent;

    createEffect(() => {
      const visibility = getVisbility(); //&& selectedNode && selectedNode === connection.id;
      if (!startPointNode.nodeComponent || !endPointNode.nodeComponent) {
        return;
      }
      (
        startPointNode.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
      (
        endPointNode.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
    });

    this.startPointElement = startPointNode.nodeComponent;
    this.endPointElement = endPointNode.nodeComponent;
  }

  getQuadraticBezierPath(
    bbox: { x: number; y: number },
    startOffsetX: number,
    startOffsetY: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    x2: number,
    y2: number
  ) {
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
  }

  protected override initializeControlPoints() {
    return [{ x: 0, y: 0 }];
  }

  protected override setControlPoints(): { x: number; y: number }[] {
    return [{ x: this.points.cx1, y: this.points.cy1 }];
  }

  protected override updateControlPoints(): void {
    if (
      this.nodeComponent &&
      this.nodeComponent.controlPoints &&
      this.nodeComponent.controlPoints.length === 1
    ) {
      this.nodeComponent.controlPoints[0].x = this.points.cx1;
      this.nodeComponent.controlPoints[0].y = this.points.cy1;
    }
  }

  protected override getPath(
    bbox: { x: number; y: number; width: number; height: number },
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): string {
    return `M${this.points.beginX - bbox.x + startOffsetX} ${
      this.points.beginY - bbox.y + startOffsetY
    } Q${this.points.cx1 - bbox.x} ${this.points.cy1 - bbox.y} ${
      this.points.endX - bbox.x + endOffsetX
    } ${this.points.endY - bbox.y + endOffsetY}`;
  }

  protected override setHiddenPath(
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): void {
    if (this.pathHiddenElement) {
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
    }
  }

  protected override setPath(
    bbox: { x: number; y: number; width: number; height: number },
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): void {
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
  }
}
