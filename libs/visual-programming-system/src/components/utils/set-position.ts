import { INodeComponent, IRectNodeComponent } from '../../interfaces';

export function setPosition<T>(
  element: INodeComponent<T>,
  x: number,
  y: number,
  followRelations = true,
  updatePosition = true
) {
  if (!followRelations) {
    if (updatePosition) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;
      element.x = x;
      element.y = y;
    }
    return;
  }

  if ((element as unknown as IRectNodeComponent<T>)?.parent?.update) {
    (element as unknown as IRectNodeComponent<T>)?.parent?.update?.(
      (element as unknown as IRectNodeComponent<T>)?.parent,
      x,
      y,
      element
    );
  }
}
