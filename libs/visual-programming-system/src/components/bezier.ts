/* eslint-disable @typescript-eslint/no-unused-vars */
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import {
  createEffect,
  getVisbility,
  getSelectedNode,
  setSelectNode,
} from '../reactivity';
import { ThumbType } from '../types';
import { LineType } from '../types/line-type';
import { createConnectionSVGElement } from './connection-svg-element';
import { createThumbSVGElement } from './thumb-svg-element';

export const createCubicBezier = <T>(
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
) => {
  const connection = createConnectionSVGElement(
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
  connection.lineType = LineType.BezierCubic;
  connection.isControlled = isControlled;
  connection.onClick = () => {
    if (connection.isControlled) {
      return;
    }
    console.log('connection click', connection.id);
    setSelectNode(connection.id);
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
  const startPointElement = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
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
  startPointElement.isControlled = isControlled;
  startPointElement.parent = connection;
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
  connection.connectionStartNodeThumb = startPointElement;

  const endPointElement = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
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
  endPointElement.isControlled = isControlled;
  endPointElement.parent = connection;
  endPointElement.update = (
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
  connection.connectionEndNodeThumb = endPointElement;
  const controlPoint1Element = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
    'controlpoint1',
    ThumbType.ControlPoint,
    '#00ff00',
    controlPoint1X,
    controlPoint1Y,
    'c1'
  );
  controlPoint1Element.isControlled = isControlled;
  controlPoint1Element.parent = connection;
  controlPoint1Element.update = (
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
  const controlPoint2Element = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
    'controlpoint2',
    ThumbType.ControlPoint,
    '#0000ff',
    controlPoint2X,
    controlPoint2Y,
    'c2'
  );

  controlPoint2Element.isControlled = isControlled;
  controlPoint2Element.parent = connection;
  controlPoint2Element.update = (
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

  connection.controlPointNodes?.push(controlPoint1Element);
  connection.controlPointNodes?.push(controlPoint2Element);

  createEffect(() => {
    //const selectedNode = getSelectedNode();
    const visibility = getVisbility(); // && selectedNode && selectedNode === connection.id;
    //console.log('connection bezier visibility', visibility, connection.id);
    (startPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (endPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';

    if (!(connection.startNode || connection.endNode)) {
      (controlPoint1Element.domElement as unknown as SVGElement).style.display =
        visibility ? 'block' : 'none';
      (controlPoint2Element.domElement as unknown as SVGElement).style.display =
        visibility ? 'block' : 'none';
    }
  });

  return {
    nodeComponent: connection,
    startPointElement,
    endPointElement,
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

export const createQuadraticBezier = <T>(
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
  id?: string
) => {
  const connection = createConnectionSVGElement(
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
    undefined,
    canvasUpdated,
    id
  );
  connection.lineType = LineType.BezierQuadratic;
  connection.isControlled = isControlled;
  connection.onClick = () => {
    if (connection.isControlled) {
      return;
    }
    console.log('connection click', connection.id);
    setSelectNode(connection.id);
  };

  function setPosition(element: INodeComponent<T>, x: number, y: number) {
    (
      element.domElement as unknown as HTMLElement | SVGElement
    ).style.transform = `translate(${x}px, ${y}px)`;
  }
  const startPointElement = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
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
  startPointElement.parent = connection;
  startPointElement.isControlled = isControlled;
  startPointElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y);
    return true;
  };

  const endPointElement = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
    'end',
    ThumbType.End,
    '#ff000080',
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
  endPointElement.parent = connection;
  endPointElement.isControlled = isControlled;
  endPointElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y);
    return true;
  };
  const controlPoint1Element = createThumbSVGElement(
    canvas.domElement,
    interactionStateMachine,
    connection.elements,
    'controlpoint',
    ThumbType.ControlPoint,
    '#00ff00',
    controlPoint1X,
    controlPoint1Y,
    'c1'
  );
  controlPoint1Element.isControlled = isControlled;
  controlPoint1Element.parent = connection;
  controlPoint1Element.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }
    setPosition(component, x, y);
    return true;
  };
  connection.controlPointNodes?.push(controlPoint1Element);
  connection.connectionStartNodeThumb = startPointElement;
  connection.connectionEndNodeThumb = endPointElement;

  createEffect(() => {
    //const selectedNode = getSelectedNode();
    const visibility = getVisbility(); //&& selectedNode && selectedNode === connection.id;
    //console.log('connection visibility', visibility, connection.id);
    (startPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (endPointElement.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
    (controlPoint1Element.domElement as unknown as SVGElement).style.display =
      visibility ? 'block' : 'none';
  });

  return {
    nodeComponent: connection,
    startPointElement,
    endPointElement,
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
