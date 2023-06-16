import { INodeComponent, NodeComponentRelationType } from '../../interfaces';

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

  let doPosition = true;
  element.components.forEach((componentRelation) => {
    if (
      componentRelation.type === NodeComponentRelationType.self ||
      componentRelation.type === NodeComponentRelationType.controller ||
      componentRelation.type === NodeComponentRelationType.controllerTarget
    ) {
      if (componentRelation.update) {
        if (
          !componentRelation.update(componentRelation.component, x, y, element)
        ) {
          doPosition = false;
        }
      }
    }
  });
}
