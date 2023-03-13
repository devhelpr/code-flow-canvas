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

const minSize = 50;

function getPoint(x: number, y: number) {
  const pt = new DOMPoint();
  pt.x = x + 50;
  pt.y = y + 50;

  return {
    x: pt.x,
    y: pt.y,
  };
}

export type RectNodeSpecifer = 'start' | 'end';

export const createRectPathSVGElement = (
  canvasElement: DOMElementNode,
  elements: ElementNodeMap,
  startX: number,
  startY: number,
  width: number,
  height: number,
  pathHiddenElement: IElementNode,
  specifier: RectNodeSpecifer
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
    width: width,
    height: height,
  };

  const begin = getPoint(points.beginX, points.beginY);
  // const cPoint1 = getPoint(points.cx1, points.cy1);
  // const cPoint2 = getPoint(points.cx2, points.cy2);
  // const end = getPoint(points.endX, points.endY);

  let pathPoints = {
    beginX: begin.x,
    beginY: begin.y,
    width: points.width,
    height: points.height,
  };

  function getBBoxPath() {
    (pathHiddenElement?.domElement as any).setAttribute(
      'd',
      `M${pathPoints.beginX} ${pathPoints.beginY} H${
        pathPoints.beginX + pathPoints.width
      } V${pathPoints.beginY + pathPoints.height} H${pathPoints.beginX} Z`
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
      class: 'absolute top-0 left-0 pointer-events-none',
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
      d: `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} H${
        pathPoints.beginX - bbox.x + pathPoints.width
      } V ${pathPoints.beginY - bbox.y + pathPoints.height} H${
        pathPoints.beginX - bbox.x
      } Z`,
      stroke: 'white',
      'stroke-width': 3,
      fill: 'transparent',
      pointerdown: (e: PointerEvent) => {
        if (nodeComponent) {
          const elementRect = (
            nodeComponent.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();

          const bbox = getBBoxPath();
          interactionInfo = pointerDown(
            e.clientX - elementRect.x - (pathPoints.beginX - bbox.x - 10),
            e.clientY - elementRect.y - (pathPoints.beginY - bbox.y - 10),
            nodeComponent,
            canvasElement
          );
          if (interactionInfo) {
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
                connectionInfo.controllers?.rightTop.domElement
              );

              (canvasElement as unknown as HTMLElement | SVGElement).append(
                connectionInfo.controllers?.leftBottom.domElement
              );

              (canvasElement as unknown as HTMLElement | SVGElement).append(
                connectionInfo.controllers?.rightBottom.domElement
              );
            }
          }
        }
      },
      pointermove: (e: PointerEvent) => {
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
    if (
      incomingComponent.nodeType === 'connection' &&
      actionComponent.nodeType === 'connection'
    ) {
      points.beginX = x - 50;
      points.beginY = y - 50;
      if (nodeComponent) {
        nodeComponent.x = points.beginX;
        nodeComponent.y = points.beginY;
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

        connectionInfo.controllers?.rightTop.update(
          connectionInfo.controllers?.rightTop,
          points.beginX + points.width,
          points.beginY,
          actionComponent
        );

        connectionInfo.controllers?.leftBottom.update(
          connectionInfo.controllers?.leftBottom,
          points.beginX,
          points.beginY + points.height,
          actionComponent
        );

        connectionInfo.controllers?.rightBottom.update(
          connectionInfo.controllers?.rightBottom,
          points.beginX + points.width,
          points.beginY + points.height,
          actionComponent
        );
      }
    } else {
      if (!actionComponent.specifier) {
        return false;
      }
      const connectionInfo = incomingComponent.components.find(
        (c) => c.type === 'self'
      );

      if (connectionInfo && connectionInfo.controllers) {
        if (actionComponent.specifier === 'leftBottom') {
          if (x <= points.beginX + points.width - minSize) {
            points.width = points.width - (x - points.beginX);
            points.beginX = x;
          } else {
            return false;
          }

          if (y - points.beginY >= minSize) {
            points.height = y - points.beginY;
          } else {
            return false;
          }
        } else if (actionComponent.specifier === 'rightBottom') {
          if (x - points.beginX >= minSize && y - points.beginY >= minSize) {
            points.width = x - points.beginX;
            points.height = y - points.beginY;
          } else {
            return false;
          }
        } else if (actionComponent.specifier === 'rightTop') {
          if (x - points.beginX >= minSize) {
            points.width = x - points.beginX;
          } else {
            return false;
          }
          if (y <= points.beginY + points.height - minSize) {
            points.height = points.height - (y - points.beginY);
            points.beginY = y;
          } else {
            return false;
          }
        } else if (actionComponent.specifier === 'begin') {
          if (x <= points.beginX + points.width - minSize) {
            points.width = points.width - (x - points.beginX);
            points.beginX = x;
          } else {
            return false;
          }
          if (y <= points.beginY + points.height - minSize) {
            points.height = points.height - (y - points.beginY);
            points.beginY = y;
          } else {
            return false;
          }
        } else {
          return false;
        }

        // TODO : fix these depending on the specifier !!

        const getRectPoint = (specifier: string) => {
          if (specifier === 'begin') {
            return {
              x: points.beginX,
              y: points.beginY,
            };
          } else if (specifier === 'rightTop') {
            return {
              x: points.beginX + points.width,
              y: points.beginY,
            };
          } else if (specifier === 'leftBottom') {
            return {
              x: points.beginX,
              y: points.beginY + points.height,
            };
          } else if (specifier === 'rightBottom') {
            return {
              x: points.beginX + points.width,
              y: points.beginY + points.height,
            };
          }
          return false;
        };
        let point = getRectPoint(connectionInfo.controllers?.start.specifier);
        if (point) {
          connectionInfo.controllers?.start.update(
            connectionInfo.controllers?.start,
            point.x,
            point.y,
            incomingComponent
          );
        }
        point = getRectPoint(connectionInfo.controllers?.rightTop.specifier);
        if (point) {
          connectionInfo.controllers?.rightTop.update(
            connectionInfo.controllers?.rightTop,
            point.x,
            point.y,
            incomingComponent
          );
        }
        point = getRectPoint(connectionInfo.controllers?.leftBottom.specifier);
        if (point) {
          connectionInfo.controllers?.leftBottom.update(
            connectionInfo.controllers?.leftBottom,
            point.x,
            point.y,
            incomingComponent
          );
        }

        point = getRectPoint(connectionInfo.controllers?.rightBottom.specifier);
        if (point) {
          connectionInfo.controllers?.rightBottom.update(
            connectionInfo.controllers?.rightBottom,
            point.x,
            point.y,
            incomingComponent
          );
        }
      }
    }

    const begin = getPoint(points.beginX, points.beginY);

    pathPoints = {
      beginX: begin.x,
      beginY: begin.y,
      width: points.width,
      height: points.height,
    };

    const bbox = getBBoxPath();
    (pathElement?.domElement as HTMLElement).setAttribute(
      'd',
      `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} H${
        pathPoints.beginX - bbox.x + pathPoints.width
      } V ${pathPoints.beginY - bbox.y + pathPoints.height} H${
        pathPoints.beginX - bbox.x
      } Z`
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

    if (nodeComponent) {
      nodeComponent.x = points.beginX;
      nodeComponent.y = points.beginY;
      nodeComponent.width = points.width;
      nodeComponent.height = points.height;
    }

    // TODO : check if connection with this rect exists (start/end) by
    // looking al all elements :
    // - if its a connection then look at the start/end.. if match then update
    if (nodeComponent) {
      elements.forEach((e) => {
        const lookAtNodeComponent = e as unknown as INodeComponent;
        if (lookAtNodeComponent.nodeType === 'connection') {
          const start = lookAtNodeComponent.components.find(
            (c) =>
              nodeComponent &&
              c.type === 'start' &&
              c.component?.id === nodeComponent.id
          );
          const end = lookAtNodeComponent.components.find(
            (c) =>
              nodeComponent &&
              c.type === 'end' &&
              c.component?.id === nodeComponent.id
          );
          if (
            start &&
            lookAtNodeComponent &&
            lookAtNodeComponent.update &&
            nodeComponent
          ) {
            console.log('start', lookAtNodeComponent, nodeComponent);
            lookAtNodeComponent.update(
              lookAtNodeComponent,
              points.beginX,
              points.beginY,
              nodeComponent
            );
          }
          if (
            end &&
            lookAtNodeComponent &&
            lookAtNodeComponent.update &&
            nodeComponent
          ) {
            console.log('end', lookAtNodeComponent, nodeComponent);
            lookAtNodeComponent.update(
              lookAtNodeComponent,
              points.beginX,
              points.beginY,
              nodeComponent
            );
          }
        }
      });
    }
    return true;
  };
  nodeComponent.x = startX;
  nodeComponent.y = startY;
  nodeComponent.width = width;
  nodeComponent.height = height;
  nodeComponent.specifier = specifier;
  return nodeComponent;
};
