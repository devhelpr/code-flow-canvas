/* eslint-disable @typescript-eslint/no-unused-vars */
import { thumbHalfWidth, thumbHalfHeight } from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '../interfaces/element';
import {
  createEffect,
  getVisbility,
  getSelectedNode,
  setSelectNode,
} from '../reactivity';
import { ConnectionControllerType, NodeType, ThumbType } from '../types';
import { LineType } from '../types/line-type';
import { Connection } from './connection';
import { ThumbNode } from './thumb';
import { onQuadraticCalculateControlPoints } from './utils/calculate-quadratic-control-points';

export class QuadraticBezierConnection<T> extends Connection<T> {
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
    containerNode?: IRectNodeComponent<T>
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
      0,
      0,
      pathHiddenElement,
      true,
      isDashed,
      onQuadraticCalculateControlPoints,
      canvasUpdated,
      id,
      containerNode
    );
    if (!this.nodeComponent) {
      throw new Error('nodeComponent is undefined');
    }
    this.nodeComponent.lineType = LineType.BezierQuadratic;
    this.nodeComponent.isControlled = isControlled;
    this.nodeComponent.onClick = () => {
      if (!this.nodeComponent || this.nodeComponent?.isControlled) {
        return;
      }
      console.log('connection click', this.nodeComponent.id);
      setSelectNode({
        id: this.nodeComponent.id,
        containerNode: this.nodeComponent
          .containerNode as unknown as INodeComponent<unknown>,
      });
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
    const startPointNode = new ThumbNode<T>(
      canvas.domElement,
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
      undefined,
      false // disableInteraction
    );
    if (!startPointNode.nodeComponent) {
      throw new Error('startPointNode.nodeComponent is undefined');
    }
    startPointNode.nodeComponent.parent = this.nodeComponent;
    startPointNode.nodeComponent.isControlled = isControlled;
    startPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }
      if (this.nodeComponent?.startNode) {
        startPointNode.setDisableInteraction();
      }

      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };

    const endPointNode = new ThumbNode<T>(
      canvas.domElement,
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
      true
    );
    if (!endPointNode.nodeComponent) {
      throw new Error('endPointNode.nodeComponent is undefined');
    }
    endPointNode.nodeComponent.parent = this.nodeComponent;
    endPointNode.nodeComponent.isControlled = isControlled;
    endPointNode.nodeComponent.update = (
      target?: INodeComponent<T>,
      x?: number,
      y?: number,
      initiator?: INodeComponent<T>
    ) => {
      if (!target || x === undefined || y === undefined || !initiator) {
        return false;
      }

      if (this.nodeComponent?.endNode) {
        endPointNode.setDisableInteraction();
      }
      setPosition(target, x, y, initiator?.nodeType !== NodeType.Connection);
      return true;
    };
    const controlPoint1Node = new ThumbNode<T>(
      canvas.domElement,
      interactionStateMachine,
      this.nodeComponent.elements,
      'controlpoint',
      ThumbType.ControlPoint,
      undefined,
      '#00ff00',
      controlPoint1X,
      controlPoint1Y,
      ConnectionControllerType.c1,
      NodeType.ConnectionController
    );
    if (!controlPoint1Node.nodeComponent) {
      throw new Error('controlPoint1Node.nodeComponent is undefined');
    }
    controlPoint1Node.nodeComponent.isControlled = isControlled;
    controlPoint1Node.nodeComponent.parent = this.nodeComponent;
    controlPoint1Node.nodeComponent.update = (
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
    this.nodeComponent.controlPointNodes?.push(controlPoint1Node.nodeComponent);
    this.nodeComponent.connectionStartNodeThumb = startPointNode.nodeComponent;
    this.nodeComponent.connectionEndNodeThumb = endPointNode.nodeComponent;

    createEffect(() => {
      //const selectedNode = getSelectedNode();
      const visibility = getVisbility(); //&& selectedNode && selectedNode === connection.id;
      //console.log('connection visibility', visibility, connection.id);
      if (!startPointNode.nodeComponent || !endPointNode.nodeComponent) {
        return;
      }
      if (!controlPoint1Node.nodeComponent) {
        return;
      }
      (
        startPointNode.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
      (
        endPointNode.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
      (
        controlPoint1Node.nodeComponent.domElement as unknown as SVGElement
      ).style.display = visibility ? 'block' : 'none';
    });

    this.startPointElement = startPointNode.nodeComponent;
    this.endPointElement = endPointNode.nodeComponent;
  }
}
