import {
  ControlAndEndPointNodeType,
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
  const { offsetX: startOffsetX, offsetY: startOffsetY } =
    onGetConnectionToThumbOffset(
      ControlAndEndPointNodeType.start,
      connection.startNodeThumb?.thumbType ?? ThumbType.None
    );
  const { offsetX: endOffsetX, offsetY: endOffsetY } =
    onGetConnectionToThumbOffset(
      ControlAndEndPointNodeType.end,
      connection.endNodeThumb?.thumbType ?? ThumbType.None
    );
  const startHelper = connection.onCalculateControlPoints(
    start,
    ControlAndEndPointNodeType.start,
    connection.startNodeThumb?.thumbType ?? ThumbType.StartConnectorCenter,
    connection.startNodeThumb,
    connection.startNodeThumb?.thumbIndex,
    end,
    connection.startNodeThumb?.thumbControlPointDistance,
    connection.endNodeThumb
  );

  const endHelper = connection.onCalculateControlPoints(
    end,
    ControlAndEndPointNodeType.end,
    connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
    connection.endNodeThumb,
    connection.endNodeThumb?.thumbIndex,
    start,
    connection.endNodeThumb?.thumbControlPointDistance,
    connection.startNodeThumb
  );

  const tx = -paddingRect;
  const ty = -paddingRect;

  const bezierCurvePoints =
    connection.lineType === LineType.BezierCubic
      ? getPointOnCubicBezierCurve(
          Math.min(percentage, 1),
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
          Math.min(percentage, 1),
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
