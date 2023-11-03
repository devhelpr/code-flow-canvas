import {
  ControlAndEndPointNodeType,
  getLinePoints,
  getPointOnCubicBezierCurve,
  getPointOnQuadraticBezierCurve,
  IConnectionNodeComponent,
  IRectNodeComponent,
  LineType,
  onGetConnectionToThumbOffset,
  paddingRect,
  ThumbType,
} from '@devhelpr/visual-programming-system';

export const getPointOnConnection = <T>(
  percentage: number,
  connection: IConnectionNodeComponent<T>,
  start: IRectNodeComponent<T>,
  end: IRectNodeComponent<T>
) => {
  const startNodeThumbType =
    connection.lineType === LineType.Straight
      ? ThumbType.Center
      : connection.startNodeThumb?.thumbType ?? ThumbType.None;
  const endNodeThumbType =
    connection.lineType === LineType.Straight
      ? ThumbType.Center
      : connection.endNodeThumb?.thumbType ?? ThumbType.None;

  const { offsetX: startOffsetX, offsetY: startOffsetY } =
    onGetConnectionToThumbOffset(
      ControlAndEndPointNodeType.start,
      startNodeThumbType
    );
  const { offsetX: endOffsetX, offsetY: endOffsetY } =
    onGetConnectionToThumbOffset(
      ControlAndEndPointNodeType.end,
      endNodeThumbType
    );
  const startHelper = connection.onCalculateControlPoints(
    start,
    ControlAndEndPointNodeType.start,
    startNodeThumbType,
    connection.startNodeThumb,
    connection.startNodeThumb?.thumbIndex,
    end,
    connection.startNodeThumb?.thumbControlPointDistance,
    connection.endNodeThumb
  );

  const endHelper = connection.onCalculateControlPoints(
    end,
    ControlAndEndPointNodeType.end,
    endNodeThumbType,
    connection.endNodeThumb,
    connection.endNodeThumb?.thumbIndex,
    start,
    connection.endNodeThumb?.thumbControlPointDistance,
    connection.startNodeThumb
  );

  const tx = -paddingRect;
  const ty = -paddingRect;

  const ratio = Math.min(percentage, 1);
  if (connection.isLoopBack) {
    if (connection.pathElement?.domElement) {
      const path = connection.pathElement?.domElement as SVGPathElement;
      const pathLength = path.getTotalLength();
      const point = path.getPointAtLength(pathLength * ratio);

      const loopBackXOffset = 20;
      return {
        x: point.x + endHelper.x + endOffsetX + tx - loopBackXOffset - 10,
        y:
          point.y +
          ty +
          (startHelper.y > endHelper.y
            ? endHelper.y + endOffsetY
            : startHelper.y + startOffsetY) -
          10,
      };
    }
  }
  if (connection.lineType === LineType.Straight) {
    const { xStart, yStart, xEnd, yEnd } = getLinePoints(
      connection,
      { x: paddingRect, y: paddingRect },
      startOffsetX,
      startOffsetY,
      startHelper.x + tx + startOffsetX,
      startHelper.y + ty + startOffsetY,
      endHelper.x + tx + endOffsetX,
      endHelper.y + ty + endOffsetY
    );

    const xHelper = xEnd - xStart;
    const yHelper = yEnd - yStart;

    return {
      x: xStart + xHelper * ratio,
      y: yStart + yHelper * ratio,
    };
  }
  const bezierCurvePoints =
    connection.lineType === LineType.BezierCubic
      ? getPointOnCubicBezierCurve(
          ratio,
          {
            x: startHelper.x + tx + startOffsetX,
            y: startHelper.y + ty + startOffsetY,
          },
          {
            x: startHelper.cx + tx,
            y: startHelper.cy + ty,
          },
          {
            x: endHelper.cx + tx,
            y: endHelper.cy + ty,
          },
          { x: endHelper.x + tx + endOffsetX, y: endHelper.y + ty + endOffsetY }
        )
      : getPointOnQuadraticBezierCurve(
          ratio,
          {
            x: startHelper.x + tx + startOffsetX,
            y: startHelper.y + ty + startOffsetY,
          },
          {
            x: startHelper.cx + tx,
            y: startHelper.cy + ty,
          },
          { x: endHelper.x + tx + endOffsetX, y: endHelper.y + ty + endOffsetY }
        );

  return bezierCurvePoints;
};
