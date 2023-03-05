/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  NodeComponentRelationType,
} from '../interfaces/element';
import { createEffect, getVisbility } from '../reactivity';
import { createConnectionSVGElement } from './connection-svg-element';
import { createSVGElement } from './svg-element';

export const createCubicBezier = (
  canvas: INodeComponent,
  pathHiddenElement: IElementNode,
  elements: ElementNodeMap,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  controlPoint1X: number,
  controlPoint1Y: number,
  controlPoint2X: number,
  controlPoint2Y: number
) => {
  const connection = createConnectionSVGElement(
    canvas.domElement,
    elements,
    startX - 50,
    startY - 50,
    endX - 50,
    endY - 50,
    controlPoint1X - 50,
    controlPoint1Y - 50,
    controlPoint2X - 50,
    controlPoint2Y - 50,
    pathHiddenElement
  );

  function setPosition(element: INodeComponent, x: number, y: number) {
    (
      element.domElement as unknown as HTMLElement | SVGElement
    ).style.transform = `translate(${x}px, ${y}px)`;

    element.components.forEach((componentRelation) => {
      if (
        componentRelation.type === NodeComponentRelationType.self ||
        componentRelation.type === NodeComponentRelationType.controller ||
        componentRelation.type === NodeComponentRelationType.controllerTarget
      ) {
        if (componentRelation.update) {
          componentRelation.update(componentRelation.component, x, y, element);
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
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
  };

  const endPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    endX,
    endY,
    'end'
  );
  endPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
  };
  const controlPoint1Element = createSVGElement(
    canvas.domElement,
    elements,
    '#00ff00',
    controlPoint1X,
    controlPoint1Y,
    'c1'
  );
  controlPoint1Element.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
  };
  const controlPoint2Element = createSVGElement(
    canvas.domElement,
    elements,
    '#0000ff',
    controlPoint2X,
    controlPoint2Y,
    'c2'
  );
  controlPoint2Element.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
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
        component.update(component, x, y, actionComponent);
      }
    },
  });

  endPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        component.update(component, x, y, actionComponent);
      }
    },
  });

  endPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.connection,
    connectionStart: endPointElement,
    connectionEnd: controlPoint1Element,
  });
  controlPoint1Element.components.push(
    {
      component: connection,
      type: NodeComponentRelationType.connection,
      connectionStart: endPointElement,
      connectionEnd: controlPoint1Element,
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
          component.update(component, x, y, actionComponent);
        }
      },
    }
  );

  connection.components.push({
    component: connection,
    type: NodeComponentRelationType.self,
    update: (component: INodeComponent, x: number, y: number) => {
      console.log('update connection', connection.update, component.id, x, y);
      //   (
      //     connection.domElement as unknown as HTMLElement | SVGElement
      //   ).style.transform = `translate(${x}px, ${y}px)`;
      // .. bovenstaand werkt niet goed omdat de positie verwerkt is in het path (d parameter)
      //   const xdiff = endPointElement.x - startPointElement.x;
      //   const ydiff = endPointElement.y - startPointElement.y;
      //   (
      //     startPointElement.domElement as unknown as HTMLElement | SVGElement
      //   ).style.transform = `translate(${x - 50}px, ${y - 50}px)`;

      //   (
      //     endPointElement.domElement as unknown as HTMLElement | SVGElement
      //   ).style.transform = `translate(${x - 50 + xdiff}px, ${y - 50 + ydiff}px)`;

      // call connection.update
    },
    commitUpdate: (component: INodeComponent, x: number, y: number) => {
      console.log('commitupdate connection', x, y);
      //   const xdiff = endPointElement.x - startPointElement.x;
      //   const ydiff = endPointElement.y - startPointElement.y;

      //   startPointElement.x = x - 50;
      //   startPointElement.y = y - 50;
      //   endPointElement.x = x - 50 + xdiff;
      //   endPointElement.y = y - 50 + ydiff;
    },
  });
  controlPoint2Element.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        component.update(component, x, y, actionComponent);
      }
    },
  });

  createEffect(() => {
    const visibility = getVisbility();
    (startPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (endPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (controlPoint1Element.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (controlPoint2Element.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
  });

  return {
    setStartPoint: (x: number, y: number) => {
      if (startPointElement.update) {
        startPointElement.update(startPointElement, x, y, startPointElement);
      }
    },
    setEndPoint: (x: number, y: number) => {
      if (endPointElement.update) {
        endPointElement.update(endPointElement, x, y, endPointElement);
      }
    },
    setControlPoint1: (x: number, y: number) => {
      if (controlPoint1Element.update) {
        controlPoint1Element.update(
          controlPoint1Element,
          x,
          y,
          controlPoint1Element
        );
      }
    },
    setControlPoint2: (x: number, y: number) => {
      if (controlPoint2Element.update) {
        controlPoint2Element.update(
          controlPoint1Element,
          x,
          y,
          controlPoint2Element
        );
      }
    },
  };
};
