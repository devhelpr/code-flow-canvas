/* eslint-disable @typescript-eslint/no-unused-vars */
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  CurveType,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
  NodeComponentRelationType,
  ThumbConnectionType,
} from '../interfaces/element';
import {
  createEffect,
  getSelectedNode,
  getVisbility,
  setSelectNode,
} from '../reactivity';
import { ThumbType } from '../types';
import { ShapeType } from '../types/shape-type';
import { createRectPathSVGElement } from './rect-path-svg-element';
import { createThumbSVGElement } from './thumb-svg-element';
import {
  calculateConnectorX,
  calculateConnectorY,
  thumbHeight,
  thumbInitialPosition,
  thumbOffsetX,
  thumbOffsetY,
  thumbPosition,
  thumbRadius,
  thumbWidth,
} from './utils/calculate-connector-thumbs';
import { setPosition } from './utils/set-position';

export const createRect = <T>(
  canvas: INodeComponent<T>,
  interactionStateMachine: InteractionStateMachine<T>,
  pathHiddenElement: IElementNode<T>,
  elements: ElementNodeMap<T>,
  startX: number,
  startY: number,
  width: number,
  height: number,
  text?: string,
  shapeType?: ShapeType,
  thumbs?: IThumb[],
  markup?: string | INodeComponent<T>,
  layoutProperties?: {
    classNames?: string;
  },
  hasStaticWidthHeight?: boolean,
  disableInteraction?: boolean,
  disableManualResize?: boolean
) => {
  let widthHelper = width;
  let heightHelper = height;

  const rectPathInstance = createRectPathSVGElement<T>(
    canvas.domElement,
    interactionStateMachine,
    elements,
    startX,
    startY,
    widthHelper,
    heightHelper,
    pathHiddenElement,
    text,
    shapeType,
    thumbOffsetX,
    thumbOffsetY,
    (thumbType: ThumbType, index?: number, offsetY?: number) => {
      return thumbPosition<T>(rectNode, thumbType, index, offsetY);
    },
    markup,
    layoutProperties,
    hasStaticWidthHeight,
    disableInteraction
  );
  const rectNode: IRectNodeComponent<T> = rectPathInstance.nodeComponent;

  // rectNode.nodeType is "shape" .. if thats changed then the dragging of nodes doesnt work anymore
  rectNode.shapeType = 'rect';

  widthHelper = rectNode.width ?? 0;
  heightHelper = rectNode.height ?? 0;

  const onCanReceiveDroppedComponent = (
    thumbNode: IThumbNodeComponent<T>,
    component: INodeComponent<T>,
    receivingThumbNode: IThumbNodeComponent<T>
  ) => {
    // check for 'begin' or 'end' specifier which are the drag handlers of the connection/path
    // (not to be confused with the resize handlers)

    if (
      component &&
      component.parent &&
      thumbNode.thumbConnectionType === ThumbConnectionType.end &&
      component.specifier === 'end'
    ) {
      // thumbNode is the thumb that is being dropped on
      // component.parent.startNodeThumb is the thumb that is being dragged from

      console.log(
        'DROPPED ON RIGHT THUMB',
        thumbNode.thumbConstraint,
        (component.parent as unknown as IConnectionNodeComponent<T>)
          .startNodeThumb?.thumbConstraint
      );
      if (
        thumbNode.thumbConstraint !==
        (component.parent as unknown as IConnectionNodeComponent<T>)
          .startNodeThumb?.thumbConstraint
      ) {
        return false;
      }
      return true;
    } else if (
      component &&
      component.parent &&
      thumbNode.thumbConnectionType === ThumbConnectionType.start &&
      component.specifier === 'begin'
    ) {
      // thumbNode is the thumb that is being dropped on
      // component.parent.endNodeThumb is the thumb that is being dragged from

      console.log(
        'DROPPED ON LEFT THUMB',
        thumbNode.thumbConstraint,
        (component.parent as unknown as IConnectionNodeComponent<T>)
          .endNodeThumb?.thumbConstraint
      );
      if (
        thumbNode.thumbConstraint !==
        (component.parent as unknown as IConnectionNodeComponent<T>)
          .endNodeThumb?.thumbConstraint
      ) {
        return false;
      }
      return true;
    }
    return false;
  };

  const onReceiveDroppedComponent = (
    thumbNode: IThumbNodeComponent<T>,
    component: INodeComponent<T>
  ) => {
    // component is not the path itself but it is the drag-handle of a path (the parent of that handle is the path node-component)
    console.log(
      'DROPPED ON RIGHT THUMB',
      thumbNode,
      component.id,
      component.parent,
      component.specifier,
      rectNode.x,
      rectNode.y,
      rectNode.id
    );

    let previousConnectedNodeId = '';

    // check for 'begin' or 'end' specifier which are the drag handlers of the connection/path
    // (not to be confused with the resize handlers)
    if (
      (component &&
        component.parent &&
        thumbNode.thumbConnectionType === ThumbConnectionType.end &&
        component.specifier === 'end') ||
      (component &&
        component.parent &&
        thumbNode.thumbConnectionType === ThumbConnectionType.start &&
        component.specifier === 'begin')
    ) {
      const parentConnection =
        component.parent as unknown as IConnectionNodeComponent<T>;
      let nodeReference = rectNode;
      if (component.specifier === 'begin') {
        previousConnectedNodeId = parentConnection.startNode?.id ?? '';
        parentConnection.startNode = rectNode;
        parentConnection.startNodeThumb = thumbNode;
      } else {
        previousConnectedNodeId = parentConnection.endNode?.id ?? '';
        parentConnection.endNode = rectNode;
        parentConnection.endNodeThumb = thumbNode;
        if (parentConnection.startNode) {
          // use start node as reference for the curve's begin point
          nodeReference = parentConnection.startNode;
        }
      }
      component.parent.isControlled = true;

      // remove the previous connected node from the connections of the rectNode
      rectNode.connections = (rectNode.connections ?? []).filter(
        (connection) => {
          return (
            connection.startNode?.id !== previousConnectedNodeId &&
            connection.endNode?.id !== previousConnectedNodeId
          );
        }
      );
      rectNode.connections?.push(parentConnection);

      const index = component.parent.components.findIndex((c) =>
        component.specifier === 'begin'
          ? c.type === NodeComponentRelationType.start
          : c.type === NodeComponentRelationType.end
      );
      if (index > -1) {
        component.parent.components.splice(index, 1);
      }
      component.parent.components.push({
        type:
          component.specifier === 'begin'
            ? NodeComponentRelationType.start
            : NodeComponentRelationType.end,
        component: rectNode,
      } as unknown as INodeComponentRelation<T>);

      // Update both sides of the connection to get a correct curve
      if (component.parent.update) {
        component.parent.update(
          component.parent,
          nodeReference.x,
          nodeReference.y,
          rectNode
        );
        if (component.specifier === 'begin') {
          if (parentConnection.endNode) {
            component.parent.update(
              component.parent,
              nodeReference.x,
              nodeReference.y,
              parentConnection.endNode
            );
          }
        } else {
          if (parentConnection.startNode) {
            component.parent.update(
              component.parent,
              nodeReference.x,
              nodeReference.y,
              parentConnection.startNode
            );
          }
        }
      }
    }
  };

  const onEndThumbConnectorElementupdate = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape', false);
    return true;
  };

  const thumbConnectors: INodeComponent<T>[] = [];

  if (thumbs) {
    thumbs.forEach((thumb, index) => {
      const { x, y } = thumbInitialPosition(
        rectNode,
        thumb.thumbType,
        thumb.thumbIndex ?? 0,
        thumb.offsetY ?? 0
      );

      const thumbConnectorElement = createThumbSVGElement(
        rectNode.domElement,
        interactionStateMachine,
        rectNode.elements,
        thumb.thumbType,
        thumb.color ?? '#008080',
        x,
        y,
        `thumb-connector-${index}`,
        'connector',
        `top-0 left-0 origin-center ${
          thumb.hidden ? 'invisible pointer-events-none' : ''
        }`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        thumb.thumbIndex ?? 0,
        true,
        canvas,
        elements,
        rectNode,
        pathHiddenElement,
        disableInteraction,
        thumb.label
      );

      thumbConnectorElement.thumbName = thumb.name;
      thumbConnectorElement.pathName = thumb.pathName;
      thumbConnectorElement.isControlled = true;
      thumbConnectorElement.isConnectPoint = true;
      thumbConnectorElement.thumbConnectionType = thumb.connectionType;
      thumbConnectorElement.thumbOffsetY = thumb.offsetY ?? 0;
      thumbConnectorElement.thumbControlPointDistance =
        thumb.controlPointDistance;
      thumbConnectorElement.thumbLinkedToNode = rectNode;
      thumbConnectorElement.thumbConstraint = thumb.thumbConstraint;

      if (!disableInteraction) {
        thumbConnectorElement.onCanReceiveDroppedComponent =
          onCanReceiveDroppedComponent;
        thumbConnectorElement.onReceiveDroppedComponent =
          onReceiveDroppedComponent;
      }
      thumbConnectorElement.update = onEndThumbConnectorElementupdate;

      thumbConnectors.push(thumbConnectorElement);
    });
  }
  rectNode.thumbConnectors = thumbConnectors;

  rectNode.components.push({
    component: rectNode,
    type: NodeComponentRelationType.self,
    update: (component?: INodeComponent<T>, x?: number, y?: number) => {
      return true;
    },
    commitUpdate: (component: INodeComponent<T>, x: number, y: number) => {
      //
    },
    controllers: {
      thumbConnectors: [...thumbConnectors],
    },
  });

  rectNode.onClick = () => {
    console.log('CLICKED ON RECT', rectNode.id);
    setSelectNode(rectNode.id);
  };
  rectNode.connections = [];

  return {
    nodeComponent: rectNode,

    resize: (width?: number) => {
      rectPathInstance.resize(width);
    },
  };
};
