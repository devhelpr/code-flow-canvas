/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  NodeComponentRelationType,
} from '../interfaces/element';
import { createEffect, getVisbility } from '../reactivity';
import { createConnectionSVGElement } from './connection-svg-element';
import { createSVGElement } from './svg-element';

export const createCubicBezier = (
  canvas: INodeComponent,
  pathHiddenElement: IElementNode,
  elements: ElementNodeMap,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  controlPoint1X: number,
  controlPoint1Y: number,
  controlPoint2X: number,
  controlPoint2Y: number,
  isControlled = false
) => {
  const connection = createConnectionSVGElement(
    canvas.domElement,
    elements,
    startX,
    startY,
    endX,
    endY,
    controlPoint1X,
    controlPoint1Y,
    controlPoint2X,
    controlPoint2Y,
    pathHiddenElement
  );
  connection.isControlled = isControlled;

  function setPosition(
    element: INodeComponent,
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
    element.components.forEach((componentRelation) => {
      if (
        componentRelation.type === NodeComponentRelationType.self ||
        componentRelation.type === NodeComponentRelationType.controller ||
        componentRelation.type === NodeComponentRelationType.controllerTarget
      ) {
        if (componentRelation.update) {
          componentRelation.update(componentRelation.component, x, y, element);
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
  const startPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    startX,
    startY,
    'begin'
  );
  startPointElement.isControlled = isControlled;
  startPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  const endPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    endX,
    endY,
    'end'
  );
  endPointElement.isControlled = isControlled;
  endPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };
  const controlPoint1Element = createSVGElement(
    canvas.domElement,
    elements,
    '#00ff00',
    controlPoint1X,
    controlPoint1Y,
    'c1'
  );
  controlPoint1Element.isControlled = isControlled;
  controlPoint1Element.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };
  const controlPoint2Element = createSVGElement(
    canvas.domElement,
    elements,
    '#0000ff',
    controlPoint2X,
    controlPoint2Y,
    'c2'
  );
  controlPoint2Element.isControlled = isControlled;
  controlPoint2Element.update = (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y, actionComponent?.nodeType !== 'connection');
    return true;
  };

  startPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  endPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  // endPointElement.components.push({
  //   component: connection,
  //   type: NodeComponentRelationType.connection,
  //   connectionStart: endPointElement,
  //   connectionEnd: controlPoint1Element,
  // });
  controlPoint1Element.components.push(
    // {
    //   component: connection,
    //   type: NodeComponentRelationType.connection,
    //   connectionStart: endPointElement,
    //   connectionEnd: controlPoint1Element,
    // },
    {
      component: connection,
      type: NodeComponentRelationType.controllerTarget,
      update: (
        component: INodeComponent,
        x: number,
        y: number,
        actionComponent: INodeComponent
      ) => {
        if (component.update) {
          return component.update(component, x, y, actionComponent);
        }
        return true;
      },
    }
  );

  connection.components.push({
    component: connection,
    type: NodeComponentRelationType.self,
    update: (component: INodeComponent, x: number, y: number) => true,
    commitUpdate: (component: INodeComponent, x: number, y: number) => {
      //
    },
    controllers: {
      start: startPointElement,
      end: endPointElement,
      controlPoint1: controlPoint1Element,
      controlPoint2: controlPoint2Element,
    },
  });
  controlPoint2Element.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
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
    (endPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (controlPoint1Element.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (controlPoint2Element.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
  });

  return {
    nodeComponent: connection,
    setStartPoint: (x: number, y: number) => {
      if (startPointElement.update) {
        startPointElement.update(startPointElement, x, y, startPointElement);
      }
    },
    setEndPoint: (x: number, y: number) => {
      if (endPointElement.update) {
        endPointElement.update(endPointElement, x, y, endPointElement);
      }
    },
    setControlPoint1: (x: number, y: number) => {
      if (controlPoint1Element.update) {
        controlPoint1Element.update(
          controlPoint1Element,
          x,
          y,
          controlPoint1Element
        );
      }
    },
    setControlPoint2: (x: number, y: number) => {
      if (controlPoint2Element.update) {
        controlPoint2Element.update(
          controlPoint1Element,
          x,
          y,
          controlPoint2Element
        );
      }
    },
  };
};

export const createQuadraticBezier = (
  canvas: INodeComponent,
  pathHiddenElement: IElementNode,
  elements: ElementNodeMap,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  controlPoint1X: number,
  controlPoint1Y: number,
  isControlled = false
) => {
  const connection = createConnectionSVGElement(
    canvas.domElement,
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
    true
  );
  connection.isControlled = isControlled;

  function setPosition(element: INodeComponent, x: number, y: number) {
    (
      element.domElement as unknown as HTMLElement | SVGElement
    ).style.transform = `translate(${x}px, ${y}px)`;

    element.components.forEach((componentRelation) => {
      if (
        componentRelation.type === NodeComponentRelationType.self ||
        componentRelation.type === NodeComponentRelationType.controller ||
        componentRelation.type === NodeComponentRelationType.controllerTarget
      ) {
        if (componentRelation.update) {
          componentRelation.update(componentRelation.component, x, y, element);
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
  const startPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    startX,
    startY,
    'begin'
  );
  startPointElement.isControlled = isControlled;
  startPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
    return true;
  };

  const endPointElement = createSVGElement(
    canvas.domElement,
    elements,
    '#ff000080',
    endX,
    endY,
    'end'
  );
  endPointElement.isControlled = isControlled;
  endPointElement.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
    return true;
  };
  const controlPoint1Element = createSVGElement(
    canvas.domElement,
    elements,
    '#00ff00',
    controlPoint1X,
    controlPoint1Y,
    'c1'
  );
  controlPoint1Element.isControlled = isControlled;
  controlPoint1Element.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
    return true;
  };

  startPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  endPointElement.components.push({
    component: connection,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component: INodeComponent,
      x: number,
      y: number,
      actionComponent: INodeComponent
    ) => {
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  // endPointElement.components.push({
  //   component: connection,
  //   type: NodeComponentRelationType.connection,
  //   connectionStart: endPointElement,
  //   connectionEnd: controlPoint1Element,
  // });
  controlPoint1Element.components.push(
    // {
    //   component: connection,
    //   type: NodeComponentRelationType.connection,
    //   connectionStart: endPointElement,
    //   connectionEnd: controlPoint1Element,
    // },
    {
      component: connection,
      type: NodeComponentRelationType.controllerTarget,
      update: (
        component: INodeComponent,
        x: number,
        y: number,
        actionComponent: INodeComponent
      ) => {
        if (component.update) {
          return component.update(component, x, y, actionComponent);
        }
        return true;
      },
    }
  );

  connection.components.push({
    component: connection,
    type: NodeComponentRelationType.self,
    update: (component: INodeComponent, x: number, y: number) => true,
    commitUpdate: (component: INodeComponent, x: number, y: number) => true,
    controllers: {
      start: startPointElement,
      end: endPointElement,
      controlPoint: controlPoint1Element,
    },
  });

  createEffect(() => {
    const visibility = getVisbility();
    (startPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (endPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (controlPoint1Element.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
  });

  return {
    nodeComponent: connection,
    setStartPoint: (x: number, y: number) => {
      if (startPointElement.update) {
        startPointElement.update(startPointElement, x, y, startPointElement);
      }
    },
    setEndPoint: (x: number, y: number) => {
      if (endPointElement.update) {
        endPointElement.update(endPointElement, x, y, endPointElement);
      }
    },
    setControlPoint1: (x: number, y: number) => {
      if (controlPoint1Element.update) {
        controlPoint1Element.update(
          controlPoint1Element,
          x,
          y,
          controlPoint1Element
        );
      }
    },
  };
};
