export const getPointerPos = (
  canvas: HTMLElement,
  rootElement: HTMLElement,
  event: MouseEvent
) => {
  const rect = canvas.getBoundingClientRect();
  const rootRect = rootElement.getBoundingClientRect();
  const rootX = rootRect.left;
  const rootY = rootRect.top;
  const x = event.clientX - rootX;
  const y = event.clientY - rootY;

  return {
    pointerXPos: x,
    pointerYPos: y,
    rootX,
    rootY,
    canvasX: rect.left,
    canvasY: rect.top,
    eventPageX: event.pageX,
    eventPageY: event.pageY,
    eventClientX: event.clientX,
    eventClientY: event.clientY,
  };
};
