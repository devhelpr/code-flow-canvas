/* eslint-disable @typescript-eslint/no-unused-vars */
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IThumbNodeComponent,
} from '../interfaces/element';
import {
  createEffect,
  getVisbility,
  getSelectedNode,
  setSelectNode,
} from '../reactivity';
import { ThumbType } from '../types';
import { LineType } from '../types/line-type';
import { Connection } from './connection';
import { createConnectionSVGElement } from './connection-svg-element';
import { ThumbNode } from './thumb';

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
    id?: string
  ) {
    super(
      canvas.domElement,
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
      false,
      isDashed,
      undefined,
      canvasUpdated,
      id
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
      setSelectNode(this.nodeComponent?.id);
    };

    function setPosition(
      element: INodeComponent<T>,
      x: number,
      y: number,
      followRelations = true
    ) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;

      if (!followRelations) {
        return;
      }

      // update the connection of this thumb
      if (element.parent && element.parent.update) {
        element.parent.update(element.parent, x, y, element);
      }
    }
    const startPointNode = new ThumbNode<T>(
      canvas.domElement,
      interactionStateMachine,
      this.nodeComponent?.elements,
      'start',
      ThumbType.Start,
      '#ff000080',
      startX,
      startY,
      'begin',
      undefined,
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
    startPointNode.nodeComponent.update = (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }
      setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
      return true;
    };
    this.nodeComponent.connectionStartNodeThumb = startPointNode.nodeComponent;

    const endPointNode = new ThumbNode<T>(
      canvas.domElement,
      interactionStateMachine,
      this.nodeComponent.elements,
      'end',
      ThumbType.End,
      '#ffff4080',
      endX,
      endY,
      'end',
      undefined,
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
    endPointNode.nodeComponent.update = (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }
      setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
      return true;
    };
    this.nodeComponent.connectionEndNodeThumb = endPointNode.nodeComponent;

    const controlPoint1Node = new ThumbNode<T>(
      canvas.domElement,
      interactionStateMachine,
      this.nodeComponent.elements,
      'controlpoint1',
      ThumbType.ControlPoint,
      '#00ff00',
      controlPoint1X,
      controlPoint1Y,
      'c1'
    );
    if (!controlPoint1Node.nodeComponent) {
      throw new Error('controlPoint1Node nodeComponent is undefined');
    }
    controlPoint1Node.nodeComponent.isControlled = isControlled;
    controlPoint1Node.nodeComponent.parent = this.nodeComponent;
    controlPoint1Node.nodeComponent.update = (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }

      setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
      return true;
    };
    const controlPoint2Node = new ThumbNode<T>(
      canvas.domElement,
      interactionStateMachine,
      this.nodeComponent.elements,
      'controlpoint2',
      ThumbType.ControlPoint,
      '#0000ff',
      controlPoint2X,
      controlPoint2Y,
      'c2'
    );

    if (!controlPoint2Node.nodeComponent) {
      throw new Error('controlPoint2Node nodeComponent is undefined');
    }

    controlPoint2Node.nodeComponent.isControlled = isControlled;
    controlPoint2Node.nodeComponent.parent = this.nodeComponent;
    controlPoint2Node.nodeComponent.update = (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }
      setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
      return true;
    };

    this.nodeComponent.controlPointNodes?.push(controlPoint2Node.nodeComponent);
    this.nodeComponent.controlPointNodes?.push(controlPoint2Node.nodeComponent);

    createEffect(() => {
      //const selectedNode = getSelectedNode();
      const visibility = getVisbility(); // && selectedNode && selectedNode === connection.id;
      //console.log('connection bezier visibility', visibility, connection.id);
      if (!controlPoint1Node.nodeComponent) {
        return;
      }
      if (!controlPoint2Node.nodeComponent) {
        return;
      }

      (
        controlPoint1Node.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
      (
        controlPoint2Node.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
      if (!this.nodeComponent) {
        return;
      }
      if (!(this.nodeComponent.startNode || this.nodeComponent.endNode)) {
        (
          controlPoint1Node.nodeComponent.domElement as unknown as SVGElement
        ).style.display = visibility ? 'block' : 'none';
        (
          controlPoint2Node.nodeComponent.domElement as unknown as SVGElement
        ).style.display = visibility ? 'block' : 'none';
      }
    });

    this.startPointElement = startPointNode.nodeComponent;
    this.endPointElement = endPointNode.nodeComponent;
  }
}
