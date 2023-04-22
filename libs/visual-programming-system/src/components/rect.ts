/* eslint-disable @typescript-eslint/no-unused-vars */
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

const thumbRadius = 10;
const thumbWidth = 100;
const thumbHeight = 100;

const thumbOffsetX = -thumbWidth / 2 + thumbRadius;
const thumbOffsetY = -thumbHeight / 2 + thumbRadius;

/*
  in thumbPosition and onCalculateControlPoints the transform of the svg-thumb is taken into account
  ... in calculateConnectorX and calculateConnectorY only the position is calculated
*/
const calculateConnectorX = (
  thumbType: ThumbType,
  width: number,
  height: number,
  index?: number
) => {
  if (
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.StartConnectorRight
  ) {
    return width;
  }

  if (
    thumbType === ThumbType.EndConnectorCenter ||
    thumbType === ThumbType.EndConnectorLeft
  ) {
    return 0;
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return width / 2;
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return width / 2;
  }
  return 0;
};

const calculateConnectorY = (
  thumbType: ThumbType,
  width: number,
  height: number,
  index?: number
) => {
  if (
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.EndConnectorCenter
  ) {
    return height / 2;
  }

  if (
    thumbType === ThumbType.StartConnectorRight ||
    thumbType === ThumbType.EndConnectorLeft
  ) {
    return 30 * (index ?? 0);
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return 0;
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return height;
  }
  return 0;
};

export const thumbPosition = <T>(
  rectNode: INodeComponent<T>,
  thumbType: ThumbType,
  index?: number
) => {
  if (thumbType === ThumbType.TopLeft) {
    return { x: thumbOffsetX, y: thumbOffsetY };
  }
  if (thumbType === ThumbType.TopRight) {
    return { x: thumbOffsetX + (rectNode?.width ?? 0), y: thumbOffsetY };
  }
  if (thumbType === ThumbType.BottomLeft) {
    return { x: thumbOffsetX, y: thumbOffsetY + (rectNode?.height ?? 0) };
  }
  if (thumbType === ThumbType.BottomRight) {
    return {
      x: thumbOffsetX + (rectNode?.width ?? 0),
      y: thumbOffsetY + (rectNode?.height ?? 0),
    };
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetX,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetY -
        thumbRadius,
    };
  }

  if (
    thumbType === ThumbType.EndConnectorLeft ||
    thumbType === ThumbType.EndConnectorCenter
  ) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetX -
        thumbRadius,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetY,
    };
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetX,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetY +
        thumbRadius,
    };
  }

  if (
    thumbType === ThumbType.StartConnectorRight ||
    thumbType === ThumbType.StartConnectorCenter
  ) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetX +
        thumbRadius,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetY,
    };
  }

  throw new Error('Thumb type not supported');
};

export const createRect = <T>(
  canvas: INodeComponent<T>,
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
  }
) => {
  let widthHelper = width;
  let heightHelper = height;

  const rectNode: INodeComponent<T> = createRectPathSVGElement<T>(
    canvas.domElement,
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
    (thumbType: ThumbType, index?: number) => {
      return thumbPosition<T>(rectNode, thumbType, index);
    },
    markup,
    layoutProperties
  );
  // rectNode.nodeType is "shape" .. if thats changed then the dragging of nodes doesnt work anymore
  rectNode.shapeType = 'rect';

  widthHelper = rectNode.width ?? 0;
  heightHelper = rectNode.height ?? 0;

  rectNode.onCalculateControlPoints = (
    nodeType: ControlAndEndPointNodeType,
    curveType: CurveType,
    thumbType: ThumbType,
    index?: number
  ) => {
    if (nodeType === ControlAndEndPointNodeType.start) {
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
        );

      if (thumbType === ThumbType.StartConnectorTop) {
        y = y + thumbRadius * 3;
        return {
          x: x,
          y: y,
          cx: x,
          cy: y + (rectNode.height || 0) + 50,
          nodeType,
        };
      }
      x = x + thumbRadius * 3;
      return {
        x: x,
        y: y,
        cx: x + (rectNode.width || 0) + 50,
        cy: y,
        nodeType,
      };
    }
    if (nodeType === ControlAndEndPointNodeType.end) {
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
        );

      if (thumbType === ThumbType.EndConnectorTop) {
        y = y - thumbRadius * 3;
        return {
          x: x,
          y: y,
          cx: x,
          cy: y - (rectNode.height || 0) - 50,
          nodeType,
        };
      }

      x = x - thumbRadius * 3;

      return {
        x: x,
        y: y,
        cx: x - (rectNode.width || 0) - 50,
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
    followRelations = true
  ) {
    if (!followRelations) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;
      element.x = x;
      element.y = y;

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
      } else if (
        componentRelation.type === NodeComponentRelationType.childComponent
      ) {
        //
      } else if (
        componentRelation.type === NodeComponentRelationType.connection
      ) {
        //
      }
    });
  }

  const startPointElement = createThumbSVGElement(
    rectNode.domElement,
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
    undefined
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
    true
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
    setPosition(component, x, y, actionComponent?.nodeType !== 'shape');
    return true;
  };
  const leftBottomElement = createThumbSVGElement(
    rectNode.domElement,
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
    true
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape');
    return true;
  };
  const rightBottomElement = createThumbSVGElement(
    rectNode.domElement,
    rectNode.elements,
    ThumbType.BottomRight,
    '#0000ff',
    thumbOffsetX + widthHelper,
    thumbOffsetY + heightHelper,
    'rightBottom',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape');
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
      if (component.specifier === 'begin') {
        component.parent.startNode = rectNode;
        component.parent.startNodeThumb = thumbNode;
      } else {
        component.parent.endNode = rectNode;
        component.parent.endNodeThumb = thumbNode;
      }
      component.parent.isControlled = true;

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

      if (component.parent.update) {
        component.parent.update(
          component.parent,
          rectNode.x,
          rectNode.y,
          rectNode
        );
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape');
    return true;
  };

  const thumbConnectors: INodeComponent<T>[] = [];

  if (thumbs) {
    thumbs.forEach((thumb, index) => {
      const { x, y } = thumbPosition(
        rectNode,
        thumb.thumbType,
        thumb.thumbIndex ?? 0
      );

      const thumbConnectorElement = createThumbSVGElement(
        rectNode.domElement,
        rectNode.elements,
        thumb.thumbType,
        '#008080',
        x,
        y,
        `thumb-connector-${index}`,
        'connector',
        'top-0 left-0 origin-center',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        thumb.thumbIndex ?? 0
      );

      thumbConnectorElement.isControlled = true;
      thumbConnectorElement.isConnectPoint = true;
      thumbConnectorElement.thumbConnectionType = thumb.connectionType;

      thumbConnectorElement.onCanReceiveDroppedComponent =
        onCanReceiveDroppedComponent;
      thumbConnectorElement.onReceiveDroppedComponent =
        onReceiveDroppedComponent;
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
  };
};
