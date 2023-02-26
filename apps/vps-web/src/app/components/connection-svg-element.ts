import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
//import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

/*
    new approach:
      create svg of 100% of its container absolute positioned
      set no viewbox
      use coordinates of elements directly
*/

export const createConnectionSVGElement = (
  canvasElement: DOMElementNode,
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
  const initialX = startX;
  const initialY = startY;

  function getPoint(x: number, y: number) {
    const pt = new DOMPoint(); // svg.createSVGPoint();
    pt.x = x + initialX + 50; //+ 50;
    pt.y = y + initialY + 50; //+ 60 + 45;

    return {
      x: pt.x,
      y: pt.y,
    };
  }

  const points = {
    beginX: startX,
    beginY: startY,
    cx1: controlPoint1X,
    cy1: controlPoint1Y,
    cx2: controlPoint2X,
    cy2: controlPoint2Y,
    endX: endX,
    endY: endY,
  };

  const begin = getPoint(points.beginX, points.beginY); // 0 60 + 60
  let beginX = begin.x;
  let beginY = begin.y;
  const cPoint1 = getPoint(points.cx1, points.cy1); // 0 60 + 60
  let cx1 = cPoint1.x;
  let cy1 = cPoint1.y;
  const cPoint2 = getPoint(points.cx2, points.cy2); // 0 60 + 60
  let cx2 = cPoint2.x;
  let cy2 = cPoint2.y;
  const end = getPoint(points.endX, points.endY); // 100 60
  let _endX = end.x;
  let _endY = end.y;

  // (nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
  //   nodeComponent.id;
  let nodeComponent: INodeComponent | undefined = undefined;
  nodeComponent = createSVGNodeComponent('g', {}, canvasElement);

  let pathElement: IElementNode | undefined = undefined;
  pathElement = createNSElement(
    'path',
    {
      class: 'cursor-pointer',
      d: `M${beginX} ${beginY} C${cx1} ${cy1} ${cx2} ${cy2} ${_endX} ${_endY}`,
      stroke: 'white',
      'stroke-width': 3,
      fill: 'transparent',
    },
    nodeComponent.domElement
  );
  elements.set(nodeComponent.id, nodeComponent);
  nodeComponent.elements.push(pathElement);

  nodeComponent.update = (
    incomingComponent: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    if (actionComponent.specifier === 'c1') {
      points.cx1 = x - incomingComponent.x;
      points.cy1 = y - incomingComponent.y;
    } else if (actionComponent.specifier === 'c2') {
      points.cx2 = x - incomingComponent.x;
      points.cy2 = y - incomingComponent.y;
    } else if (actionComponent.specifier === 'end') {
      points.endX = x - incomingComponent.x;
      points.endY = y - incomingComponent.y;
    } else if (actionComponent.specifier === 'begin') {
      points.beginX = x - incomingComponent.x;
      points.beginY = y - incomingComponent.y;
    }

    const begin = getPoint(points.beginX, points.beginY); // 0 60 + 60
    beginX = begin.x;
    beginY = begin.y;
    const cPoint1 = getPoint(points.cx1, points.cy1); // 0 60 + 60
    cx1 = cPoint1.x;
    cy1 = cPoint1.y;
    const cPoint2 = getPoint(points.cx2, points.cy2); // 0 60 + 60
    cx2 = cPoint2.x;
    cy2 = cPoint2.y;
    const end = getPoint(points.endX, points.endY); // 100 60
    _endX = end.x;
    _endY = end.y;
    (pathElement?.domElement as any).setAttribute(
      'd',
      `M${beginX} ${beginY} C${cx1} ${cy1} ${cx2} ${cy2}  ${_endX} ${_endY}`
    );
  };
  nodeComponent.x = initialX;
  nodeComponent.y = initialY;
  return nodeComponent;
};
