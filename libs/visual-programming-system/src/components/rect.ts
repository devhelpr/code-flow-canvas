/* eslint-disable @typescript-eslint/no-unused-vars */
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  CurveType,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  IThumb,
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
  disableInteraction?: boolean
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
  const rectNode: INodeComponent<T> = rectPathInstance.nodeComponent;

  // rectNode.nodeType is "shape" .. if thats changed then the dragging of nodes doesnt work anymore
  rectNode.shapeType = 'rect';

  widthHelper = rectNode.width ?? 0;
  heightHelper = rectNode.height ?? 0;

  rectNode.onCalculateControlPoints = (
    nodeType: ControlAndEndPointNodeType,
    curveType: CurveType,
    thumbType: ThumbType,
    index?: number,
    connectedNode?: INodeComponent<T>,
    thumbOffsetY?: number,
    controlPointDistance?: number
  ) => {
    if (nodeType === ControlAndEndPointNodeType.start) {
      const xDistance = Math.abs(
        rectNode.x + (rectNode.width ?? 0) - (connectedNode?.x ?? 0)
      );
      const yDistance = Math.abs(
        rectNode.y + (rectNode.height ?? 0) - (connectedNode?.y ?? 0)
      );

      let x =
        rectNode.x +
        calculateConnectorX(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        );
      let y =
        rectNode.y +
        calculateConnectorY(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        ) +
        (thumbOffsetY ?? 0);

      if (thumbType === ThumbType.StartConnectorBottom) {
        y = y + thumbRadius * 3;

        return {
          x: x,
          y: y,
          cx: x,
          cy: y + (controlPointDistance ?? rectNode.height ?? 0) + 50,
          nodeType,
        };
      } else if (thumbType === ThumbType.StartConnectorTop) {
        const yDistance = Math.abs(
          rectNode.y - (rectNode.height ?? 0) - (connectedNode?.y ?? 0)
        );

        y = y - thumbRadius * 3;
        return {
          x: x,
          y: y,
          cx: x,
          cy: y - (controlPointDistance ?? rectNode.height ?? 0) - 50,
          nodeType,
        };
      }

      x = x + thumbRadius * 3;
      const cx = x + (controlPointDistance ?? (rectNode.width || 0)) + 50;

      return {
        x: x,
        y: y,
        cx: cx,
        cy: y,
        nodeType,
      };
    }
    if (nodeType === ControlAndEndPointNodeType.end) {
      const xDistance = Math.abs(
        rectNode.x - (connectedNode?.x ?? 0) + (connectedNode?.width ?? 0)
      );
      const yDistance = Math.abs(
        rectNode.y - (connectedNode?.y ?? 0) + (connectedNode?.height ?? 0)
      );

      let x =
        rectNode.x +
        calculateConnectorX(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        );

      let y =
        rectNode.y +
        calculateConnectorY(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        ) +
        (thumbOffsetY ?? 0);

      if (thumbType === ThumbType.EndConnectorTop) {
        y = y - thumbRadius * 3;
        return {
          x: x,
          y: y,
          cx: x,
          cy: y - (controlPointDistance ?? rectNode.height ?? 0) - 50,
          nodeType,
        };
      }

      x = x - thumbRadius * 3;

      const cx = x - (controlPointDistance ?? (rectNode.width || 0)) - 50;
      return {
        x: x,
        y: y,
        cx: cx,
        cy: y,
        nodeType,
      };
    }

    throw new Error('Not supported');
  };

  function setPosition(
    element: INodeComponent<T>,
    x: number,
    y: number,
    followRelations = true,
    updatePosition = true
  ) {
    if (!followRelations) {
      if (updatePosition) {
        (
          element.domElement as unknown as HTMLElement | SVGElement
        ).style.transform = `translate(${x}px, ${y}px)`;
        element.x = x;
        element.y = y;
      }
      return;
    }

    let doPosition = true;
    element.components.forEach((componentRelation) => {
      if (
        componentRelation.type === NodeComponentRelationType.self ||
        componentRelation.type === NodeComponentRelationType.controller ||
        componentRelation.type === NodeComponentRelationType.controllerTarget
      ) {
        if (componentRelation.update) {
          if (
            !componentRelation.update(
              componentRelation.component,
              x,
              y,
              element
            )
          ) {
            doPosition = false;
          }
        }
      }
    });
  }

  const startPointElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.TopLeft,
    '#ff000080',
    thumbOffsetX,
    thumbOffsetY,
    'begin',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction
  );

  startPointElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape');
    return true;
  };

  const rightTopPointElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.TopRight,
    '#ffff0080',
    thumbOffsetX + widthHelper, //startX + width,
    thumbOffsetY, //startY,
    'rightTop',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction
  );
  rightTopPointElement.update = (
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
  const leftBottomElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.BottomLeft,
    '#00ff00',
    thumbOffsetX, //startX,
    thumbOffsetY + heightHelper, //startY + height,
    'leftBottom',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction
  );
  leftBottomElement.update = (
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
  const rightBottomElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.BottomRight,
    '#0000ff',
    '100%', //thumbOffsetX + widthHelper,
    '100%', //thumbOffsetY + heightHelper,
    'rightBottom',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction
  );
  rightBottomElement.update = (
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

  const onCanReceiveDroppedComponent = (
    thumbNode: INodeComponent<T>,
    component: INodeComponent<T>
  ) => {
    // check for 'begin' or 'end' specifier which are the drag handlers of the connection/path
    // (not to be confused with the resize handlers)
    return (
      ((component &&
        component.parent &&
        thumbNode.thumbConnectionType === ThumbConnectionType.end &&
        component.specifier === 'end') ||
        (component &&
          component.parent &&
          thumbNode.thumbConnectionType === ThumbConnectionType.start &&
          component.specifier === 'begin')) ??
      false
    );
  };

  const onReceiveDroppedComponent = (
    thumbNode: INodeComponent<T>,
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
      let nodeReference = rectNode;
      if (component.specifier === 'begin') {
        previousConnectedNodeId = component.parent.startNode?.id ?? '';
        component.parent.startNode = rectNode;
        component.parent.startNodeThumb = thumbNode;
      } else {
        previousConnectedNodeId = component.parent.endNode?.id ?? '';
        component.parent.endNode = rectNode;
        component.parent.endNodeThumb = thumbNode;
        if (component.parent.startNode) {
          // use start node as reference for the curve's begin point
          nodeReference = component.parent.startNode;
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
      rectNode.connections?.push(component.parent);

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
          if (component.parent.endNode) {
            component.parent.update(
              component.parent,
              nodeReference.x,
              nodeReference.y,
              component.parent.endNode
            );
          }
        } else {
          if (component.parent.startNode) {
            component.parent.update(
              component.parent,
              nodeReference.x,
              nodeReference.y,
              component.parent.startNode
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
        disableInteraction
      );

      thumbConnectorElement.pathName = thumb.pathName;
      thumbConnectorElement.isControlled = true;
      thumbConnectorElement.isConnectPoint = true;
      thumbConnectorElement.thumbConnectionType = thumb.connectionType;
      thumbConnectorElement.thumbOffsetY = thumb.offsetY ?? 0;
      thumbConnectorElement.thumbControlPointDistance =
        thumb.controlPointDistance;

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

  startPointElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.controllerTarget,
    update: (
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
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  rightTopPointElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.controllerTarget,
    update: (
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
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  leftBottomElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.connection,
  });
  leftBottomElement.components.push(
    {
      component: rectNode,
      type: NodeComponentRelationType.connection,
    },
    {
      component: rectNode,
      type: NodeComponentRelationType.controllerTarget,
      update: (
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

        if (component.update) {
          return component.update(component, x, y, actionComponent);
        }
        return true;
      },
    }
  );

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
      start: startPointElement,
      rightTop: rightTopPointElement,
      leftBottom: leftBottomElement,
      rightBottom: rightBottomElement,
      thumbConnectors: [...thumbConnectors],
    },
  });
  rightBottomElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.controllerTarget,
    update: (
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
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  rectNode.onClick = () => {
    console.log('CLICKED ON RECT', rectNode.id);
    setSelectNode(rectNode.id);
  };
  rectNode.connections = [];

  createEffect(() => {
    //const selectedNode = getSelectedNode();
    const visibility = getVisbility(); // && selectedNode && selectedNode === rectNode.id;

    // console.log(
    //   'VISIBILITY',
    //   getVisbility(),
    //   rectNode.id,
    //   selectedNode,
    //   visibility
    // );

    (startPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (rightTopPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (rightBottomElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (leftBottomElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
  });

  return {
    nodeComponent: rectNode,
    setStartPoint: (x: number, y: number) => {
      if (startPointElement.update) {
        startPointElement.update(startPointElement, x, y, startPointElement);
      }
    },
    setRightTopPoint: (x: number, y: number) => {
      if (rightTopPointElement.update) {
        rightTopPointElement.update(
          rightTopPointElement,
          x,
          y,
          rightTopPointElement
        );
      }
    },
    setLeftBottomPoint: (x: number, y: number) => {
      if (leftBottomElement.update) {
        leftBottomElement.update(leftBottomElement, x, y, leftBottomElement);
      }
    },
    setRightBottomPoint: (x: number, y: number) => {
      if (rightBottomElement.update) {
        rightBottomElement.update(rightBottomElement, x, y, rightBottomElement);
      }
    },
    resize: (width?: number) => {
      rectPathInstance.resize(width);
    },
  };
};
