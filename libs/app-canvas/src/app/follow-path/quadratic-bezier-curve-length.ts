export interface BezierCurverPoint {
  x: number;
  y: number;
}

export function quadraticBezierLength(
  p0: BezierCurverPoint,
  cp1: BezierCurverPoint,
  p: BezierCurverPoint,
  t = 1
) {
  if (t === 0) {
    return 0;
  }

  const interpolate = (
    p1: BezierCurverPoint,
    p2: BezierCurverPoint,
    t: number
  ) => {
    let pt = { x: (p2.x - p1.x) * t + p1.x, y: (p2.y - p1.y) * t + p1.y };
    return pt;
  };
  const getLineLength = (p1: BezierCurverPoint, p2: BezierCurverPoint) => {
    return Math.sqrt(
      (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y)
    );
  };

  // is flat/linear
  let l1 = getLineLength(p0, cp1) + getLineLength(cp1, p);
  let l2 = getLineLength(p0, p);
  if (l1 === l2) {
    let m1 = interpolate(p0, cp1, t);
    let m2 = interpolate(cp1, p, t);
    p = interpolate(m1, m2, t);
    let lengthL;
    lengthL = Math.sqrt(
      (p.x - p0.x) * (p.x - p0.x) + (p.y - p0.y) * (p.y - p0.y)
    );
    return lengthL;
  }

  let a, b, c, d, e, e1, d1, v1x, v1y;

  v1x = cp1.x * 2;
  v1y = cp1.y * 2;
  d = p0.x - v1x + p.x;
  d1 = p0.y - v1y + p.y;
  e = v1x - 2 * p0.x;
  e1 = v1y - 2 * p0.y;
  a = 4 * (d * d + d1 * d1);
  b = 4 * (d * e + d1 * e1);
  c = e * e + e1 * e1;

  const bt = b / (2 * a),
    ct = c / a,
    ut = t + bt,
    k = ct - bt ** 2;

  return (
    (Math.sqrt(a) / 2) *
    (ut * Math.sqrt(ut ** 2 + k) -
      bt * Math.sqrt(bt ** 2 + k) +
      k *
        Math.log((ut + Math.sqrt(ut ** 2 + k)) / (bt + Math.sqrt(bt ** 2 + k))))
  );
}
