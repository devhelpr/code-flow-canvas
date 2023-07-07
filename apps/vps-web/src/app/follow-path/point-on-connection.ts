import {
  ControlAndEndPointNodeType,
  getPointOnCubicBezierCurve,
  getPointOnQuadraticBezierCurve,
  IConnectionNodeComponent,
  IRectNodeComponent,
  LineType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

export const getPointOnConnection = <T>(
  percentage: number,
  connection: IConnectionNodeComponent<T>,
  start: IRectNodeComponent<T>,
  end: IRectNodeComponent<T>
) => {
  const startHelper = connection.onCalculateControlPoints(
    start,
    ControlAndEndPointNodeType.start,
    connection.startNodeThumb?.thumbType ?? ThumbType.StartConnectorCenter,
    connection.startNodeThumb?.thumbIndex,
    end,
    connection.startNodeThumb?.thumbOffsetY ?? 0,
    connection.startNodeThumb?.thumbControlPointDistance,
    connection.endNodeThumb
  );

  const endHelper = connection.onCalculateControlPoints(
    end,
    ControlAndEndPointNodeType.end,
    connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
    connection.endNodeThumb?.thumbIndex,
    start,
    connection.endNodeThumb?.thumbOffsetY ?? 0,
    connection.endNodeThumb?.thumbControlPointDistance,
    connection.startNodeThumb
  );

  const tx = 40;
  const ty = 40;

  const bezierCurvePoints =
    connection.lineType === LineType.BezierCubic
      ? getPointOnCubicBezierCurve(
          Math.min(percentage, 1),
          { x: startHelper.x + tx, y: startHelper.y + ty },
          {
            x: startHelper.cx + tx,
            y: startHelper.cy + ty,
          },
          {
            x: endHelper.cx + tx,
            y: endHelper.cy + ty,
          },
          { x: endHelper.x + tx, y: endHelper.y + ty }
        )
      : getPointOnQuadraticBezierCurve(
          Math.min(percentage, 1),
          { x: startHelper.x + tx, y: startHelper.y + ty },
          {
            x: startHelper.cx + tx,
            y: startHelper.cy + ty,
          },
          { x: endHelper.x + tx, y: endHelper.y + ty }
        );

  return bezierCurvePoints;
};
