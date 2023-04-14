import { transformToCamera } from '../camera';
import {
  ControlAndEndPointNodeType,
  CurveType,
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown } from './events/pointer-events';

const thumbRadius = 10;
const thumbWidth = 100;
const thumbHeight = 100;

const thumbOffsetX = -thumbWidth / 2 + thumbRadius;
const thumbOffsetY = -thumbHeight / 2 + thumbRadius;

const thumbTransformX = thumbWidth / 2;
const thumbTransformY = thumbHeight / 2;

// TODO : make the "50" a constant or incoming parameter
function getPoint(x: number, y: number) {
  const pt = new DOMPoint();
  pt.x = x + thumbTransformX;
  pt.y = y + thumbTransformY;

  return {
    x: pt.x,
    y: pt.y,
  };
}

export const createConnectionSVGElement = <T>(
  canvasElement: DOMElementNode,
  elements: ElementNodeMap<T>,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  controlPoint1X: number,
  controlPoint1Y: number,
  controlPoint2X: number,
  controlPoint2Y: number,
  pathHiddenElement: IElementNode<T>,
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
  (canvasElement as unknown as HTMLElement).prepend(svgParent.domElement);

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
  createNSElement(
    'path',
    {
      d: 'M0,0 V4 L2,2 Z',
      fill: 'white',
    },
    marker.domElement
  );

  let nodeComponent: INodeComponent<T> | undefined = undefined;
  nodeComponent = createSVGNodeComponent('g', {}, svgParent.domElement);
  if (!nodeComponent) throw new Error('nodeComponent is undefined');
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

  let pathElement: IElementNode<T> | undefined = undefined;
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

          const { x, y } = transformToCamera(e.clientX, e.clientY);
          const rectCamera = transformToCamera(elementRect.x, elementRect.y);

          const interactionInfoResult = pointerDown(
            x - rectCamera.x - (pathPoints.beginX - bbox.x - 10),
            y - rectCamera.y - (pathPoints.beginY - bbox.y - 10),
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
    },
    nodeComponent.domElement
  );

  if (!pathElement) throw new Error('pathElement is undefined');

  elements.set(nodeComponent.id, nodeComponent);
  nodeComponent.elements.set(pathElement.id, pathElement);

  nodeComponent.update = (
    incomingComponent?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    console.log(
      'update connection',
      incomingComponent?.nodeType,
      actionComponent?.nodeType
    );

    if (
      !incomingComponent &&
      x === undefined &&
      y === undefined &&
      !actionComponent
    ) {
      // eslint-disable-next-line no-console
      // update all in this condition...
    }

    let skipChecks = false;

    if (
      !incomingComponent ||
      x === undefined ||
      y === undefined ||
      !actionComponent
    ) {
      if (nodeComponent?.endNode && nodeComponent?.startNode) {
        // needed for updating without using parameters (...update() )
        // TODO : what if only endNode or startNode is defined?

        if (
          nodeComponent?.startNode.onCalculateControlPoints &&
          nodeComponent?.endNode.onCalculateControlPoints
        ) {
          const start = nodeComponent.startNode.onCalculateControlPoints(
            ControlAndEndPointNodeType.start,
            CurveType.bezierCubic
          );
          const end = nodeComponent.endNode.onCalculateControlPoints(
            ControlAndEndPointNodeType.end,
            CurveType.bezierCubic
          );
          points.beginX = start.x;
          points.beginY = start.y;
          points.cx1 = start.cx;
          points.cy1 = start.cy;
          points.endX = end.x;
          points.endY = end.y;
          points.cx2 = end.cx;
          points.cy2 = end.cy;
          skipChecks = true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    if (
      !skipChecks &&
      incomingComponent &&
      actionComponent &&
      x !== undefined &&
      y !== undefined &&
      incomingComponent.nodeType === 'connection' &&
      (actionComponent.nodeType === 'connection' ||
        actionComponent.nodeType === 'shape')
    ) {
      if (
        incomingComponent.startNode &&
        actionComponent.id === incomingComponent.startNode.id
      ) {
        if (actionComponent.onCalculateControlPoints) {
          const start = actionComponent.onCalculateControlPoints(
            ControlAndEndPointNodeType.start,
            CurveType.bezierCubic
          );
          points.beginX = start.x;
          points.beginY = start.y;
          points.cx1 = start.cx;
          points.cy1 = start.cy;
        } else {
          return false;
        }
      } else if (
        incomingComponent.endNode &&
        actionComponent.id === incomingComponent.endNode.id
      ) {
        if (actionComponent.onCalculateControlPoints) {
          const end = actionComponent.onCalculateControlPoints(
            ControlAndEndPointNodeType.end,
            CurveType.bezierCubic
          );
          points.endX = end.x;
          points.endY = end.y;
          points.cx2 = end.cx;
          points.cy2 = end.cy;
        } else {
          return false;
        }
      } else {
        const diffC1x = points.cx1 - points.beginX;
        const diffC1y = points.cy1 - points.beginY;
        const diffC2x = points.cx2 - points.beginX;
        const diffC2y = points.cy2 - points.beginY;
        const diffEndX = points.endX - points.beginX;
        const diffEndY = points.endY - points.beginY;

        points.beginX = x - thumbTransformX;
        points.beginY = y - thumbTransformY;

        points.cx1 = x - thumbTransformX + diffC1x;
        points.cy1 = y - thumbTransformY + diffC1y;
        points.cx2 = x - thumbTransformX + diffC2x;
        points.cy2 = y - thumbTransformY + diffC2y;
        points.endX = x - thumbTransformX + diffEndX;
        points.endY = y - thumbTransformY + diffEndY;
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
    } else if (!skipChecks) {
      if (actionComponent && !actionComponent.specifier) {
        return false;
      }

      if (actionComponent && x !== undefined && y !== undefined) {
        if (actionComponent.specifier === 'c1') {
          points.cx1 = x;
          points.cy1 = y;
        } else if (actionComponent.specifier === 'c2') {
          points.cx2 = x;
          points.cy2 = y;
        } else if (actionComponent.specifier === 'end') {
          points.endX = x;
          points.endY = y;
        } else if (actionComponent.specifier === 'begin') {
          points.beginX = x;
          points.beginY = y;
        } else {
          return false;
        }
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