import {
  ElementNodeMap,
  INodeComponent,
  NodeComponentRelationType,
} from '../interfaces/element';
import { createEffect, getVisbility } from '../reactivity';
import { createConnectionSVGElement } from './connection-svg-element';
import { createSVGElement } from './svg-element';

export const createCubicBezier = (
  connectionsSVGCanvas: INodeComponent,
  canvas: INodeComponent,
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
    connectionsSVGCanvas.domElement,
    elements,
    startX - 50,
    startY - 50,
    endX - 50,
    endY - 50,
    controlPoint1X - 50,
    controlPoint1Y - 50,
    controlPoint2X - 50,
    controlPoint2Y - 50
  );

  const svg0 = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    startX,
    startY,
    'begin'
  );

  const svg1 = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    endX,
    endY,
    'end'
  );
  const svg2 = createSVGElement(
    canvas.domElement,
    elements,
    '#00ff00',
    controlPoint1X,
    controlPoint1Y,
    'c1'
  );
  const svg3 = createSVGElement(
    canvas.domElement,
    elements,
    '#0000ff',
    controlPoint2X,
    controlPoint2Y,
    'c2'
  );

  svg0.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      //
      //console.log('update controllertarget', component, x, y);
      if (component.update) {
        component.update(component, x, y, actionComponent);
      }
    },
  });

  svg1.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      //
      //console.log('update controllertarget', component, x, y);
      if (component.update) {
        component.update(component, x, y, actionComponent);
      }
    },
  });

  svg1.components.push({
    component: connection,
    type: NodeComponentRelationType.connection,
    connectionStart: svg1,
    connectionEnd: svg2,
  });
  svg2.components.push(
    {
      component: connection,
      type: NodeComponentRelationType.connection,
      connectionStart: svg1,
      connectionEnd: svg2,
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
        //
        //console.log('update controllertarget', component, x, y);
        if (component.update) {
          component.update(component, x, y, actionComponent);
        }
      },
    }
  );

  connection.components.push({
    component: svg3,
    type: NodeComponentRelationType.controller,
    update: (component: INodeComponent, x: number, y: number) => {
      //
      console.log('update', component.id, x, y);
    },
  });
  svg3.components.push({
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
    (svg0.domElement as unknown as SVGElement).style.display = visibility
      ? 'block'
      : 'none';
    (svg1.domElement as unknown as SVGElement).style.display = visibility
      ? 'block'
      : 'none';
    (svg2.domElement as unknown as SVGElement).style.display = visibility
      ? 'block'
      : 'none';
    (svg3.domElement as unknown as SVGElement).style.display = visibility
      ? 'block'
      : 'none';
  });
};
