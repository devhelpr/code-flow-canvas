import { compileMarkup } from '@devhelpr/markup-compiler';
import { transformToCamera } from '../camera';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { ShapeType } from '../types/shape-type';
import { createASTNodeElement } from '../utils/create-ast-markup-node';
import { createElement, createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown } from './events/pointer-events';

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

export const createRectPathSVGElement = <T>(
  canvasElement: DOMElementNode,
  elements: ElementNodeMap<T>,
  startX: number,
  startY: number,
  width: number,
  height: number,
  pathHiddenElement: IElementNode<T>,
  text?: string,
  shapeType?: ShapeType
) => {
  /*
    draw svg path based on bbox of the hidden path
      
      - add padding to the bbox x and y and width and height

      - subtract bbox x and y from the path points
      - set transform of svg to the bbox x and y
      - set the width and height of the svg to the bbox width and height   
  */

  const points = {
    beginX: startX,
    beginY: startY,
    width: width,
    height: height,
  };

  const begin = getPoint(points.beginX, points.beginY);

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

  const divElement = createElement(
    'div',
    {
      class:
        'absolute top-0 left-0 bg-red-500 flex items-center rounded-xl justify-center z-[1000] pointer-events-none',
    },
    canvasElement
  );

  const compiledMarkup = compileMarkup(
    '<div class="bg-green-500"><p>Hello</p><p>World</p></div>'
  );
  if (!compiledMarkup) {
    throw new Error('Invalid markup');
  }

  if (compiledMarkup && divElement && divElement.domElement) {
    createASTNodeElement(
      compiledMarkup.body,
      divElement.domElement,
      divElement.elements
    );
  }

  const svgParent = createNSElement(
    'svg',
    {
      width: 0,
      height: 0,
      class: 'absolute top-0 left-0 pointer-events-none z-[500]',
    },
    canvasElement
  );

  let nodeComponent: INodeComponent<T> | undefined = undefined;
  nodeComponent = createSVGNodeComponent('g', {}, svgParent.domElement);

  if (!nodeComponent) throw new Error('nodeComponent is undefined');

  nodeComponent.nodeType = 'connection';
  nodeComponent.shapeType = shapeType;

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

  (
    divElement.domElement as unknown as HTMLElement
  ).style.width = `${bbox.width}px`;
  (
    divElement.domElement as unknown as HTMLElement
  ).style.height = `${bbox.height}px`;
  (
    divElement.domElement as unknown as HTMLElement
  ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

  let pathElement: IElementNode<T> | undefined = undefined;
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
      fill: '#0080cc',
      pointerdown: (e: PointerEvent) => {
        if (nodeComponent) {
          const elementRect = (
            nodeComponent.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();

          const { x, y } = transformToCamera(e.clientX, e.clientY);
          const rectCamera = transformToCamera(elementRect.x, elementRect.y);

          const bbox = getBBoxPath();
          const interactionInfoResult = pointerDown(
            x - rectCamera.x - (pathPoints.beginX - bbox.x - 10),
            y - rectCamera.y - (pathPoints.beginY - bbox.y - 10),
            nodeComponent,
            canvasElement
          );
          if (interactionInfoResult) {
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

              (canvasElement as unknown as HTMLElement | SVGElement).append(
                connectionInfo.controllers?.rightThumbConnector.domElement
              );

              (canvasElement as unknown as HTMLElement | SVGElement).append(
                connectionInfo.controllers?.leftThumbConnector.domElement
              );
            }
          }
        }
      },
    },
    nodeComponent.domElement
  );

  if (!pathElement) throw new Error('pathElement is undefined');

  elements.set(nodeComponent.id, nodeComponent);
  nodeComponent.elements.push(pathElement);

  if (text) {
    const textElement = createSVGNodeComponent(
      'text',
      {
        x: '50%',
        y: '50%',
        'dominant-baseline': 'middle',
        'text-anchor': 'middle',
      },
      nodeComponent.domElement
    );
    const textNode = document.createTextNode(text);
    textElement.domElement.appendChild(textNode);
  }

  nodeComponent.update = (
    incomingComponent?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (
      !incomingComponent ||
      x === undefined ||
      y === undefined ||
      !actionComponent
    ) {
      return false;
    }

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

        connectionInfo.controllers?.leftThumbConnector.update(
          connectionInfo.controllers?.leftThumbConnector,
          points.beginX,
          points.beginY + points.height / 2,
          actionComponent
        );

        connectionInfo.controllers?.rightThumbConnector.update(
          connectionInfo.controllers?.rightThumbConnector,
          points.beginX + points.width,
          points.beginY + points.height / 2,
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
          } else if (specifier === 'leftThumbConnector') {
            return {
              x: points.beginX,
              y: points.beginY + points.height / 2,
            };
          } else if (specifier === 'rightThumbConnector') {
            return {
              x: points.beginX + points.width,
              y: points.beginY + points.height / 2,
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

        point = getRectPoint(
          connectionInfo.controllers?.rightThumbConnector.specifier
        );
        if (point) {
          connectionInfo.controllers?.rightThumbConnector.update(
            connectionInfo.controllers?.rightThumbConnector,
            point.x,
            point.y,
            incomingComponent
          );
        }

        point = getRectPoint(
          connectionInfo.controllers?.leftThumbConnector.specifier
        );
        if (point) {
          connectionInfo.controllers?.leftThumbConnector.update(
            connectionInfo.controllers?.leftThumbConnector,
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

    (
      divElement.domElement as unknown as HTMLElement
    ).style.width = `${bbox.width}px`;
    (
      divElement.domElement as unknown as HTMLElement
    ).style.height = `${bbox.height}px`;
    (
      divElement.domElement as unknown as HTMLElement
    ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    if (nodeComponent) {
      nodeComponent.x = points.beginX;
      nodeComponent.y = points.beginY;
      nodeComponent.width = points.width;
      nodeComponent.height = points.height;
    }

    if (nodeComponent) {
      elements.forEach((e) => {
        const lookAtNodeComponent = e as unknown as INodeComponent<T>;
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
  return nodeComponent;
};
