export type Vector = {
  x: number;
  y: number;
};
export type Line = {
  p1: Vector;
  p2: Vector;
};
export type Circle = {
  center: Vector;
  radius: number;
};
export function intersectionCircleLine(circle: Circle, line: Line) {
  const v1: Vector = { x: 0, y: 0 };
  const v2: Vector = { x: 0, y: 0 };
  v1.x = line.p2.x - line.p1.x;
  v1.y = line.p2.y - line.p1.y;
  v2.x = line.p1.x - circle.center.x;
  v2.y = line.p1.y - circle.center.y;
  let b = v1.x * v2.x + v1.y * v2.y;
  const c = 2 * (v1.x * v1.x + v1.y * v1.y);
  b *= -2;
  const d = Math.sqrt(
    b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius)
  );
  if (isNaN(d)) {
    // no intercept
    return [];
  }
  const u1 = (b - d) / c; // these represent the unit distance of point one and two on the line
  const u2 = (b + d) / c;
  const retP1 = { x: 0, y: 0 };
  const retP2 = { x: 0, y: 0 };
  const ret: Vector[] = []; // return array
  if (u1 <= 1 && u1 >= 0) {
    // add point if on the line segment
    retP1.x = line.p1.x + v1.x * u1;
    retP1.y = line.p1.y + v1.y * u1;
    ret[0] = retP1;
  }
  if (u2 <= 1 && u2 >= 0) {
    // second add point if on the line segment
    retP2.x = line.p1.x + v1.x * u2;
    retP2.y = line.p1.y + v1.y * u2;
    ret[ret.length] = retP2;
  }
  return ret;
}

export const normalizeVector = (vector: Vector) => {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return { x: vector.x / length, y: vector.y / length };
};

export const perpendicularVector = (vector: Vector) => {
  return { x: -vector.y, y: vector.x };
};
