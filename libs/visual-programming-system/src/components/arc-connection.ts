/* eslint-disable @typescript-eslint/no-unused-vars */
import { thumbHalfWidth, thumbHalfHeight } from '../constants/measures';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ConnectionStartEndPositions,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '../interfaces/element';
import { Theme } from '../interfaces/theme';
import { createEffect, getVisbility, setSelectNode } from '../reactivity';
import { ConnectionControllerType, NodeType, ThumbType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { LineType } from '../types/line-type';
import { Connection } from './connection';
import {
  doRectanglesOverlap,
  findCircleCenter,
  getPointAngle,
  isLargeArc,
  perpendicularDistance,
} from './geometry/geometry';
import { findRectangleIntersections } from './geometry/pathCalculation';
import { ThumbConnectionController } from './thumb-connection-controller';
import { onQuadraticCalculateControlPoints } from './utils/calculate-quadratic-control-points';
import { pointOnRect } from './utils/intersect-line';
import { intersectionCircleLine } from './utils/vector-math';

export const MIN_RADIUS = 150;
export const CLOSE_DISTANCE_THRESHOLD = 0.75; // Multiplier for the smallest rectangle dimension

export class LineConnection<T extends BaseNodeInfo> extends Connection<T> {
  startPointElement: IThumbNodeComponent<T> | undefined;
  endPointElement: IThumbNodeComponent<T> | undefined;

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
    containerNode?: IRectNodeComponent<T>,
    theme?: Theme,
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void,
    rootElement?: HTMLElement
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
      containerNode,
      theme,
      setCanvasAction,
      rootElement
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }
    this.nodeComponent.lineType = LineType.Straight;
    this.nodeComponent.isControlled = isControlled;
    this.nodeComponent.onClick = () => {
      if (!this.nodeComponent || this.nodeComponent?.isControlled) {
        return;
      }
      console.log('connection click', this.nodeComponent.id);
      if (this.nodeComponent.containerNode) {
        setSelectNode({
          id: this.nodeComponent.id,
          containerNode: this.nodeComponent
            .containerNode as unknown as IRectNodeComponent<BaseNodeInfo>,
        });
      }
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
    const startPointNode = new ThumbConnectionController<T>(
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
      false, // disableInteraction
      undefined,
      undefined,
      undefined,
      undefined,
      rootElement,
      this
    );
    if (!startPointNode.nodeComponent) {
      throw new Error('startPointNode.nodeComponent is undefined');
    }

    if (
      this.nodeComponent?.startNode &&
      this.nodeComponent?.startNode?.isThumb
    ) {
      startPointNode.setDisableInteraction();
    } else {
      startPointNode.setEnableInteraction();
    }

    startPointNode.nodeComponent.parent = this.nodeComponent;
    startPointNode.nodeComponent.isControlled = isControlled;
    startPointNode.connectConnection();
    startPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      // if (
      //   this.nodeComponent?.startNode &&
      //   this.nodeComponent?.startNode?.isThumb
      // ) {
      //   startPointNode.setDisableInteraction();
      // } else {
      //   startPointNode.setEnableInteraction();
      // }

      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };
    this.svgParent?.domElement.after(startPointNode.nodeComponent.domElement);

    const endPointNode = new ThumbConnectionController<T>(
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
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      rootElement,
      this
    );
    if (!endPointNode.nodeComponent) {
      throw new Error('endPointNode.nodeComponent is undefined');
    }
    if (this.nodeComponent?.endNode && this.nodeComponent?.endNode?.isThumb) {
      endPointNode.setDisableInteraction();
    } else {
      endPointNode.setEnableInteraction();
    }

    endPointNode.nodeComponent.parent = this.nodeComponent;
    endPointNode.nodeComponent.isControlled = isControlled;
    endPointNode.connectConnection();
    endPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      // if (this.nodeComponent?.endNode && this.nodeComponent?.endNode?.isThumb) {
      //   endPointNode.setDisableInteraction();
      // } else {
      //   endPointNode.setEnableInteraction();
      // }

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

  getLinePath(
    bbox: { x: number; y: number },
    startOffsetX: number,
    startOffsetY: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const { xStart, yStart, xEnd, yEnd } = getLinePoints(
      this.nodeComponent!,
      bbox,
      startOffsetX,
      startOffsetY,
      x1,
      y1,
      x2,
      y2
    );
    return `M${xStart} ${yStart} ${xEnd} ${yEnd}`;
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
    } ${this.points.endX - bbox.x + endOffsetX} ${
      this.points.endY - bbox.y + endOffsetY
    }`;
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
      const x2 = this.points.endX + endOffsetX;
      const y2 = this.points.endY + endOffsetY;

      // const path = this.getLinePath(
      //   { x: 0, y: 0 },
      //   startOffsetX,
      //   startOffsetY,
      //   x1,
      //   y1,
      //   x2,
      //   y2
      // );

      const pathInfo = this.getArc(
        { x: 0, y: 0 },
        startOffsetX,
        startOffsetY,
        1,
        1,
        x1,
        y1,
        x2,
        y2
      );

      (this.pathHiddenElement.domElement as HTMLElement).setAttribute(
        'd',
        pathInfo.path
      );
    }
  }

  protected override setPath(
    bbox: { x: number; y: number; width: number; height: number },
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): ConnectionStartEndPositions {
    const x1 = this.points.beginX - bbox.x + startOffsetX;
    const y1 = this.points.beginY - bbox.y + startOffsetY;
    const x2 = this.points.endX - bbox.x + endOffsetX;
    const y2 = this.points.endY - bbox.y + endOffsetY;
    // const path = this.getLinePath(
    //   bbox,
    //   startOffsetX,
    //   startOffsetY,
    //   x1,
    //   y1,
    //   x2,
    //   y2
    // );
    const pathInfo = this.getArc(
      bbox,
      startOffsetX,
      startOffsetY,
      1,
      1,
      x1,
      y1,
      x2,
      y2
    );

    (this.pathElement?.domElement as HTMLElement).setAttribute(
      'd',
      pathInfo.path
    );
    (this.pathTransparentElement?.domElement as HTMLElement).setAttribute(
      'd',
      pathInfo.path
    );
    return {
      startX: pathInfo.startX,
      startY: pathInfo.startY,
      endX: pathInfo.endX,
      endY: pathInfo.endY,
    };
  }

  protected getArc(
    bbox: { x: number; y: number },
    startOffsetX: number,
    startOffsetY: number,
    factor = 1,
    factor2 = 1,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const spacingAABB = 10;

    const startNode = this.nodeComponent?.startNode;
    const endNode = this.nodeComponent?.endNode;
    const halfStartWidth = startNode?.width
      ? startNode.width / 2 + spacingAABB
      : 0;
    const halfStartHeight = startNode?.height
      ? startNode.height / 2 + spacingAABB
      : 0;
    const halfEndWidth = endNode?.width ? endNode.width / 2 + spacingAABB : 0;
    const halfEndHeight = endNode?.height
      ? endNode.height / 2 + spacingAABB
      : 0;

    const startX = startNode
      ? (startNode?.x ?? 0) - bbox.x + startOffsetX - spacingAABB
      : x1;
    const startY = startNode
      ? (startNode?.y ?? 0) - bbox.y + startOffsetY - spacingAABB
      : y1;
    const endX = endNode
      ? (endNode?.x ?? 0) - bbox.x + startOffsetX - spacingAABB
      : x2;
    const endY = endNode
      ? (endNode?.y ?? 0) - bbox.y + startOffsetY - spacingAABB
      : y2;

    const startWidth = startNode?.width
      ? startNode?.width + spacingAABB * 2
      : 0;
    const startHeight = startNode?.height
      ? startNode?.height + spacingAABB * 2
      : 0;
    const endWidth = endNode?.width ? endNode?.width + spacingAABB * 2 : 0;
    const endHeight = endNode?.height ? endNode?.height + spacingAABB * 2 : 0;

    const start = {
      x: startX + halfStartWidth,
      y: startY + halfStartHeight,
    };

    const end = {
      x: endX + halfEndWidth,
      y: endY + halfEndHeight,
    };

    // Check if rectangles are overlapping or very close
    const minDimension = Math.min(startWidth, startHeight, endWidth, endHeight);
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    const isClose = distance < minDimension * CLOSE_DISTANCE_THRESHOLD;

    // Calculate circle properties
    let centerX = (start.x + end.x) / 2;
    let centerY = (start.y + end.y) / 2;
    const radius = isClose ? MIN_RADIUS : (factor * factor2 * distance) / 2;

    const centers = findCircleCenter(radius, start, end);
    if (centers) {
      centerX = centers[0].x;
      centerY = centers[0].y;
    }

    // Find intersection points
    const intersections1 = findRectangleIntersections(
      startX,
      startY,
      startWidth,
      startHeight,
      centerX,
      centerY,
      radius
    );

    const intersections2 = findRectangleIntersections(
      endX,
      endY,
      endWidth,
      endHeight,
      centerX,
      centerY,
      radius
    );

    // Sort intersection points by angle
    const sortedIntersections1 = [...intersections1].sort(
      (a, b) =>
        getPointAngle(a, centerX, centerY) - getPointAngle(b, centerX, centerY)
    );
    const sortedIntersections2 = [...intersections2].sort(
      (a, b) =>
        getPointAngle(a, centerX, centerY) - getPointAngle(b, centerX, centerY)
    );

    // Calculate center to end angle
    const centerToEndAngle = Math.atan2(end.y - centerY, end.x - centerX);

    // Find best intersection points
    let bestIntersection1 = sortedIntersections1[0];
    let bestAngle1 = getPointAngle(bestIntersection1, centerX, centerY);
    for (const point of sortedIntersections1) {
      const angle = getPointAngle(point, centerX, centerY);
      let angleDiff = centerToEndAngle - angle;
      if (angleDiff < 0) angleDiff += 2 * Math.PI;
      if (angleDiff < Math.PI && angle > bestAngle1) {
        bestAngle1 = angle;
        bestIntersection1 = point;
      }
    }

    const isFirstPointOnBottom =
      Math.abs(bestIntersection1.y - (startY + startHeight)) < 0.1;

    const validIntersections2 = isFirstPointOnBottom
      ? sortedIntersections2.filter((point) => Math.abs(point.y - endY) > 0.1)
      : sortedIntersections2;

    let bestIntersection2 = validIntersections2?.[0] ?? bestIntersection1;
    let bestAngle2 = getPointAngle(bestIntersection2, centerX, centerY);
    for (const point of validIntersections2) {
      const angle = getPointAngle(point, centerX, centerY);
      let angleDiff = angle - centerToEndAngle;
      if (angleDiff < 0) angleDiff += 2 * Math.PI;
      if (angleDiff < Math.PI && angle < bestAngle2) {
        bestAngle2 = angle;
        bestIntersection2 = point;
      }
    }

    if (bestIntersection1 && bestIntersection2) {
      const isOverlapping = doRectanglesOverlap(
        {
          x: startX,
          y: startY,
          width: startWidth,
          height: startHeight,
          element: startNode?.domElement as SVGRectElement,
        },
        {
          x: endX,
          y: endY,
          width: endWidth,
          height: endHeight,
          element: endNode?.domElement as SVGRectElement,
        }
      );

      // Calculate angles and determine sweep flag
      const angle1 = getPointAngle(bestIntersection1, centerX, centerY);
      const angle2 = getPointAngle(bestIntersection2, centerX, centerY);
      let angleDiff = angle2 - angle1;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

      // Calculate if points are on opposite sides
      const isOpposite = Math.abs(Math.abs(angleDiff) - Math.PI) < 0.01;

      // Calculate control point position on the actual arc path
      const midAngle = angle1 + angleDiff / 2;
      const controlX = centerX + radius * Math.cos(midAngle);
      const controlY = centerY + radius * Math.sin(midAngle);
      //canvas.updateControlPoint(controlX, controlY);

      const distance = perpendicularDistance(
        controlX,
        controlY,
        start.x,
        start.y,
        end.x,
        end.y
      );

      // When the path is nearly flat (very large radius), use a straight line
      // that goes from the edge to the center of the target rectangle
      if (distance < 0.01) {
        //(radius > 1000) {
        // threshold for "flat" path
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // Calculate intersection with source rectangle's edge
        const sourceWidth = startWidth;
        const sourceHeight = startHeight;
        const startX = start.x + (sourceWidth / 2) * unitX;
        const startY = start.y + (sourceHeight / 2) * unitY;

        // Calculate intersection with target rectangle's edge
        const targetWidth = endWidth;
        const targetHeight = endHeight;
        const endX = end.x - (targetWidth / 2) * unitX;
        const endY = end.y - (targetHeight / 2) * unitY;

        // Create path from edge to edge
        // const controlX = (startX + endX) / 2;
        // const controlY = (startY + endY) / 2;
        //canvas.updateControlPoint(controlX, controlY);
        return {
          path: `M ${startX} ${startY} L ${endX} ${endY}`,
          startX: startX,
          startY: startY,
          endX: endX,
          endY: endY,
        };
        //canvas.updateTestArcPath(d);
      } else {
        //canvas.updateControlPoint(controlX, controlY);
        // Use the regular arc path for curved paths
        const d = `M ${bestIntersection1.x} ${
          bestIntersection1.y
        } A ${radius} ${radius} 0 ${
          isLargeArc(bestIntersection1, bestIntersection2, centerX, centerY)
            ? 1
            : 0
        } ${angleDiff > 0 ? 1 : 0} ${bestIntersection2.x} ${
          bestIntersection2.y
        }`;
        //canvas.updateTestArcPath(d);
        return {
          path: d,
          startX: bestIntersection1.x,
          startY: bestIntersection1.y,
          endX: bestIntersection2.x,
          endY: bestIntersection2.y,
        };
      }

      // const finalSweepFlag = isOverlapping ? 1 : angleDiff > 0 ? 1 : 0;
      // const finalLargeArcFlag = isOverlapping
      //   ? 0
      //   : radius < 150
      //   ? 0 // Force small arc for small radii
      //   : isLargeArc(bestIntersection1, bestIntersection2, centerX, centerY)
      //   ? 1
      //   : 0;
    } else {
      //canvas.updateTestArcPath('');
      return { path: '', startX: 0, startY: 0, endX: 0, endY: 0 };
    }

    //canvas.updateIntersectionPoints([...intersections1, ...intersections2]);
  }
}

export const getLinePoints = <T extends BaseNodeInfo>(
  nodeComponent: IConnectionNodeComponent<T>,
  bbox: { x: number; y: number },
  startOffsetX: number,
  startOffsetY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const isCircleStart = nodeComponent?.startNode?.isCircle ?? false;
  const isCircleEnd = nodeComponent?.endNode?.isCircle ?? false;

  const spacingAABB = 10;
  const circlePadding = 10;

  let newX1 = x1;
  let newY1 = y1;
  let newX2 = x2;
  let newY2 = y2;

  if (isCircleStart) {
    const circleRadius =
      (nodeComponent?.startNode?.width ?? 100) / 2 + circlePadding;
    const intersection = intersectionCircleLine(
      {
        center: { x: x1, y: y1 },
        radius: circleRadius,
      },
      { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } }
    );
    if (intersection.length > 0) {
      newX1 = intersection[0].x;
      newY1 = intersection[0].y;
    }
  } else if (nodeComponent?.startNode) {
    let xleft = 0;
    let yleft = 0;
    let width = 0;
    let height = 0;
    if (
      !nodeComponent?.startNode?.isThumb &&
      nodeComponent.startNodeThumb?.thumbType === ThumbType.StartConnectorCenter
    ) {
      // Temp solution for connecting to right side of thumb when end node has a thumb of
      // type StartConnectorCenter
      xleft =
        nodeComponent.startNode.x -
        bbox.x +
        //startOffsetX +
        (nodeComponent.startNode.width ?? 0) -
        4; //+
      //spacingAABB;
      //16;
      yleft =
        nodeComponent.startNode.y -
        bbox.y -
        10 +
        (nodeComponent.startNode.height ?? 0) / 2;
      width = 24;
      height = 24;
    } else {
      xleft = nodeComponent.startNode.x - bbox.x + startOffsetX - spacingAABB;
      yleft = nodeComponent.startNode.y - bbox.y + startOffsetY - spacingAABB;
      width = (nodeComponent.startNode.width ?? 0) + spacingAABB * 2;
      height = (nodeComponent.startNode.height ?? 0) + spacingAABB * 2;
    }
    const start = pointOnRect(
      x2,
      y2,
      xleft,
      yleft,
      xleft + width,
      yleft + height,
      false
    );
    if (start) {
      newX1 = start.x;
      newY1 = start.y;
    }
  }

  if (isCircleEnd) {
    const circleRadius =
      (nodeComponent?.endNode?.width ?? 100) / 2 + circlePadding;
    const intersection = intersectionCircleLine(
      {
        center: { x: x2, y: y2 },
        radius: circleRadius,
      },
      { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } }
    );
    if (intersection.length > 0) {
      newX2 = intersection[0].x;
      newY2 = intersection[0].y;
    }
  } else {
    if (nodeComponent?.endNode) {
      let xleft = 0;
      let yleft = 0;
      let width = 0;
      let height = 0;
      if (
        !nodeComponent?.endNode?.isThumb &&
        nodeComponent.endNodeThumb?.thumbType === ThumbType.EndConnectorCenter
      ) {
        // Temp solution for connecting to left side of thumb when end node has a thumb of
        // type EndConnectorCenter
        xleft =
          nodeComponent.endNode.x - bbox.x + startOffsetX - spacingAABB - 16;
        yleft =
          nodeComponent.endNode.y -
          bbox.y -
          10 +
          (nodeComponent.endNode.height ?? 0) / 2;
        width = 24;
        height = 24;
      } else {
        xleft = nodeComponent.endNode.x - bbox.x + startOffsetX - spacingAABB;
        yleft = nodeComponent.endNode.y - bbox.y + startOffsetY - spacingAABB;
        width = (nodeComponent.endNode.width ?? 0) + spacingAABB * 2;
        height = (nodeComponent.endNode.height ?? 0) + spacingAABB * 2;
      }

      const end = pointOnRect(
        x1,
        y1,
        xleft,
        yleft,
        xleft + width,
        yleft + height,
        false
      );
      if (end) {
        newX2 = end.x;
        newY2 = end.y;
      }
    }
  }

  return {
    xStart: newX1,
    yStart: newY1,
    xEnd: newX2,
    yEnd: newY2,
  };
};
