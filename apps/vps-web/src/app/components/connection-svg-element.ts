import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { setSelectNode } from '../reactivity';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

function getPoint(x: number, y: number) {
  const pt = new DOMPoint();
  pt.x = x + 50;
  pt.y = y + 50;

  return {
    x: pt.x,
    y: pt.y,
  };
}

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
  pathHiddenElement: IElementNode,
  isQuadratic = false
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

  let isClicking = false;
  let isMoving = false;

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

  const begin = getPoint(points.beginX, points.beginY);
  const cPoint1 = getPoint(points.cx1, points.cy1);
  const cPoint2 = getPoint(points.cx2, points.cy2);
  const end = getPoint(points.endX, points.endY);

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
    if (isQuadratic) {
      (pathHiddenElement?.domElement as any).setAttribute(
        'd',
        `M${pathPoints.beginX} ${pathPoints.beginY} Q${pathPoints.cx1} ${pathPoints.cy1} ${pathPoints.endX} ${pathPoints.endY}`
      );
    } else {
      (pathHiddenElement?.domElement as any).setAttribute(
        'd',
        `M${pathPoints.beginX} ${pathPoints.beginY} C${pathPoints.cx1} ${pathPoints.cy1} ${pathPoints.cx2} ${pathPoints.cy2}  ${pathPoints.endX} ${pathPoints.endY}`
      );
    }
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
      class: 'absolute top-0 left-0 pointer-events-none',
    },
    canvasElement
  );
  const defs = createNSElement('defs', {}, svgParent.domElement);
  const marker = createNSElement(
    'marker',
    {
      id: 'arrow',
      refX: '0',
      refY: '2',
      markerUnits: 'strokeWidth',
      markerWidth: '4',
      markerHeight: '4',
      orient: 'auto',
    },
    defs.domElement
  );
  const arrowMarkerPath = createNSElement(
    'path',
    {
      d: 'M0,0 V4 L2,2 Z',
      fill: 'white',
    },
    marker.domElement
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
      d: isQuadratic
        ? `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} Q${
            pathPoints.cx1 - bbox.x
          } ${pathPoints.cy1 - bbox.y} ${pathPoints.endX - bbox.x} ${
            pathPoints.endY - bbox.y
          }`
        : `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} C${
            pathPoints.cx1 - bbox.x
          } ${pathPoints.cy1 - bbox.y} ${pathPoints.cx2 - bbox.x} ${
            pathPoints.cy2 - bbox.y
          } ${pathPoints.endX - bbox.x} ${pathPoints.endY - bbox.y}`,
      stroke: 'white',
      'marker-end': 'url(#arrow)',
      'stroke-width': 3,
      fill: 'transparent',
      pointerdown: (e: PointerEvent) => {
        if (nodeComponent?.isControlled) {
          return;
        }
        if (nodeComponent) {
          const elementRect = (
            nodeComponent.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();

          const bbox = getBBoxPath();
          const interactionInfoResult = pointerDown(
            e.clientX - elementRect.x - (pathPoints.beginX - bbox.x - 10),
            e.clientY - elementRect.y - (pathPoints.beginY - bbox.y - 10),
            nodeComponent,
            canvasElement
          );
          if (interactionInfoResult) {
            interactionInfo = interactionInfoResult;
            isClicking = true;
            isMoving = false;
            (canvasElement as unknown as HTMLElement | SVGElement).append(
              svgParent.domElement
            );

            const connectionInfo = nodeComponent.components.find(
              (c) => c.type === 'self'
            );

            if (connectionInfo) {
              (canvasElement as unknown as HTMLElement | SVGElement).append(
                connectionInfo.controllers?.start.domElement
              );
              (canvasElement as unknown as HTMLElement | SVGElement).append(
                connectionInfo.controllers?.end.domElement
              );

              if (isQuadratic) {
                (canvasElement as unknown as HTMLElement | SVGElement).append(
                  connectionInfo.controllers?.controlPoint.domElement
                );
              } else {
                (canvasElement as unknown as HTMLElement | SVGElement).append(
                  connectionInfo.controllers?.controlPoint1.domElement
                );

                (canvasElement as unknown as HTMLElement | SVGElement).append(
                  connectionInfo.controllers?.controlPoint2.domElement
                );
              }
            }
          }
        }
      },
      /*pointermove: (e: PointerEvent) => {
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            if (
              pointerMove(
                e.clientX,
                e.clientY,
                nodeComponent,
                canvasElement,
                interactionInfo
              )
            ) {
              isMoving = true;
            }
          }
        }
      },
      pointerup: (e: PointerEvent) => {
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            pointerUp(
              e.clientX,
              e.clientY,
              nodeComponent,
              canvasElement,
              interactionInfo
            );
            if (isClicking && !isMoving) {
              setSelectNode(nodeComponent);
            }
            isMoving = false;
            isClicking = false;
          }
        }
      },*/
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
    if (
      incomingComponent.nodeType === 'connection' &&
      actionComponent.nodeType === 'connection'
    ) {
      if (
        incomingComponent.startNode &&
        actionComponent.id === incomingComponent.startNode.id
      ) {
        console.log(
          'start',
          actionComponent.id,
          x,
          y,
          actionComponent?.width,
          actionComponent?.height
        );
        points.beginX = x + (actionComponent?.width || 0) + 20;
        points.beginY = y + (actionComponent?.height || 0) / 2;

        points.cx1 = points.beginX + (actionComponent?.width || 0) + 50;
        points.cy1 = points.beginY;
        //
      } else if (
        incomingComponent.endNode &&
        actionComponent.id === incomingComponent.endNode.id
      ) {
        console.log('end', actionComponent.id);
        points.endX = x - 20;
        points.endY = y + (actionComponent?.height || 0) / 2;

        points.cx2 = points.endX - (actionComponent?.width || 0) - 50;
        points.cy2 = points.endY;
      } else {
        const diffC1x = points.cx1 - points.beginX;
        const diffC1y = points.cy1 - points.beginY;
        const diffC2x = points.cx2 - points.beginX;
        const diffC2y = points.cy2 - points.beginY;
        const diffEndX = points.endX - points.beginX;
        const diffEndY = points.endY - points.beginY;

        points.beginX = x - 50;
        points.beginY = y - 50;

        points.cx1 = x - 50 + diffC1x;
        points.cy1 = y - 50 + diffC1y;
        points.cx2 = x - 50 + diffC2x;
        points.cy2 = y - 50 + diffC2y;
        points.endX = x - 50 + diffEndX;
        points.endY = y - 50 + diffEndY;
      }
      const connectionInfo = incomingComponent.components.find(
        (c) => c.type === 'self'
      );

      if (connectionInfo) {
        connectionInfo.controllers?.start.update(
          connectionInfo.controllers?.start,
          points.beginX,
          points.beginY,
          actionComponent
        );

        connectionInfo.controllers?.end.update(
          connectionInfo.controllers?.end,
          points.endX,
          points.endY,
          actionComponent
        );

        if (isQuadratic) {
          connectionInfo.controllers?.controlPoint.update(
            connectionInfo.controllers?.controlPoint,
            points.cx1,
            points.cy1,
            actionComponent
          );
        } else {
          connectionInfo.controllers?.controlPoint1.update(
            connectionInfo.controllers?.controlPoint1,
            points.cx1,
            points.cy1,
            actionComponent
          );

          connectionInfo.controllers?.controlPoint2.update(
            connectionInfo.controllers?.controlPoint2,
            points.cx2,
            points.cy2,
            actionComponent
          );
        }
      }
    } else {
      if (!actionComponent.specifier) {
        return false;
      }

      if (actionComponent.specifier === 'c1') {
        points.cx1 = x; //- incomingComponent.x;
        points.cy1 = y; //- incomingComponent.y;
      } else if (actionComponent.specifier === 'c2') {
        points.cx2 = x; //- incomingComponent.x;
        points.cy2 = y; //- incomingComponent.y;
      } else if (actionComponent.specifier === 'end') {
        points.endX = x; //- incomingComponent.x;
        points.endY = y; //- incomingComponent.y;
      } else if (actionComponent.specifier === 'begin') {
        points.beginX = x; //- incomingComponent.x;
        points.beginY = y; //- incomingComponent.y;
      } else {
        return false;
      }
    }

    const begin = getPoint(points.beginX, points.beginY);
    const cPoint1 = getPoint(points.cx1, points.cy1);
    const cPoint2 = getPoint(points.cx2, points.cy2);
    const end = getPoint(points.endX, points.endY);

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
    if (isQuadratic) {
      (pathElement?.domElement as HTMLElement).setAttribute(
        'd',
        `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} Q${
          pathPoints.cx1 - bbox.x
        } ${pathPoints.cy1 - bbox.y}  ${pathPoints.endX - bbox.x} ${
          pathPoints.endY - bbox.y
        }`
      );
    } else {
      (pathElement?.domElement as HTMLElement).setAttribute(
        'd',
        `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} C${
          pathPoints.cx1 - bbox.x
        } ${pathPoints.cy1 - bbox.y} ${pathPoints.cx2 - bbox.x} ${
          pathPoints.cy2 - bbox.y
        }  ${pathPoints.endX - bbox.x} ${pathPoints.endY - bbox.y}`
      );
    }

    (
      svgParent.domElement as unknown as HTMLElement
    ).style.width = `${bbox.width}px`;
    (
      svgParent.domElement as unknown as HTMLElement
    ).style.height = `${bbox.height}px`;
    (
      svgParent.domElement as unknown as HTMLElement
    ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    return true;
  };
  nodeComponent.x = 0;
  nodeComponent.y = 0;
  return nodeComponent;
};
