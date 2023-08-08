export const getTValueOnQuadraticBezierCurveForPoint = (
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  x2: number,
  y2: number,
  px: number,
  py: number
) => {
  /*
	p = some point to project onto the curve
	d = some initially huge value
	i = 0
	for (coordinate, index) in LUT:
	q = distance(coordinate, p)
	if q < d:
		d = q
		i = index	
	*/
  return 0;
};

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

// circle and bezier curver both start at x1, y1
export const getIntersectionPointOfCircleAndQuadraticBezierCurve = (
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  x2: number,
  y2: number,
  r: number
) => {
  // calculate intersection point using c1x,c1y to x1,y1
  return {
    x: 0,
    y: 0,
  };
};
