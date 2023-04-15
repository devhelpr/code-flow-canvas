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

const calculateConnectorX = (
  thumbType: ThumbType,
  width: number,
  height: number,
  index?: number
) => {
  if (
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.StartConnectorTop
  ) {
    return width + thumbRadius * 2;
  }

  if (
    thumbType === ThumbType.EndConnectorCenter ||
    thumbType === ThumbType.EndConnectorTop
  ) {
    return 0; //thumbRadius * 2;
  }
  // if (thumbType === ThumbType.Start) {
  //   return (width || 0) + thumbRadius * 2
  // }
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
    return thumbOffsetY + height / 2;
  }

  if (
    thumbType === ThumbType.StartConnectorTop ||
    thumbType === ThumbType.EndConnectorTop
  ) {
    return thumbOffsetY + 30 * (index ?? 0);
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

  if (thumbType === ThumbType.EndConnectorCenter) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.StartConnectorCenter) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ), //thumbOffsetX + (rectNode?.width ?? 0) + thumbRadius,
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ), //thumbOffsetY, // + (rectNode?.height ?? 0) / 2,
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
  thumbs?: IThumb[]
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
    }
  );
  widthHelper = rectNode.width ?? 0;
  heightHelper = rectNode.height ?? 0;

  rectNode.onCalculateControlPoints = (
    nodeType: ControlAndEndPointNodeType,
    _curveType: CurveType,
    thumbType: ThumbType,
    index?: number
  ) => {
    if (nodeType === ControlAndEndPointNodeType.start) {
      /*
        points.beginX = x + (actionComponent?.width || 0) + 20;
        points.beginY = y + (actionComponent?.height || 0) / 2;

        // see above: move this logic to a "strategy-function"

        if (isQuadratic) {
          points.cx1 = (points.beginX + points.endX) / 2;
          points.cy1 = ((points.beginY + points.endY) / 2) * 1.25;
        } else {
          points.cx1 = points.beginX + (actionComponent?.width || 0) + 50;
          points.cy1 = points.beginY;
        }

      */
      const x =
        rectNode.x +
        calculateConnectorX(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        ) +
        thumbRadius;
      //(rectNode.width || 0) + 20 + thumbRadius;
      const y =
        rectNode.y +
        calculateConnectorY(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        ) -
        thumbOffsetY; // rectNode.y; //+ (rectNode.height || 0) / 2;
      return {
        x: x,
        y: y,
        cx: x + (rectNode.width || 0) + 50,
        cy: y,
        nodeType,
      };
    }
    if (nodeType === ControlAndEndPointNodeType.end) {
      /*
        points.endX = x - 20;
        points.endY = y + (actionComponent?.height || 0) / 2;
        if (isQuadratic) {
          points.cx1 = (points.beginX + points.endX) / 2;
          points.cy1 = ((points.beginY + points.endY) / 2) * 1.25;
        } else {
          points.cx2 = points.endX - (actionComponent?.width || 0) - 50;
          points.cy2 = points.endY;
        }
      */
      const x =
        rectNode.x +
        calculateConnectorX(
          thumbType,
          rectNode.width ?? 0,
          rectNode.height ?? 0,
          index
        ) -
        thumbRadius;
      //- 20 - thumbRadius;
      const y = rectNode.y + (rectNode.height || 0) / 2;
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

    // if (doPosition) {
    //   console.log('setPosition', doPosition, element.nodeType, x, y);
    //   // (
    //   //   element.domElement as unknown as HTMLElement | SVGElement
    //   // ).style.transform = `translate(${x}px, ${y}px)`;
    //   // element.x = x;
    //   // element.y = y;
    // }
  }

  const startPointElement = createThumbSVGElement(
    rectNode.domElement,
    rectNode.elements,
    ThumbType.TopLeft,
    '#ff000080',
    thumbOffsetX, //startX,
    thumbOffsetY, //startY,
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
    thumbOffsetX + widthHelper, //startX + width,
    thumbOffsetY + heightHelper, //startY + height,
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
    //if (component.parent && component.specifier === 'begin') {

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

    setPosition(
      component,
      x + thumbOffsetX - thumbRadius,
      y,
      actionComponent?.nodeType !== 'shape'
    );
    return true;
  };

  const thumbConnectors: INodeComponent<T>[] = [];

  if (thumbs) {
    thumbs.forEach((thumb, index) => {
      const thumbConnectorElement = createThumbSVGElement(
        rectNode.domElement,
        rectNode.elements,
        thumb.thumbType,
        '#008080',
        calculateConnectorX(
          thumb.thumbType,
          widthHelper,
          heightHelper,
          thumb.thumbIndex ?? 0
        ) +
          thumbOffsetX -
          thumbRadius,
        //thumbOffsetX + widthHelper + thumbRadius,
        calculateConnectorY(
          thumb.thumbType,
          widthHelper,
          heightHelper,
          thumb.thumbIndex ?? 0
        ),
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
  // end try

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
