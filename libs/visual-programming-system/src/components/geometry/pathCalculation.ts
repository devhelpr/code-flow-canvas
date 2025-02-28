import { Point } from './types/types';
import { isLargeArc } from './geometry';

export function createSVGWithArcPoints(
  cx: number,
  cy: number,
  radius: number,
  startPoint: Point,
  endPoint: Point,
  isOverlapping = false
): string {
  // Check if the start and end points lie on the circle
  const distanceFromCenter = (x: number, y: number) =>
    Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (
    Math.abs(distanceFromCenter(startPoint.x, startPoint.y) - radius) > 0.01 ||
    Math.abs(distanceFromCenter(endPoint.x, endPoint.y) - radius) > 0.01
  ) {
    throw new Error('Start or end point does not lie on the circle.');
  }

  // When overlapping, force large arc flag to 0
  const largeArcFlag = isOverlapping
    ? 0
    : isLargeArc(startPoint, endPoint, cx, cy)
    ? 1
    : 0;

  // Create the SVG path for the arc
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
}

export function findRectangleIntersections(
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  circleCenterX: number,
  circleCenterY: number,
  radius: number
): Point[] {
  const points: Point[] = [];
  if (rectWidth <= 0 || rectHeight <= 0) return [{ x: rectX, y: rectY }];
  // Check each edge of the rectangle
  const edges = [
    { x1: rectX, y1: rectY, x2: rectX + rectWidth, y2: rectY }, // top
    {
      x1: rectX + rectWidth,
      y1: rectY,
      x2: rectX + rectWidth,
      y2: rectY + rectHeight,
    }, // right
    {
      x1: rectX,
      y1: rectY + rectHeight,
      x2: rectX + rectWidth,
      y2: rectY + rectHeight,
    }, // bottom
    { x1: rectX, y1: rectY, x2: rectX, y2: rectY + rectHeight }, // left
  ];

  edges.forEach((edge) => {
    // For vertical lines
    if (edge.x1 === edge.x2) {
      const x = edge.x1;
      const a = 1;
      const b = -2 * circleCenterY;
      const c =
        circleCenterY * circleCenterY +
        (x - circleCenterX) * (x - circleCenterX) -
        radius * radius;
      const discriminant = b * b - 4 * a * c;

      if (discriminant >= 0) {
        const y1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const y2 = (-b - Math.sqrt(discriminant)) / (2 * a);

        if (y1 >= edge.y1 && y1 <= edge.y2) points.push({ x, y: y1 });
        if (y2 >= edge.y1 && y2 <= edge.y2 && y1 !== y2)
          points.push({ x, y: y2 });
      }
    }
    // For horizontal lines
    else if (edge.y1 === edge.y2) {
      const y = edge.y1;
      const a = 1;
      const b = -2 * circleCenterX;
      const c =
        circleCenterX * circleCenterX +
        (y - circleCenterY) * (y - circleCenterY) -
        radius * radius;
      const discriminant = b * b - 4 * a * c;

      if (discriminant >= 0) {
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);

        if (x1 >= edge.x1 && x1 <= edge.x2) points.push({ x: x1, y });
        if (x2 >= edge.x1 && x2 <= edge.x2 && x1 !== x2)
          points.push({ x: x2, y });
      }
    }
  });

  return points;
}
