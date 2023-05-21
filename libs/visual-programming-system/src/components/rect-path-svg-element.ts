import { compileMarkup } from '@devhelpr/markup-compiler';
import { getCamera, transformToCamera } from '../camera';
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
import { ThumbType } from '../types';
import { InteractionStateMachine } from '../interaction-state-machine';

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
  interactionStateMachine: InteractionStateMachine<T>,
  elements: ElementNodeMap<T>,
  startX: number,
  startY: number,
  width: number,
  height: number,
  pathHiddenElement: IElementNode<T>,
  text?: string,
  shapeType?: ShapeType,
  thumbOffsetX?: number,
  thumbOffsetY?: number,
  getThumbPosition?: (
    thumbType: ThumbType,
    index?: number
  ) => { x: number; y: number },
  markup?: string | INodeComponent<T>,
  layoutProperties?: {
    classNames?: string;
  }
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
    // (pathHiddenElement?.domElement as any).setAttribute(
    //   'd',
    //   `M${pathPoints.beginX} ${pathPoints.beginY} H${
    //     pathPoints.beginX + pathPoints.width
    //   } V${pathPoints.beginY + pathPoints.height} H${pathPoints.beginX} Z`
    // );
    // const bbox = (
    //   pathHiddenElement?.domElement as unknown as SVGPathElement
    // ).getBBox();

    // return {
    //   x: bbox.x - 10,
    //   y: bbox.y - 10,
    //   width: bbox.width + 20,
    //   height: bbox.height + 20,
    // };

    return {
      x: pathPoints.beginX - 10,
      y: pathPoints.beginY - 10,
      width: pathPoints.width + 20,
      height: pathPoints.height + 20,
    };
  }

  const divElement = createElement(
    'div',
    {
      class: 'absolute top-0 left-0 select-none ', //will-change-transform
    },
    canvasElement
  ) as unknown as INodeComponent<T> | undefined;

  if (!divElement) throw new Error('divElement is undefined');

  divElement.nodeType = 'shape';
  divElement.shapeType = shapeType;
  divElement.components = [];

  /*

  bg-green-500 rounded p-4
  <p>Lorem ipsum</p>
      <p>Lorem ipsum</p>
      <p>Lorem ipsum</p>
      <p>Lorem ipsum</p>
      <p>Lorem ipsum</p>
      <p>Lorem ipsum</p>
      <input class="w-full mt-2 border-2 rounded"></input>
  */

  let astElement: any;

  const hasPointerEvents = true;
  if (markup !== undefined && typeof markup === 'string') {
    const compiledMarkup = compileMarkup(
      `<div class="${
        layoutProperties?.classNames ?? ''
      } overflow-hidden cursor-pointer">
        ${markup ?? ''}
      </div>`
    );
    if (!compiledMarkup) {
      throw new Error('Invalid markup');
    }

    if (compiledMarkup && divElement && divElement.domElement) {
      astElement = createASTNodeElement(
        compiledMarkup.body,
        divElement.domElement,
        divElement.elements
      );
    }
  } else if (markup !== undefined) {
    astElement = markup as unknown as INodeComponent<T>;
    divElement.domElement.appendChild(astElement.domElement);
    divElement.elements.set(astElement.id, astElement);
    //hasPointerEvents = false;
  } else {
    throw new Error('No markup or INodeComponent');
  }

  if (astElement && hasPointerEvents) {
    astElement.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
      if (
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
          (e.target as HTMLElement)?.tagName
        ) >= 0
      )
        return;

      //if (nodeComponent) {
      if (divElement) {
        //        nodeComponent.domElement as unknown as HTMLElement | SVGElement
        const elementRect = (
          divElement.domElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();

        const { x, y } = transformToCamera(e.clientX, e.clientY);
        const rectCamera = transformToCamera(elementRect.x, elementRect.y);

        const bbox = getBBoxPath();
        const interactionInfoResult = pointerDown(
          x - rectCamera.x - (pathPoints.beginX - bbox.x),
          y - rectCamera.y - (pathPoints.beginY - bbox.y),
          divElement,
          canvasElement,
          interactionStateMachine
        );
        if (interactionInfoResult) {
          (canvasElement as unknown as HTMLElement | SVGElement).append(
            divElement.domElement
          );
        }
      }
    });
  }

  // const svgParent = createNSElement(
  //   'svg',
  //   {
  //     width: 0,
  //     height: 0,
  //     class: 'absolute top-0 left-0 pointer-events-none invisible', //z-[500]
  //   },
  //   divElement.domElement
  // );

  // let nodeComponent: INodeComponent<T> | undefined = undefined;
  // nodeComponent = createSVGNodeComponent('g', {}, svgParent.domElement);

  // if (!nodeComponent) throw new Error('nodeComponent is undefined');

  // nodeComponent.nodeType = 'shape';
  // nodeComponent.shapeType = shapeType;

  if (!divElement) throw new Error('nodeComponent is undefined');

  const bbox = getBBoxPath();

  // (
  //   svgParent.domElement as unknown as HTMLElement
  // ).style.width = `${bbox.width}px`;
  // (
  //   svgParent.domElement as unknown as HTMLElement
  // ).style.height = `${bbox.height}px`;

  (
    divElement.domElement as unknown as HTMLElement
  ).style.width = `${bbox.width}px`;
  (
    divElement.domElement as unknown as HTMLElement
  ).style.height = `${bbox.height}px`;
  (
    divElement.domElement as unknown as HTMLElement
  ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

  // let pathElement: IElementNode<T> | undefined = undefined;
  // pathElement = createNSElement(
  //   'path',
  //   {
  //     class: 'cursor-pointer pointer-events-auto',
  //     d: `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} H${
  //       pathPoints.beginX - bbox.x + pathPoints.width
  //     } V ${pathPoints.beginY - bbox.y + pathPoints.height} H${
  //       pathPoints.beginX - bbox.x
  //     } Z`,
  //     stroke: 'white',
  //     'stroke-width': 3,
  //     fill: '#0080cc',
  //     pointerdown: (e: PointerEvent) => {
  //       console.log('pointerDown', e);
  //     },
  //   },
  //   nodeComponent.domElement
  // );

  //if (!pathElement) throw new Error('pathElement is undefined');

  elements.set(divElement.id, divElement);

  //divElement.elements.set(pathElement.id, pathElement);

  // if (text) {
  //   const textElement = createSVGNodeComponent(
  //     'text',
  //     {
  //       x: '50%',
  //       y: '50%',
  //       'dominant-baseline': 'middle',
  //       'text-anchor': 'middle',
  //     },
  //     nodeComponent.domElement
  //   );
  //   const textNode = document.createTextNode(text);
  //   textElement.domElement.appendChild(textNode);
  // }

  divElement.update = (
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
      (incomingComponent.nodeType === 'connection' &&
        actionComponent.nodeType === 'connection') ||
      (incomingComponent.nodeType === 'shape' &&
        actionComponent.nodeType === 'shape')
    ) {
      points.beginX = x - 50;
      points.beginY = y - 50;
      //if (nodeComponent && divElement) {
      if (divElement) {
        // nodeComponent.x = points.beginX;
        // nodeComponent.y = points.beginY;

        divElement.x = points.beginX;
        divElement.y = points.beginY;
      }
      const connectionInfo = incomingComponent.components.find(
        (c) => c.type === 'self'
      );

      if (connectionInfo && getThumbPosition) {
        const topLeft = getThumbPosition(ThumbType.TopLeft);
        connectionInfo.controllers?.start.update(
          connectionInfo.controllers?.start,
          topLeft.x,
          topLeft.y,
          actionComponent
        );

        const topRight = getThumbPosition(ThumbType.TopRight);
        connectionInfo.controllers?.rightTop.update(
          connectionInfo.controllers?.rightTop,
          topRight.x,
          topRight.y,
          actionComponent
        );

        const bottomLeft = getThumbPosition(ThumbType.BottomLeft);
        connectionInfo.controllers?.leftBottom.update(
          connectionInfo.controllers?.leftBottom,
          bottomLeft.x,
          bottomLeft.y,
          actionComponent
        );

        const bottomRight = getThumbPosition(ThumbType.BottomRight);
        connectionInfo.controllers?.rightBottom.update(
          connectionInfo.controllers?.rightBottom,
          bottomRight.x,
          bottomRight.y,
          actionComponent
        );

        connectionInfo.controllers?.thumbConnectors.forEach(
          (connector: INodeComponent<T>) => {
            if (connector && connector.update && connector.thumbType) {
              const position = getThumbPosition(
                connector.thumbType,
                connector.thumbIndex ?? 0
              );
              connector.update(
                connector,
                position.x,
                position.y,
                actionComponent
              );
            }
          }
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

        const getRectPoint = (
          specifier?: string,
          thumbConnector?: INodeComponent<T>
        ) => {
          if (!getThumbPosition) {
            return { x: 0, y: 0 };
          }
          if (specifier === 'begin') {
            const topLeft = getThumbPosition(ThumbType.TopLeft);
            return {
              x: topLeft.x,
              y: topLeft.y,
            };
          } else if (specifier === 'rightTop') {
            const topRight = getThumbPosition(ThumbType.TopRight);
            return {
              x: topRight.x,
              y: topRight.y,
            };
          } else if (specifier === 'leftBottom') {
            const bottomLeft = getThumbPosition(ThumbType.BottomLeft);
            return {
              x: bottomLeft.x,
              y: bottomLeft.y,
            };
          } else if (specifier === 'rightBottom') {
            const bottomRight = getThumbPosition(ThumbType.BottomRight);
            return {
              x: bottomRight.x,
              y: bottomRight.y,
            };
          } else if (!specifier && thumbConnector && thumbConnector.thumbType) {
            const position = getThumbPosition(
              thumbConnector.thumbType,
              thumbConnector.thumbIndex ?? 0
            );
            return {
              x: position.x,
              y: position.y,
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

        connectionInfo.controllers?.thumbConnectors.forEach(
          (connector: INodeComponent<T>) => {
            if (connector && connector.specifier) {
              point = getRectPoint(undefined, connector);
              if (point && connector.update) {
                console.log(
                  'update thumb connector',
                  connector.thumbType,
                  point.x,
                  point.y
                );
                connector.update(
                  connector,
                  point.x,
                  point.y,
                  incomingComponent
                );
              }
            }
          }
        );
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
    // (pathElement?.domElement as HTMLElement).setAttribute(
    //   'd',
    //   `M${pathPoints.beginX - bbox.x} ${pathPoints.beginY - bbox.y} H${
    //     pathPoints.beginX - bbox.x + pathPoints.width
    //   } V ${pathPoints.beginY - bbox.y + pathPoints.height} H${
    //     pathPoints.beginX - bbox.x
    //   } Z`
    // );

    // (
    //   svgParent.domElement as unknown as HTMLElement
    // ).style.width = `${bbox.width}px`;
    // (
    //   svgParent.domElement as unknown as HTMLElement
    // ).style.height = `${bbox.height}px`;

    // (
    //   svgParent.domElement as unknown as HTMLElement
    // ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    (
      divElement.domElement as unknown as HTMLElement
    ).style.width = `${bbox.width}px`;
    (
      divElement.domElement as unknown as HTMLElement
    ).style.height = `${bbox.height}px`;
    (
      divElement.domElement as unknown as HTMLElement
    ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    if (divElement) {
      // nodeComponent.x = points.beginX;
      // nodeComponent.y = points.beginY;
      // nodeComponent.width = points.width + 20; // 20 is padding !?
      // nodeComponent.height = points.height;

      divElement.x = points.beginX;
      divElement.y = points.beginY;
      divElement.width = points.width;
      divElement.height = points.height;
    }

    astElement.domElement.style.width = `${bbox.width}px`;
    astElement.domElement.style.height = `${bbox.height}px`;

    if (divElement) {
      elements.forEach((e) => {
        const lookAtNodeComponent = e as unknown as INodeComponent<T>;
        if (
          lookAtNodeComponent.nodeType === 'shape' ||
          lookAtNodeComponent.nodeType === 'connection'
        ) {
          const start = lookAtNodeComponent.components.find(
            (c) =>
              divElement &&
              c.type === 'start' &&
              c.component?.id === divElement.id
          );
          const end = lookAtNodeComponent.components.find(
            (c) =>
              divElement &&
              c.type === 'end' &&
              c.component?.id === divElement.id
          );
          if (
            start &&
            lookAtNodeComponent &&
            lookAtNodeComponent.update &&
            divElement
          ) {
            lookAtNodeComponent.update(
              lookAtNodeComponent,
              points.beginX,
              points.beginY,
              divElement
            );
          }
          if (
            end &&
            lookAtNodeComponent &&
            lookAtNodeComponent.update &&
            divElement
          ) {
            lookAtNodeComponent.update(
              lookAtNodeComponent,
              points.beginX,
              points.beginY,
              divElement
            );
          }
        }
      });
    }
    return true;
  };
  // nodeComponent.x = startX;
  // nodeComponent.y = startY;
  // nodeComponent.width = width;
  // nodeComponent.height = height;

  divElement.x = startX;
  divElement.y = startY;
  divElement.width = width;
  divElement.height = height;

  //const bcPerf = performance.now();

  // const observer = new IntersectionObserver((entries) => {
  //   for (const entry of entries) {
  //     const bounds = entry.boundingClientRect;

  //     const { scale } = getCamera();
  //     divElement.width = bounds.width / scale;
  //     divElement.height = bounds.height / scale - 20;
  //     points.width = bounds.width / scale;
  //     points.height = bounds.height / scale - 20;
  //     if (divElement && divElement.update) {
  //       divElement.update(divElement, startX, startY, divElement);
  //     }
  //   }

  //   observer.disconnect();
  // });
  // observer.observe(astElement?.domElement as unknown as HTMLElement);

  const astElementSize = (
    astElement?.domElement as unknown as HTMLElement
  ).getBoundingClientRect();

  const { scale } = getCamera();
  divElement.width = astElementSize.width / scale;
  divElement.height = astElementSize.height / scale - 20;
  // nodeComponent.width = astElementSize.width / scale;
  // nodeComponent.height = astElementSize.height / scale - 20;
  points.width = astElementSize.width / scale;
  points.height = astElementSize.height / scale - 20;

  // nodeComponent.width = points.width + 20; // 20 is padding !?
  // nodeComponent.height = points.height;

  divElement.update(divElement, startX, startY, divElement);

  return divElement;
};
