export type BezierCurverPoint = {
  x: number;
  y: number;
};

export const getPointOnCubicBezierCurve = (
  t: number,
  start: BezierCurverPoint,
  controlPoint1: BezierCurverPoint,
  controlPoint2: BezierCurverPoint,
  end: BezierCurverPoint
) => {
  return {
    x:
      (1 - t) * (1 - t) * (1 - t) * start.x +
      3 * t * (1 - t) * (1 - t) * controlPoint1.x +
      3 * (1 - t) * t * t * controlPoint2.x +
      t * t * t * end.x,
    y:
      (1 - t) * (1 - t) * (1 - t) * start.y +
      3 * t * (1 - t) * (1 - t) * controlPoint1.y +
      3 * (1 - t) * t * t * controlPoint2.y +
      t * t * t * end.y,
  };
};

export const getPointOnQuadraticBezierCurve = (
  t: number,
  start: BezierCurverPoint,
  controlPoint: BezierCurverPoint,
  end: BezierCurverPoint
) => {
  return {
    x:
      (1 - t) * (1 - t) * start.x +
      2 * (1 - t) * t * controlPoint.x +
      t * t * end.x,
    y:
      (1 - t) * (1 - t) * start.y +
      2 * (1 - t) * t * controlPoint.y +
      t * t * end.y,
  };
};
