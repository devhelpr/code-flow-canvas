const getCurveFirstHalf = (z: number, p1: number, p2: number, p3: number) => {
  return {
    p1: p1,
    p2: z * p2 - (z - 1) * p1,
    p3: z * z * p3 - 2 * z * (z - 1) * p2 + (z - 1) * (z - 1) * p1,
  };
};

const getCurveSecondHalf = (z: number, p1: number, p2: number, p3: number) => {
  return {
    p1: z * z * p3 - 2 * z * (z - 1) * p2 + (z - 1) * (z - 1) * p1,
    p2: z * p3 - (z - 1) * p2,
    p3: p3,
  };
};

export const splitQuadraticBezierCurve = (
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  x2: number,
  y2: number,
  t: number
) => {
  const curve1x = getCurveFirstHalf(t, x1, c1x, x2);
  const curve1y = getCurveFirstHalf(t, y1, c1y, y2);

  const curve2x = getCurveSecondHalf(t, x1, c1x, x2);
  const curve2y = getCurveSecondHalf(t, y1, c1y, y2);

  return {
    curve1: {
      x1: curve1x.p1,
      y1: curve1y.p1,
      c1x: curve1x.p2,
      c1y: curve1y.p2,
      x2: curve1x.p3,
      y2: curve1y.p3,
    },
    curve2: {
      x1: curve2x.p1,
      y1: curve2y.p1,
      c1x: curve2x.p2,
      c1y: curve2y.p2,
      x2: curve2x.p3,
      y2: curve2y.p3,
    },
  };
};

type Vector = {
  x: number;
  y: number;
};
type VectorWithT = {
  x: number;
  y: number;
  t: number;
};

const lerp = function (a: number, b: number, t: number) {
  return a + t * (b - a);
};

export function calculateQuadraticBezierLineIntersections(
  p1: Vector,
  p2: Vector,
  p3: Vector,
  a1: Vector,
  a2: Vector
) {
  const intersections: VectorWithT[] = [];

  // inverse line normal
  const normal = {
    x: a1.y - a2.y,
    y: a2.x - a1.x,
  };

  // Q-coefficients
  const c2 = {
    x: p1.x + p2.x * -2 + p3.x,
    y: p1.y + p2.y * -2 + p3.y,
  };

  const c1 = {
    x: p1.x * -2 + p2.x * 2,
    y: p1.y * -2 + p2.y * 2,
  };

  const c0 = {
    x: p1.x,
    y: p1.y,
  };

  // Transform to line
  const coefficient = a1.x * a2.y - a2.x * a1.y;
  const a = normal.x * c2.x + normal.y * c2.y;
  const b = (normal.x * c1.x + normal.y * c1.y) / a;
  const c = (normal.x * c0.x + normal.y * c0.y + coefficient) / a;

  // solve the roots
  const roots: number[] = [];
  const d = b * b - 4 * c;
  if (d > 0) {
    const e = Math.sqrt(d);
    roots.push((-b + e) / 2);
    roots.push((-b - e) / 2);
  } else if (d == 0) {
    roots.push(-b / 2);
  }

  const minX = Math.min(a1.x, a2.x);
  const minY = Math.min(a1.y, a2.y);
  const maxX = Math.max(a1.x, a2.x);
  const maxY = Math.max(a1.y, a2.y);

  // calc the solution points
  for (let i = 0; i < roots.length; i++) {
    const t = roots[i];
    if (t >= 0 && t <= 1) {
      // possible point -- pending bounds check
      const point = {
        x: lerp(lerp(p1.x, p2.x, t), lerp(p2.x, p3.x, t), t),
        y: lerp(lerp(p1.y, p2.y, t), lerp(p2.y, p3.y, t), t),
      };
      const x = point.x;
      const y = point.y;
      // bounds checks
      if (a1.x == a2.x && y >= minY && y <= maxY) {
        // vertical line
        intersections.push({ ...point, t });
      } else if (a1.y == a2.y && x >= minX && x <= maxX) {
        // horizontal line
        intersections.push({ ...point, t });
      } else if (x >= minX && y >= minY && x <= maxX && y <= maxY) {
        // line passed bounds check
        intersections.push({ ...point, t });
      } else {
        // if (isEnd) {
        //   console.log(
        //     'no intersection : Line out of bounds',
        //     t,
        //     i,
        //     roots.length,
        //     roots
        //   );
        // }
      }
    } else {
      // if (isEnd) {
      //   console.log(
      //     'no intersection : T out of bounds',
      //     t,
      //     i,
      //     roots.length,
      //     roots
      //   );
      // }
    }
  }
  return intersections;
}
