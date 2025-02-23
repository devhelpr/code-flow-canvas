import { Point, Node } from './types/types';

export function findCircleCenter(
  radius: number,
  p1: Point,
  p2: Point
): Point[] | false {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > 2 * radius) {
    return false;
  }

  const h = Math.sqrt(radius * radius - (d / 2) * (d / 2));
  const perpX = -dy / d;
  const perpY = dx / d;

  const center1: Point = { x: midX + h * perpX, y: midY + h * perpY };
  const center2: Point = { x: midX - h * perpX, y: midY - h * perpY };

  return [center1, center2];
}

export function isLargeArc(
  start: Point,
  end: Point,
  cx: number,
  cy: number
): boolean {
  const angle1 = Math.atan2(start.y - cy, start.x - cx);
  const angle2 = Math.atan2(end.y - cy, end.x - cx);
  const deltaAngle =
    ((angle2 - angle1 + 2 * Math.PI) % (2 * Math.PI)) * (180 / Math.PI);
  return deltaAngle > 180;
}

export function doRectanglesOverlap(rect1: Node, rect2: Node): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

export function formatAngle(rad: number): number {
  return ((rad * 180) / Math.PI + 360) % 360;
}

export function getPointAngle(
  point: Point,
  centerX: number,
  centerY: number
): number {
  return Math.atan2(point.y - centerY, point.x - centerX);
}

export function perpendicularDistance(
  px: number,
  py: number, // Punt waarvoor de afstand berekend wordt
  x1: number,
  y1: number, // Beginpunt van de lijn
  x2: number,
  y2: number // Eindpunt van de lijn
): number {
  // Verschillen in x en y tussen de twee lijnpunten
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Berekening volgens de formule
  const numerator = Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx * dx + dy * dy);

  return numerator / denominator;
}
