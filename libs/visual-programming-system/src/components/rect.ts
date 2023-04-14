/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ControlAndEndPointNodeType,
  CurveType,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  NodeComponentRelationType,
} from '../interfaces/element';
import {
  createEffect,
  getSelectedNode,
  getVisbility,
  setSelectNode,
} from '../reactivity';
import { ShapeType } from '../types/shape-type';
import { createRectPathSVGElement, ThumbTypes } from './rect-path-svg-element';
import { createThumbSVGElement } from './thumb-svg-element';

const thumbRadius = 10;
const thumbWidth = 100;
const thumbHeight = 100;

const thumbOffsetX = -thumbWidth / 2 + thumbRadius;
const thumbOffsetY = -thumbHeight / 2 + thumbRadius;

export const thumbSize = (
  rectNode: INodeComponent<any>,
  thumbType: ThumbTypes,
  index?: number
) => {
  if (thumbType === ThumbTypes.TopLeft) {
    return { x: thumbOffsetX, y: thumbOffsetY };
  }
  if (thumbType === ThumbTypes.TopRight) {
    return { x: thumbOffsetX + (rectNode?.width ?? 0), y: thumbOffsetY };
  }
  if (thumbType === ThumbTypes.BottomLeft) {
    return { x: thumbOffsetX, y: thumbOffsetY + (rectNode?.height ?? 0) };
  }
  if (thumbType === ThumbTypes.BottomRight) {
    return {
      x: thumbOffsetX + (rectNode?.width ?? 0),
      y: thumbOffsetY + (rectNode?.height ?? 0),
    };
  }

  if (thumbType === ThumbTypes.EndConnectorCenter) {
    return {
      x: thumbOffsetX,
      y: thumbOffsetY + (rectNode?.height ?? 0) / 2,
    };
  }

  if (thumbType === ThumbTypes.StartConnectorCenter) {
    return {
      x: thumbOffsetX + (rectNode?.width ?? 0),
      y: thumbOffsetY + (rectNode?.height ?? 0) / 2,
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
  shapeType?: ShapeType
) => {
  let widthHelper = width;
  let heightHelper = height;

  const rectNode: INodeComponent<any> = createRectPathSVGElement(
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
    (thumbType: ThumbTypes, index?: number) => {
      return thumbSize(rectNode, thumbType, index);
    }
  );
  widthHelper = rectNode.width ?? 0;
  heightHelper = rectNode.height ?? 0;

  rectNode.onCalculateControlPoints = (
    nodeType: ControlAndEndPointNodeType,
    _curveType: CurveType
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
      const x = rectNode.x + (rectNode.width || 0) + 20;
      const y = rectNode.y + (rectNode.height || 0) / 2;
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
      const x = rectNode.x - 20;
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
    '#ff000080',
    thumbOffsetX, //startX,
    thumbOffsetY, //startY,
    'begin',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius
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
    '#ffff0080',
    thumbOffsetX + widthHelper, //startX + width,
    thumbOffsetY, //startY,
    'rightTop',
    'resizer',
    'top-0 left-0 origin-center'
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
    '#00ff00',
    thumbOffsetX, //startX,
    thumbOffsetY + heightHelper, //startY + height,
    'leftBottom',
    'resizer',
    'top-0 left-0 origin-center'
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
    '#0000ff',
    thumbOffsetX + widthHelper, //startX + width,
    thumbOffsetY + heightHelper, //startY + height,
    'rightBottom',
    'resizer',
    'top-0 left-0 origin-center'
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

  const leftThumbConnectorElement = createThumbSVGElement(
    rectNode.domElement,
    rectNode.elements,
    '#008080',
    thumbOffsetX, // startX,
    thumbOffsetY + heightHelper / 2, //startY + height / 2,
    'leftThumbConnector',
    'connector',
    'top-0 left-0 origin-center'
  );

  leftThumbConnectorElement.isControlled = true;
  leftThumbConnectorElement.isConnectPoint = true;
  leftThumbConnectorElement.onCanReceiveDroppedComponent = (
    component: INodeComponent<T>
  ) => {
    return (
      (component && component.parent && component.specifier === 'end') ?? false
    );
  };
  leftThumbConnectorElement.onReceiveDroppedComponent = (
    component: INodeComponent<T>
  ) => {
    // component is not the path itself but it is the drag-handle of a path (the parent of that handle is the path node-component)
    // TODO : change so that the component itself is send as parameter and NOT the drag handle
    console.log(
      'DROPPED ON LEFT THUMB',
      component.parent,
      component.id,
      component.specifier
    );

    if (component.parent && component.specifier === 'end') {
      component.parent.isControlled = true;
      component.parent.endNode = rectNode;
      const index = component.parent.components.findIndex(
        (c) => c.type === NodeComponentRelationType.end
      );
      if (index > -1) {
        component.parent.components.splice(index, 1);
      }
      component.parent.components.push({
        type: NodeComponentRelationType.end,
        component: rectNode,
      } as unknown as INodeComponentRelation<T>);

      if (component.parent.update) {
        component.parent.update(
          component.parent,
          rectNode.x, //- 50,
          rectNode.y, //- 100 - 5,
          rectNode
        );
      }
    }
  };
  leftThumbConnectorElement.update = (
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

  const rightThumbConnectorElement = createThumbSVGElement(
    rectNode.domElement,
    rectNode.elements,
    '#008080',
    thumbOffsetX + widthHelper, //startX + width,
    thumbOffsetY + heightHelper / 2, //startY + height / 2,
    'rightThumbConnector',
    'connector',
    'top-0 left-0 origin-center'
  );

  rightThumbConnectorElement.isControlled = true;
  rightThumbConnectorElement.isConnectPoint = true;

  rightThumbConnectorElement.onCanReceiveDroppedComponent = (
    component: INodeComponent<T>
  ) => {
    return (
      (component && component.parent && component.specifier === 'begin') ??
      false
    );
  };

  rightThumbConnectorElement.onReceiveDroppedComponent = (
    component: INodeComponent<T>
  ) => {
    // component is not the path itself but it is the drag-handle of a path (the parent of that handle is the path node-component)
    console.log(
      'DROPPED ON RIGHT THUMB',
      component.id,
      component.parent,
      component.specifier,
      rectNode.x,
      rectNode.y,
      rectNode.id
    );
    if (component.parent && component.specifier === 'begin') {
      component.parent.startNode = rectNode;
      component.parent.isControlled = true;
      const index = component.parent.components.findIndex(
        (c) => c.type === NodeComponentRelationType.start
      );
      if (index > -1) {
        component.parent.components.splice(index, 1);
      }
      component.parent.components.push({
        type: NodeComponentRelationType.start,
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

  rightThumbConnectorElement.update = (
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
      leftThumbConnector: leftThumbConnectorElement,
      rightThumbConnector: rightThumbConnectorElement,
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
    (
      leftThumbConnectorElement.domElement as unknown as SVGElement
    ).style.display = visibility ? 'block' : 'none';
    (
      rightThumbConnectorElement.domElement as unknown as SVGElement
    ).style.display = visibility ? 'block' : 'none';
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