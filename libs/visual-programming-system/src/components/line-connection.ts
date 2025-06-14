/* eslint-disable @typescript-eslint/no-unused-vars */
import { IBaseFlow } from '../canvas-app/base-flow';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ConnectionStartEndPositions,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  ControlAndEndPointNodeType,
} from '../interfaces/element';
import { Theme } from '../interfaces/theme';
import { setSelectNode } from '../reactivity';
import { ConnectionControllerType, NodeType, ThumbType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { LineType } from '../types/line-type';
import { Connection } from './connection';
import { ThumbConnectionController } from './thumb-connection-controller';
import { onQuadraticCalculateControlPoints } from './utils/calculate-quadratic-control-points';
import { pointOnRect } from './utils/intersect-line';
import { intersectionCircleLine } from './utils/vector-math';
import { onGetConnectionToThumbOffset } from './utils/calculate-cubic-control-points';

export class LineConnection<T extends BaseNodeInfo> extends Connection<T> {
  startPointElement: IThumbNodeComponent<T> | undefined;
  endPointElement: IThumbNodeComponent<T> | undefined;

  constructor(
    canvas: INodeComponent<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    pathHiddenElement: IElementNode<T>,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint1X: number,
    controlPoint1Y: number,
    isControlled = false,
    isDashed = false,
    canvasUpdated?: () => void,
    id?: string,
    containerNode?: IRectNodeComponent<T>,
    theme?: Theme,
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void,
    rootElement?: HTMLElement,
    canvasApp?: IBaseFlow<T>
  ) {
    super(
      canvas,
      interactionStateMachine,
      elements,
      startX,
      startY,
      endX,
      endY,
      controlPoint1X,
      controlPoint1Y,
      0,
      0,
      pathHiddenElement,
      isDashed,
      onQuadraticCalculateControlPoints,
      canvasUpdated,
      id,
      containerNode,
      theme,
      setCanvasAction,
      rootElement,
      canvasApp
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }
    this.nodeComponent.lineType = LineType.Straight;
    this.nodeComponent.isControlled = isControlled;
    this.nodeComponent.onClick = () => {
      if (!this.nodeComponent || this.nodeComponent?.isControlled) {
        return;
      }
      console.log('connection click', this.nodeComponent.id);
      if (this.nodeComponent.containerNode) {
        setSelectNode({
          id: this.nodeComponent.id,
          containerNode: this.nodeComponent
            .containerNode as unknown as IRectNodeComponent<BaseNodeInfo>,
        });
      }
    };

    function setPosition(element: INodeComponent<T>, x: number, y: number) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;
    }
    const startPointNode = new ThumbConnectionController<T>(
      canvas.domElement,
      canvas,
      interactionStateMachine,
      this.nodeComponent.elements,
      'start',
      ThumbType.Start,
      undefined,
      '#ff000080',
      startX,
      startY,
      ConnectionControllerType.begin,
      NodeType.ConnectionController,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false, // disableInteraction
      undefined,
      undefined,
      undefined,
      undefined,
      rootElement,
      this,
      this.canvasApp
    );
    if (!startPointNode.nodeComponent) {
      throw new Error('startPointNode.nodeComponent is undefined');
    }

    if (
      this.nodeComponent?.startNode &&
      this.nodeComponent?.startNode?.isThumb
    ) {
      startPointNode.setDisableInteraction();
    } else {
      startPointNode.setEnableInteraction();
    }

    startPointNode.nodeComponent.parent = this.nodeComponent;
    startPointNode.nodeComponent.isControlled = isControlled;
    startPointNode.connectConnection();
    startPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      setPosition(target, x, y);
      return true;
    };
    this.svgParent?.domElement.after(startPointNode.nodeComponent.domElement);

    const endPointNode = new ThumbConnectionController<T>(
      canvas.domElement,
      canvas,
      interactionStateMachine,
      this.nodeComponent.elements,
      'end',
      ThumbType.End,
      undefined,
      '#ff000080',
      endX,
      endY,
      ConnectionControllerType.end,
      NodeType.ConnectionController,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      rootElement,
      this,
      this.canvasApp
    );
    if (!endPointNode.nodeComponent) {
      throw new Error('endPointNode.nodeComponent is undefined');
    }
    if (this.nodeComponent?.endNode && this.nodeComponent?.endNode?.isThumb) {
      endPointNode.setDisableInteraction();
    } else {
      endPointNode.setEnableInteraction();
    }

    endPointNode.nodeComponent.parent = this.nodeComponent;
    endPointNode.nodeComponent.isControlled = isControlled;
    endPointNode.connectConnection();
    endPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      setPosition(target, x, y);
      return true;
    };
    this.svgParent?.domElement.after(endPointNode.nodeComponent.domElement);

    this.nodeComponent.connectionStartNodeThumb = startPointNode.nodeComponent;
    this.nodeComponent.connectionEndNodeThumb = endPointNode.nodeComponent;

    // createEffect(() => {
    //   const visibility = getVisbility(); //&& selectedNode && selectedNode === connection.id;
    //   if (!startPointNode.nodeComponent || !endPointNode.nodeComponent) {
    //     return;
    //   }
    //   (
    //     startPointNode.nodeComponent.domElement as unknown as SVGElement
    //   ).style.display = visibility ? 'block' : 'none';
    //   (
    //     endPointNode.nodeComponent.domElement as unknown as SVGElement
    //   ).style.display = visibility ? 'block' : 'none';
    // });

    this.startPointElement = startPointNode.nodeComponent;
    this.endPointElement = endPointNode.nodeComponent;
  }

  getLinePath(
    bbox: { x: number; y: number },
    startOffsetX: number,
    startOffsetY: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const { xStart, yStart, xEnd, yEnd } = getLinePoints(
      this.nodeComponent!,
      bbox,
      startOffsetX,
      startOffsetY,
      x1,
      y1,
      x2,
      y2
    );
    return {
      path: `M${xStart} ${yStart} ${xEnd} ${yEnd}`,
      startX: xStart,
      startY: yStart,
      endX: xEnd,
      endY: yEnd,
    };
  }

  protected override initializeControlPoints() {
    return [{ x: 0, y: 0 }];
  }

  protected override setControlPoints(): { x: number; y: number }[] {
    return [{ x: this.points.cx1, y: this.points.cy1 }];
  }

  protected override updateControlPoints(): void {
    if (
      this.nodeComponent &&
      this.nodeComponent.controlPoints &&
      this.nodeComponent.controlPoints.length === 1
    ) {
      this.nodeComponent.controlPoints[0].x = this.points.cx1;
      this.nodeComponent.controlPoints[0].y = this.points.cy1;
    }
  }

  protected override getPath(
    bbox: { x: number; y: number; width: number; height: number },
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): string {
    return `M${this.points.beginX - bbox.x + startOffsetX} ${
      this.points.beginY - bbox.y + startOffsetY
    } ${this.points.endX - bbox.x + endOffsetX} ${
      this.points.endY - bbox.y + endOffsetY
    }`;
  }

  protected override setHiddenPath(
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): void {
    if (this.pathHiddenElement) {
      const x1 = this.points.beginX + startOffsetX;
      const y1 = this.points.beginY + startOffsetY;
      const x2 = this.points.endX + endOffsetX;
      const y2 = this.points.endY + endOffsetY;

      const pathInfo = this.getLinePath(
        { x: 0, y: 0 },
        startOffsetX,
        startOffsetY,
        x1,
        y1,
        x2,
        y2
      );

      (this.pathHiddenElement.domElement as HTMLElement).setAttribute(
        'd',
        pathInfo.path
      );
    }
  }

  protected override setPath(
    bbox: { x: number; y: number; width: number; height: number },
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): ConnectionStartEndPositions {
    const x1 = this.points.beginX - bbox.x + startOffsetX;
    const y1 = this.points.beginY - bbox.y + startOffsetY;
    const x2 = this.points.endX - bbox.x + endOffsetX;
    const y2 = this.points.endY - bbox.y + endOffsetY;
    const pathInfo = this.getLinePath(
      bbox,
      startOffsetX,
      startOffsetY,
      x1,
      y1,
      x2,
      y2
    );

    (this.pathElement?.domElement as HTMLElement).setAttribute(
      'd',
      pathInfo.path
    );
    if (this.pathTransparentElement) {
      (this.pathTransparentElement?.domElement as HTMLElement).setAttribute(
        'd',
        pathInfo.path
      );
    }
    return {
      startX: pathInfo.startX + bbox.x,
      startY: pathInfo.startY + bbox.y,
      endX: pathInfo.endX + bbox.x,
      endY: pathInfo.endY + bbox.y,
    };
  }
}

export const getLinePoints = <T extends BaseNodeInfo>(
  nodeComponent: IConnectionNodeComponent<T>,
  bbox: { x: number; y: number },
  startOffsetX: number,
  startOffsetY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const isCircleStart = nodeComponent?.startNode?.isCircle ?? false;
  const isCircleEnd = nodeComponent?.endNode?.isCircle ?? false;

  const spacingAABB = 10;
  const circlePadding = 10;

  let newX1 = x1;
  let newY1 = y1;
  let newX2 = x2;
  let newY2 = y2;

  if (isCircleStart) {
    const circleRadius =
      (nodeComponent?.startNode?.width ?? 100) / 2 + circlePadding;
    const intersection = intersectionCircleLine(
      {
        center: { x: x1, y: y1 },
        radius: circleRadius,
      },
      { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } }
    );
    if (intersection.length > 0) {
      newX1 = intersection[0].x;
      newY1 = intersection[0].y;
    }
  } else if (nodeComponent?.startNode) {
    let xleft = 0;
    let yleft = 0;
    let width = 0;
    let height = 0;
    if (
      !nodeComponent?.startNode?.isThumb &&
      nodeComponent.startNodeThumb?.thumbType === ThumbType.StartConnectorCenter
    ) {
      // Temp solution for connecting to right side of thumb when end node has a thumb of
      // type StartConnectorCenter
      xleft =
        nodeComponent.startNode.x -
        bbox.x +
        //startOffsetX +
        (nodeComponent.startNode.width ?? 0) -
        4; //+
      //spacingAABB;
      //16;
      yleft =
        nodeComponent.startNode.y -
        bbox.y -
        10 +
        (nodeComponent.startNode.height ?? 0) / 2;
      width = 24;
      height = 24;
    } else {
      xleft = nodeComponent.startNode.x - bbox.x + startOffsetX - spacingAABB;
      yleft = nodeComponent.startNode.y - bbox.y + startOffsetY - spacingAABB;
      width = (nodeComponent.startNode.width ?? 0) + spacingAABB * 2;
      height = (nodeComponent.startNode.height ?? 0) + spacingAABB * 2;
    }
    const start = pointOnRect(
      x2,
      y2,
      xleft,
      yleft,
      xleft + width,
      yleft + height,
      false
    );
    if (start) {
      newX1 = start.x;
      newY1 = start.y;
    }
  }

  if (isCircleEnd) {
    const circleRadius =
      (nodeComponent?.endNode?.width ?? 100) / 2 + circlePadding;
    const intersection = intersectionCircleLine(
      {
        center: { x: x2, y: y2 },
        radius: circleRadius,
      },
      { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } }
    );
    if (intersection.length > 0) {
      newX2 = intersection[0].x;
      newY2 = intersection[0].y;
    }
  } else {
    if (nodeComponent?.endNode) {
      let xleft = 0;
      let yleft = 0;
      let width = 0;
      let height = 0;
      if (
        !nodeComponent?.endNode?.isThumb &&
        (nodeComponent.endNodeThumb?.thumbType ===
          ThumbType.EndConnectorCenter ||
          nodeComponent.endNodeThumb?.thumbType === ThumbType.EndConnectorLeft)
      ) {
        // Temp solution for connecting to left side of thumb when end node has a thumb of
        // type EndConnectorCenter

        // const { offsetX: startOffsetX, offsetY: startOffsetY } =
        //         onGetConnectionToThumbOffset(
        //           ControlAndEndPointNodeType.start,
        //           nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
        //         );

        const end = nodeComponent.onCalculateControlPoints(
          nodeComponent.endNode,
          ControlAndEndPointNodeType.end,
          nodeComponent.endNodeThumb?.thumbType ??
            (nodeComponent.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          nodeComponent.endNodeThumb,
          nodeComponent.endNodeThumb?.thumbIndex,
          nodeComponent.startNode,
          nodeComponent.endNodeThumb?.thumbControlPointDistance,
          nodeComponent.startNodeThumb
        );

        const { offsetX: endOffsetX, offsetY: endOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.end,
            nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
          );
        xleft = end.x - bbox.x + endOffsetX + startOffsetX - spacingAABB; //nodeComponent.endNode.x - bbox.x + endOffsetX - spacingAABB; // - 16;
        yleft = end.y - bbox.y - endOffsetY + startOffsetY - spacingAABB; //nodeComponent.endNode.y - bbox.y - endOffsetY;
        // 10 +
        // (nodeComponent.endNode.height ?? 0) / 2;
        width = 24;
        height = 24;
      } else {
        xleft = nodeComponent.endNode.x - bbox.x + startOffsetX - spacingAABB;
        yleft = nodeComponent.endNode.y - bbox.y + startOffsetY - spacingAABB;
        width = (nodeComponent.endNode.width ?? 0) + spacingAABB * 2;
        height = (nodeComponent.endNode.height ?? 0) + spacingAABB * 2;
      }

      const end = pointOnRect(
        x1,
        y1,
        xleft,
        yleft,
        xleft + width,
        yleft + height,
        false
      );
      if (end) {
        newX2 = end.x;
        newY2 = end.y;
      }
    }
  }

  return {
    xStart: newX1,
    yStart: newY1,
    xEnd: newX2,
    yEnd: newY2,
  };
};
