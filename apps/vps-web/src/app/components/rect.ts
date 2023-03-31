/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  NodeComponentRelationType,
} from '../interfaces/element';
import { createEffect, getVisbility } from '../reactivity';
import { createRectPathSVGElement } from './rect-path-svg-element';
import { createSVGElement } from './svg-element';

export const createRect = <T>(
  canvas: INodeComponent<T>,
  pathHiddenElement: IElementNode<T>,
  elements: ElementNodeMap<T>,
  startX: number,
  startY: number,
  width: number,
  height: number,
  text?: string
) => {
  const rectNode = createRectPathSVGElement(
    canvas.domElement,
    elements,
    startX,
    startY,
    width,
    height,
    pathHiddenElement,
    text
  );

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

    if (doPosition) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${x}px, ${y}px)`;
      element.x = x;
      element.y = y;
    }
  }
  const startPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    startX,
    startY,
    'begin'
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  const rightTopPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ffff0080',
    startX + width,
    startY,
    'rightTop'
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };
  const leftBottomElement = createSVGElement(
    canvas.domElement,
    elements,
    '#00ff00',
    startX,
    startY + height,
    'leftBottom'
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };
  const rightBottomElement = createSVGElement(
    canvas.domElement,
    elements,
    '#0000ff',
    startX + width,
    startY + height,
    'rightBottom'
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  const leftThumbConnectorElement = createSVGElement(
    canvas.domElement,
    elements,
    '#008080',
    startX,
    startY + height / 2,
    'leftThumbConnector'
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  const rightThumbConnectorElement = createSVGElement(
    canvas.domElement,
    elements,
    '#008080',
    startX + width,
    startY + height / 2,
    'rightThumbConnector'
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

    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
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

  createEffect(() => {
    const visibility = getVisbility();
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
