import { transformToCamera } from '../camera';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  CurveType,
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { ThumbType } from '../types';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown } from './events/pointer-events';
import { onCalculateControlPoints as onCalculateCubicBezierControlPoints } from './utils/calculate-control-points';

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

export class Connection<T> {
  nodeComponent?: IConnectionNodeComponent<T>;
  constructor(
    canvasElement: DOMElementNode,
    interactionStateMachine: InteractionStateMachine<T>,
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
    isQuadratic = false,
    isDashed = false,
    onCalculateControlPoints = onCalculateCubicBezierControlPoints,
    canvasUpdated?: () => void,
    id?: string
  ) {
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
        refX: '1.5',
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

    const markerBegin = createNSElement(
      'marker',
      {
        id: 'arrowbegin',
        refX: '2',
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
        d: 'M2,2 L2,2 L0,2 Z', // 'M2,0 L2,4 L0,2 Z',
        stroke: 'white',
        fill: 'white',
      },
      markerBegin.domElement
    );

    this.nodeComponent = createSVGNodeComponent(
      'g',
      {},
      svgParent.domElement,
      undefined,
      undefined,
      id
    ) as unknown as IConnectionNodeComponent<T>;

    if (!this.nodeComponent) throw new Error('nodeComponent is undefined');

    this.nodeComponent.nodeType = 'connection';
    this.nodeComponent.onCalculateControlPoints = onCalculateControlPoints;
    this.nodeComponent.controlPointNodes = [];
    this.nodeComponent.delete = () => {
      svgParent.domElement.remove();
    };

    if (isQuadratic) {
      this.nodeComponent.controlPoints = [
        { x: pathPoints.cx1, y: pathPoints.cy1 },
      ];
    } else {
      this.nodeComponent.controlPoints = [
        { x: pathPoints.cx1, y: pathPoints.cy1 },
        { x: pathPoints.cx2, y: pathPoints.cy2 },
      ];
    }
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
    const dashedStroke = isDashed
      ? {
          'stroke-dasharray': '10,10',
        }
      : undefined;

    pathElement = createNSElement(
      'path',
      {
        class: 'pointer-events-auto',
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
        'marker-start': 'url(#arrowbegin)',
        'marker-end': 'url(#arrow)',
        'stroke-width': 3,
        ...dashedStroke,
        fill: 'transparent',
        pointerdown: (e: PointerEvent) => {
          if (this.nodeComponent?.isControlled) {
            return;
          }
          if (this.nodeComponent) {
            const elementRect = (
              this.nodeComponent.domElement as unknown as
                | HTMLElement
                | SVGElement
            ).getBoundingClientRect();

            const bbox = getBBoxPath();

            const { x, y } = transformToCamera(e.clientX, e.clientY);
            const rectCamera = transformToCamera(elementRect.x, elementRect.y);

            const interactionInfoResult = pointerDown<T>(
              x - rectCamera.x - (pathPoints.beginX - bbox.x - 10),
              y - rectCamera.y - (pathPoints.beginY - bbox.y - 10),
              this.nodeComponent,
              canvasElement,
              interactionStateMachine
            );
            if (interactionInfoResult) {
              interactionInfo = interactionInfoResult;
              isClicking = true;
              isMoving = false;
              (canvasElement as unknown as HTMLElement | SVGElement).append(
                svgParent.domElement
              );

              (canvasElement as unknown as HTMLElement | SVGElement).append(
                this.nodeComponent.connectionStartNodeThumb?.domElement as Node
              );

              (canvasElement as unknown as HTMLElement | SVGElement).append(
                this.nodeComponent.connectionEndNodeThumb?.domElement as Node
              );

              if (this.nodeComponent.controlPointNodes) {
                if (isQuadratic) {
                  (canvasElement as unknown as HTMLElement | SVGElement).append(
                    this.nodeComponent.controlPointNodes[0].domElement as Node
                  );
                } else {
                  (canvasElement as unknown as HTMLElement | SVGElement).append(
                    this.nodeComponent.controlPointNodes[0].domElement as Node
                  );
                  (canvasElement as unknown as HTMLElement | SVGElement).append(
                    this.nodeComponent.controlPointNodes[1].domElement as Node
                  );
                }
              }
              // if (connectionInfo) {
              //   (canvasElement as unknown as HTMLElement | SVGElement).append(
              //     connectionInfo.controllers?.start.domElement
              //   );
              //   (canvasElement as unknown as HTMLElement | SVGElement).append(
              //     connectionInfo.controllers?.end.domElement
              //   );

              //   if (isQuadratic) {
              //     (canvasElement as unknown as HTMLElement | SVGElement).append(
              //       connectionInfo.controllers?.controlPoint.domElement
              //     );
              //   } else {
              //     (canvasElement as unknown as HTMLElement | SVGElement).append(
              //       connectionInfo.controllers?.controlPoint1.domElement
              //     );

              //     (canvasElement as unknown as HTMLElement | SVGElement).append(
              //       connectionInfo.controllers?.controlPoint2.domElement
              //     );
              //   }
              // }
            }
          }
        },
      },
      this.nodeComponent.domElement
    );

    if (!pathElement) throw new Error('pathElement is undefined');

    elements.set(this.nodeComponent.id, this.nodeComponent);
    this.nodeComponent.elements.set(pathElement.id, pathElement);

    this.nodeComponent.update = (
      incomingComponent?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      // console.log(
      //   'update connection',
      //   incomingComponent?.nodeType,
      //   actionComponent?.nodeType
      // );
      const connection =
        incomingComponent as unknown as IConnectionNodeComponent<T>;
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
      let updateThumbs = false;

      if (
        !incomingComponent ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        // needed for updating without using parameters (...update() )
        if (this.nodeComponent?.startNode) {
          const start = onCalculateControlPoints(
            this.nodeComponent?.startNode,
            ControlAndEndPointNodeType.start,
            this.nodeComponent.startNodeThumb?.thumbType ??
              ThumbType.StartConnectorCenter,
            this.nodeComponent.startNodeThumb?.thumbIndex,
            this.nodeComponent.endNode,
            this.nodeComponent.startNodeThumb?.thumbOffsetY ?? 0,
            this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
            this.nodeComponent.endNodeThumb
          );

          points.beginX = start.x;
          points.beginY = start.y;
          points.cx1 = start.cx;
          points.cy1 = start.cy;
          skipChecks = true;
          updateThumbs = true;
        }

        if (this.nodeComponent?.endNode) {
          const end = onCalculateControlPoints(
            this.nodeComponent?.endNode,
            ControlAndEndPointNodeType.end,
            this.nodeComponent.endNodeThumb?.thumbType ??
              ThumbType.EndConnectorCenter,
            this.nodeComponent.endNodeThumb?.thumbIndex,
            this.nodeComponent.startNode,
            this.nodeComponent.endNodeThumb?.thumbOffsetY ?? 0,
            this.nodeComponent.endNodeThumb?.thumbControlPointDistance,
            this.nodeComponent.startNodeThumb
          );
          points.endX = end.x;
          points.endY = end.y;
          points.cx2 = end.cx;
          points.cy2 = end.cy;
          skipChecks = true;

          updateThumbs = true;
        } else {
          points.cx2 = points.endX - 150;
          points.cy2 = points.endY;
          skipChecks = true;

          updateThumbs = true;
        }

        if (!updateThumbs) {
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
          connection.startNode &&
          actionComponent.id === connection.startNode.id
        ) {
          const start = onCalculateControlPoints(
            actionComponent as unknown as IRectNodeComponent<T>,
            ControlAndEndPointNodeType.start,
            connection.startNodeThumb?.thumbType ??
              ThumbType.StartConnectorCenter,
            connection.startNodeThumb?.thumbIndex,
            connection.endNode,
            connection.startNodeThumb?.thumbOffsetY ?? 0,
            connection.startNodeThumb?.thumbControlPointDistance,
            connection.endNodeThumb
          );
          points.beginX = start.x;
          points.beginY = start.y;
          points.cx1 = start.cx;
          points.cy1 = start.cy;
        } else if (
          connection.endNode &&
          actionComponent.id === connection.endNode.id
        ) {
          const end = onCalculateControlPoints(
            actionComponent as unknown as IRectNodeComponent<T>,
            ControlAndEndPointNodeType.end,
            connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
            connection.endNodeThumb?.thumbIndex,
            connection.startNode,
            connection.endNodeThumb?.thumbOffsetY ?? 0,
            connection.endNodeThumb?.thumbControlPointDistance,
            connection.startNodeThumb
          );
          points.endX = end.x;
          points.endY = end.y;
          points.cx2 = end.cx;
          points.cy2 = end.cy;
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

        if (this.nodeComponent?.startNode) {
          // nodeComponent.startNode?.update?.(
          //   nodeComponent.startNode,
          //   points.beginX,
          //   points.beginY,
          //   actionComponent
          // );

          const circle =
            this.nodeComponent.connectionStartNodeThumb?.getThumbCircleElement?.();
          (circle as unknown as HTMLElement)?.classList?.remove?.(
            'pointer-events-auto'
          );
          (circle as unknown as HTMLElement)?.classList?.remove?.(
            'pointer-events-none'
          );
        }

        if (this.nodeComponent?.endNode) {
          // nodeComponent.endNode?.update?.(
          //   nodeComponent.endNode,
          //   points.endX,
          //   points.endY,
          //   actionComponent
          // );
          const circle =
            this.nodeComponent.connectionEndNodeThumb?.getThumbCircleElement?.();
          (circle as unknown as HTMLElement)?.classList?.remove?.(
            'pointer-events-auto'
          );
          (circle as unknown as HTMLElement)?.classList?.remove?.(
            'pointer-events-none'
          );
        }
        if (this.nodeComponent?.controlPointNodes?.length) {
          this.nodeComponent.controlPointNodes[0].setVisibility?.(
            !(this.nodeComponent?.startNode || this.nodeComponent?.endNode)
          );
          this.nodeComponent.controlPointNodes[0].update?.(
            this.nodeComponent.controlPointNodes[0],
            points.cx1,
            points.cy1,
            actionComponent
          );
          if (!isQuadratic) {
            this.nodeComponent.controlPointNodes[1].setVisibility?.(
              !(this.nodeComponent?.startNode || this.nodeComponent?.endNode)
            );
            this.nodeComponent.controlPointNodes[1].update?.(
              this.nodeComponent.controlPointNodes[1],
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

            points.cx2 = points.endX - 150;
            points.cy2 = points.endY;
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

      if (this.nodeComponent && !this.nodeComponent.controlPoints) {
        if (isQuadratic) {
          this.nodeComponent.controlPoints = [{ x: 0, y: 0 }];
        } else {
          this.nodeComponent.controlPoints = [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ];
        }
      }

      if (this.nodeComponent && this.nodeComponent.controlPoints) {
        if (isQuadratic) {
          if (this.nodeComponent.controlPoints.length === 1) {
            this.nodeComponent.controlPoints[0].x = points.cx1;
            this.nodeComponent.controlPoints[0].y = points.cy1;
          }
        } else if (this.nodeComponent.controlPoints.length === 2) {
          this.nodeComponent.controlPoints[0].x = points.cx1;
          this.nodeComponent.controlPoints[0].y = points.cy1;
          this.nodeComponent.controlPoints[1].x = points.cx2;
          this.nodeComponent.controlPoints[1].y = points.cy2;
        }
      }

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

      if (updateThumbs && this.nodeComponent) {
        this.nodeComponent.connectionStartNodeThumb?.update?.(
          this.nodeComponent.connectionStartNodeThumb,
          points.beginX,
          points.beginY,
          this.nodeComponent
        );

        this.nodeComponent.connectionEndNodeThumb?.update?.(
          this.nodeComponent.connectionEndNodeThumb,
          points.endX,
          points.endY,
          this.nodeComponent
        );

        if (this.nodeComponent?.controlPointNodes?.length) {
          this.nodeComponent.controlPointNodes?.[0].setVisibility?.(false);
          this.nodeComponent.controlPointNodes?.[0].update?.(
            this.nodeComponent.controlPointNodes?.[0],
            points.cx1,
            points.cy1,
            this.nodeComponent
          );
        }

        if (!isQuadratic) {
          if (this.nodeComponent?.controlPointNodes?.length) {
            this.nodeComponent.controlPointNodes?.[1].setVisibility?.(false);
          }
          this.nodeComponent.controlPointNodes?.[1].update?.(
            this.nodeComponent.controlPointNodes?.[1],
            points.cx1,
            points.cy1,
            this.nodeComponent
          );
        }
        this.nodeComponent.x = points.beginX;
        this.nodeComponent.y = points.beginY;
        this.nodeComponent.endX = points.endX;
        this.nodeComponent.endY = points.endY;

        //console.log('connection update', nodeComponent);
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

    this.nodeComponent.updateEnd = () => {
      if (canvasUpdated) {
        canvasUpdated();
      }
    };

    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;
    this.nodeComponent.endX = 0;
    this.nodeComponent.endY = 0;
  }
}
