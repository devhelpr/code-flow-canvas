/* eslint-disable @typescript-eslint/no-unused-vars */
import { thumbHalfHeight, thumbHalfWidth } from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '../interfaces/element';
import { createEffect, getVisbility, setSelectNode } from '../reactivity';
import { ConnectionControllerType, ThumbType } from '../types';
import { LineType } from '../types/line-type';
import { NodeType } from '../types/node-type';
import { Connection } from './connection';
import { ThumbConnectionController } from './thumb-connection-controller';

export class CubicBezierConnection<T> extends Connection<T> {
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
    controlPoint2X: number,
    controlPoint2Y: number,
    isControlled = false,
    isDashed = false,
    canvasUpdated?: () => void,
    id?: string,
    containerNode?: IRectNodeComponent<T>
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
      controlPoint2X,
      controlPoint2Y,
      pathHiddenElement,
      isDashed,
      undefined,
      canvasUpdated,
      id,
      containerNode
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }
    this.nodeComponent.lineType = LineType.BezierCubic;
    this.nodeComponent.isControlled = isControlled;
    this.nodeComponent.onClick = () => {
      if (this.nodeComponent?.isControlled) {
        return;
      }
      console.log('connection click', this.nodeComponent?.id);
      if (this.nodeComponent) {
        setSelectNode({
          id: this.nodeComponent.id,
          containerNode: this.nodeComponent
            .containerNode as unknown as INodeComponent<unknown>,
        });
      }
    };

    function setPosition(
      element: INodeComponent<T>,
      x: number,
      y: number,
      updateConnection = true
    ) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;

      if (!updateConnection) {
        return;
      }

      // update the connection of this thumb
      if (element.parent && element.parent.update) {
        element.parent.update(
          element.parent,
          x + thumbHalfWidth,
          y + thumbHalfHeight,
          element
        );
      }
    }
    const startPointNode = new ThumbConnectionController<T>(
      canvas.domElement,
      canvas,
      interactionStateMachine,
      this.nodeComponent?.elements,
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
      true
    );
    if (!startPointNode.nodeComponent) {
      throw new Error('startPointNode nodeComponent is undefined');
    }
    startPointNode.nodeComponent.isControlled = isControlled;
    startPointNode.nodeComponent.parent = this.nodeComponent;
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
      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };
    this.nodeComponent.connectionStartNodeThumb = startPointNode.nodeComponent;

    this.svgParent?.domElement.after(startPointNode.nodeComponent.domElement);

    const endPointNode = new ThumbConnectionController<T>(
      canvas.domElement,
      canvas,
      interactionStateMachine,
      this.nodeComponent.elements,
      'end',
      ThumbType.End,
      undefined,
      '#ffff4080',
      endX,
      endY,
      ConnectionControllerType.end,
      NodeType.ConnectionController,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );

    if (!endPointNode.nodeComponent) {
      throw new Error('endPointNode nodeComponent is undefined');
    }
    endPointNode.nodeComponent.isControlled = isControlled;
    endPointNode.nodeComponent.parent = this.nodeComponent;
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
      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };
    this.svgParent?.domElement.after(endPointNode.nodeComponent.domElement);

    this.nodeComponent.connectionEndNodeThumb = endPointNode.nodeComponent;

    createEffect(() => {
      const visibility = getVisbility();

      if (!this.nodeComponent) {
        return;
      }
    });

    this.startPointElement = startPointNode.nodeComponent;
    this.endPointElement = endPointNode.nodeComponent;
  }

  protected override initializeControlPoints() {
    return [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
  }

  protected override setControlPoints(): { x: number; y: number }[] {
    return [
      { x: this.points.cx1, y: this.points.cy1 },
      { x: this.points.cx2, y: this.points.cy2 },
    ];
  }

  protected override updateControlPoints(): void {
    if (this.nodeComponent && this.nodeComponent.controlPoints) {
      if (this.nodeComponent.controlPoints.length === 2) {
        this.nodeComponent.controlPoints[0].x = this.points.cx1;
        this.nodeComponent.controlPoints[0].y = this.points.cy1;
        this.nodeComponent.controlPoints[1].x = this.points.cx2;
        this.nodeComponent.controlPoints[1].y = this.points.cy2;
      }
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
    } C${this.points.cx1 - bbox.x} ${this.points.cy1 - bbox.y} ${
      this.points.cx2 - bbox.x
    } ${this.points.cy2 - bbox.y} ${this.points.endX - bbox.x + endOffsetX} ${
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
      (this.pathHiddenElement?.domElement as HTMLElement).setAttribute(
        'd',
        `M${this.points.beginX + startOffsetX} ${
          this.points.beginY + startOffsetY
        } C${this.points.cx1} ${this.points.cy1} ${this.points.cx2} ${
          this.points.cy2
        }  ${this.points.endX + endOffsetX} ${this.points.endY + endOffsetY}`
      );
    }
  }

  protected override setPath(
    bbox: { x: number; y: number; width: number; height: number },
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ): void {
    const path = `M${this.points.beginX - bbox.x + startOffsetX} ${
      this.points.beginY - bbox.y + startOffsetY
    } C${this.points.cx1 - bbox.x} ${this.points.cy1 - bbox.y} ${
      this.points.cx2 - bbox.x
    } ${this.points.cy2 - bbox.y}  ${this.points.endX - bbox.x + endOffsetX} ${
      this.points.endY - bbox.y + endOffsetY
    }`;

    (this.pathElement?.domElement as HTMLElement).setAttribute('d', path);
    (this.pathTransparentElement?.domElement as HTMLElement).setAttribute(
      'd',
      path
    );
  }
}
