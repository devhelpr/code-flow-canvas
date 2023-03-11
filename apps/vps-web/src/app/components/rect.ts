/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  NodeComponentRelationType,
} from '../interfaces/element';
import { createEffect, getVisbility } from '../reactivity';
import { createRectPathSVGElement } from './rect-path-svg-element';
import { createSVGElement } from './svg-element';

export const createRect = (
  canvas: INodeComponent,
  pathHiddenElement: IElementNode,
  elements: ElementNodeMap,
  startX: number,
  startY: number,
  width: number,
  height: number
) => {
  const connection = createRectPathSVGElement(
    canvas.domElement,
    elements,
    startX,
    startY,
    width,
    height,
    pathHiddenElement
  );

  function setPosition(
    element: INodeComponent,
    x: number,
    y: number,
    followRelations = true
  ) {
    if (!followRelations) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;

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
            !componentRelation.update(
              componentRelation.component,
              x,
              y,
              element
            )
          ) {
            doPosition = false;
          }
        }
      } else if (
        componentRelation.type === NodeComponentRelationType.childComponent
      ) {
        //
      } else if (
        componentRelation.type === NodeComponentRelationType.connection
      ) {
        //
      }
    });

    if (doPosition) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;
    }
  }
  const startPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    startX,
    startY,
    'begin'
  );
  startPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  const rightTopPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ffff0080',
    startX + width,
    startY,
    'rightTop'
  );
  rightTopPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };
  const leftBottomElement = createSVGElement(
    canvas.domElement,
    elements,
    '#00ff00',
    startX,
    startY + height,
    'leftBottom'
  );
  leftBottomElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };
  const rightBottomElement = createSVGElement(
    canvas.domElement,
    elements,
    '#0000ff',
    startX + width,
    startY + height,
    'rightBottom'
  );
  rightBottomElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  startPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  rightTopPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  leftBottomElement.components.push({
    component: connection,
    type: NodeComponentRelationType.connection,
  });
  leftBottomElement.components.push(
    {
      component: connection,
      type: NodeComponentRelationType.connection,
    },
    {
      component: connection,
      type: NodeComponentRelationType.controllerTarget,
      update: (
        component: INodeComponent,
        x: number,
        y: number,
        actionComponent: INodeComponent
      ) => {
        if (component.update) {
          return component.update(component, x, y, actionComponent);
        }
        return true;
      },
    }
  );

  connection.components.push({
    component: connection,
    type: NodeComponentRelationType.self,
    update: (component: INodeComponent, x: number, y: number) => {
      return true;
    },
    commitUpdate: (component: INodeComponent, x: number, y: number) => {
      //
    },
    controllers: {
      start: startPointElement,
      rightTop: rightTopPointElement,
      leftBottom: leftBottomElement,
      rightBottom: rightBottomElement,
    },
  });
  rightBottomElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  createEffect(() => {
    const visibility = getVisbility();
    (startPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (rightTopPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (rightBottomElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (leftBottomElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
  });

  return {
    setStartPoint: (x: number, y: number) => {
      if (startPointElement.update) {
        startPointElement.update(startPointElement, x, y, startPointElement);
      }
    },
    setRightTopPoint: (x: number, y: number) => {
      if (rightTopPointElement.update) {
        rightTopPointElement.update(
          rightTopPointElement,
          x,
          y,
          rightTopPointElement
        );
      }
    },
    setLeftBottomPoint: (x: number, y: number) => {
      if (leftBottomElement.update) {
        leftBottomElement.update(leftBottomElement, x, y, leftBottomElement);
      }
    },
    setRightBottomPoint: (x: number, y: number) => {
      if (rightBottomElement.update) {
        rightBottomElement.update(rightBottomElement, x, y, rightBottomElement);
      }
    },
  };
};
