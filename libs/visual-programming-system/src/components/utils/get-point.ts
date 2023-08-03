export function getPoint(x: number, y: number) {
  const pt = new DOMPoint();
  pt.x = x;
  pt.y = y;

  return {
    x: pt.x,
    y: pt.y,
  };
}
