import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

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
  controlPoint2Y: number,
  pathHiddenElement: IElementNode
) => {
  /*
    draw svg path based on bbox of the hidden path
      
      - add padding to the bbox x and y and width and height

      - subtract bbox x and y from the path points
      - set transform of svg to the bbox x and y
      - set the width and height of the svg to the bbox width and height
       
  */

  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };

  const initialX = startX;
  const initialY = startY;

  function getPoint(x: number, y: number) {
    const pt = new DOMPoint();
    pt.x = x + initialX + 50;
    pt.y = y + initialY + 50;

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
  const cPoint1 = getPoint(points.cx1, points.cy1); // 0 60 + 60
  const cPoint2 = getPoint(points.cx2, points.cy2); // 0 60 + 60
  const end = getPoint(points.endX, points.endY); // 100 60

  let pathPoints = {
    beginX: begin.x,
    beginY: begin.y,
    cx1: cPoint1.x,
    cy1: cPoint1.y,
    cx2: cPoint2.x,
    cy2: cPoint2.y,
    endX: end.x,
    endY: end.y,
  };

  function getBBoxPath() {
    (pathHiddenElement?.domElement as any).setAttribute(
      'd',
      `M${pathPoints.beginX} ${pathPoints.beginY} C${pathPoints.cx1} ${pathPoints.cy1} ${pathPoints.cx2} ${pathPoints.cy2}  ${pathPoints.endX} ${pathPoints.endY}`
    );
    const bbox = (
      pathHiddenElement?.domElement as unknown as SVGPathElement
    ).getBBox();

    return {
      x: bbox.x - 10,
      y: bbox.y - 10,
      width: bbox.width + 20,
      height: bbox.height + 20,
    };
  }

  const svgParent = createNSElement(
    'svg',
    {
      width: 0,
      height: 0,
      class: 'absolute top-0 left-0',
    },
    canvasElement
  );

  let nodeComponent: INodeComponent | undefined = undefined;
  nodeComponent = createSVGNodeComponent('g', {}, svgParent.domElement);
  nodeComponent.nodeType = 'connection';

  const bbox = getBBoxPath();

  (
    svgParent.domElement as unknown as HTMLElement
  ).style.width = `${bbox.width}px`;
  (
    svgParent.domElement as unknown as HTMLElement
  ).style.height = `${bbox.height}px`;
  (
    svgParent.domElement as unknown as HTMLElement
  ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

  let pathElement: IElementNode | undefined = undefined;
  pathElement = createNSElement(
    'path',
    {
      class: 'cursor-pointer pointer-events-auto',
      d: `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} C${
        pathPoints.cx1 - bbox.x
      } ${pathPoints.cy1 - bbox.y} ${pathPoints.cx2 - bbox.x} ${
        pathPoints.cy2 - bbox.y
      } ${pathPoints.endX - bbox.x} ${pathPoints.endY - bbox.y}`,
      stroke: 'white',
      'stroke-width': 3,
      fill: 'transparent',
      pointerdown: (e: PointerEvent) => {
        if (nodeComponent) {
          const elementRect = (
            nodeComponent.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();
          console.log(
            'connection pointerdown',
            e.clientX - elementRect.x,
            e.clientY - elementRect.y
          );
          interactionInfo = pointerDown(
            e.clientX - elementRect.x,
            e.clientY - elementRect.y,
            nodeComponent,
            canvasElement
          );
        }
      },
      pointermove: (e: PointerEvent) => {
        const canvasRect = (
          canvasElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            if (
              pointerMove(
                e.clientX - canvasRect.x,
                e.clientY - canvasRect.y,
                nodeComponent,
                canvasElement,
                interactionInfo
              )
            ) {
              console.log(
                'svg pointermove',
                nodeComponent.id,
                nodeComponent.domElement
              );
            }
          }
        }
      },
      pointerup: (e: PointerEvent) => {
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            const canvasRect = (
              canvasElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();
            pointerUp(
              e.clientX - canvasRect.x,
              e.clientY - canvasRect.y,
              nodeComponent,
              canvasElement,
              interactionInfo
            );
          }
        }
      },
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
    if (!actionComponent.specifier) {
      return;
    }
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
    } else {
      return;
    }

    const begin = getPoint(points.beginX, points.beginY); // 0 60 + 60
    const cPoint1 = getPoint(points.cx1, points.cy1); // 0 60 + 60
    const cPoint2 = getPoint(points.cx2, points.cy2); // 0 60 + 60
    const end = getPoint(points.endX, points.endY); // 100 60

    pathPoints = {
      beginX: begin.x,
      beginY: begin.y,
      cx1: cPoint1.x,
      cy1: cPoint1.y,
      cx2: cPoint2.x,
      cy2: cPoint2.y,
      endX: end.x,
      endY: end.y,
    };

    const bbox = getBBoxPath();

    (pathElement?.domElement as any).setAttribute(
      'd',
      `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} C${
        pathPoints.cx1 - bbox.x
      } ${pathPoints.cy1 - bbox.y} ${pathPoints.cx2 - bbox.x} ${
        pathPoints.cy2 - bbox.y
      }  ${pathPoints.endX - bbox.x} ${pathPoints.endY - bbox.y}`
    );

    (
      svgParent.domElement as unknown as HTMLElement
    ).style.width = `${bbox.width}px`;
    (
      svgParent.domElement as unknown as HTMLElement
    ).style.height = `${bbox.height}px`;
    (
      svgParent.domElement as unknown as HTMLElement
    ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;
  };
  nodeComponent.x = initialX;
  nodeComponent.y = initialY;
  return nodeComponent;
};
