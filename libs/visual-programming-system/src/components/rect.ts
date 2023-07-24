/* eslint-disable @typescript-eslint/no-unused-vars */
import { compileMarkup } from '@devhelpr/markup-compiler';
import { getCamera, transformToCamera } from '../camera';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  CurveType,
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
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
import { createASTNodeElement, createElement } from '../utils';
import { pointerDown } from './events/pointer-events';
import { ThumbNode } from './thumb';
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
import { getPoint } from './utils/get-point';
import { setPosition } from './utils/set-position';

export class Rect<T> {
  private rectNode: IRectNodeComponent<T> | undefined;
  private rectPathInstance: ReturnType<typeof this.createRectPathSVGElement>;

  nodeComponent?: IRectNodeComponent<T>;
  private canvas: INodeComponent<T> | undefined;
  private canvasUpdated?: () => void;
  private interactionStateMachine: InteractionStateMachine<T>;
  constructor(
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
    disableManualResize?: boolean,
    canvasUpdated?: () => void,
    id?: string
  ) {
    this.canvas = canvas;
    this.canvasUpdated = canvasUpdated;
    this.interactionStateMachine = interactionStateMachine;

    let widthHelper = width;
    let heightHelper = height;

    this.rectPathInstance = this.createRectPathSVGElement(
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
      (thumbType: ThumbType, index?: number, offsetY?: number) => {
        return thumbPosition<T>(this.rectNode!, thumbType, index, offsetY);
      },
      markup,
      layoutProperties,
      hasStaticWidthHeight,
      disableInteraction,
      canvasUpdated,
      id
    );
    this.rectNode = this.rectPathInstance.nodeComponent;

    // rectNode.nodeType is "shape" .. if thats changed then the dragging of nodes doesnt work anymore
    this.rectNode.shapeType = 'rect';

    widthHelper = this.rectNode.width ?? 0;
    heightHelper = this.rectNode.height ?? 0;

    const thumbConnectors: IThumbNodeComponent<T>[] = [];

    if (thumbs) {
      thumbs.forEach((thumb, index) => {
        if (!this.rectNode) {
          return;
        }
        const { x, y } = thumbInitialPosition(
          this.rectNode,
          thumb.thumbType,
          thumb.thumbIndex ?? 0,
          thumb.offsetY ?? 0
        );

        const thumbNode = new ThumbNode<T>(
          this.rectNode.domElement,
          this.interactionStateMachine,
          this.rectNode.elements,
          thumb.name ??
            (thumb.connectionType === ThumbConnectionType.start
              ? 'output'
              : 'input'),
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
          this.rectNode,
          pathHiddenElement,
          disableInteraction,
          thumb.label,
          thumb.thumbShape ?? 'circle',
          canvasUpdated
        );

        if (!thumbNode.nodeComponent) {
          throw new Error('ThumbNode.nodeComponent is undefined');
        }
        thumbNode.nodeComponent.pathName = thumb.pathName;
        thumbNode.nodeComponent.isControlled = true;
        thumbNode.nodeComponent.isConnectPoint = true;
        thumbNode.nodeComponent.thumbConnectionType = thumb.connectionType;
        thumbNode.nodeComponent.thumbOffsetY = thumb.offsetY ?? 0;
        thumbNode.nodeComponent.thumbControlPointDistance =
          thumb.controlPointDistance;
        thumbNode.nodeComponent.thumbLinkedToNode = this.rectNode;
        thumbNode.nodeComponent.thumbConstraint = thumb.thumbConstraint;

        if (!disableInteraction) {
          thumbNode.nodeComponent.onCanReceiveDroppedComponent =
            this.onCanReceiveDroppedComponent;
          thumbNode.nodeComponent.onReceiveDroppedComponent =
            this.onReceiveDroppedComponent;
        }
        thumbNode.nodeComponent.update = this.onEndThumbConnectorElementupdate;

        thumbConnectors.push(thumbNode.nodeComponent);
      });
    }
    this.rectNode.thumbConnectors = thumbConnectors;

    this.rectNode.onClick = () => {
      if (!this.rectNode) {
        return;
      }
      console.log('CLICKED ON RECT', this.rectNode.id);
      setSelectNode(this.rectNode.id);
    };
    this.rectNode.connections = [];
    this.nodeComponent = this.rectNode;
  }

  resize(width?: number) {
    this.rectPathInstance.resize(width);
  }

  private onReceiveDroppedComponent(
    thumbNode: IThumbNodeComponent<T>,
    component: INodeComponent<T>
  ) {
    // component is not the path itself but it is the drag-handle of a path (the parent of that handle is the path node-component)

    if (!this.rectNode) {
      return;
    }
    console.log(
      'DROPPED ON RIGHT THUMB',
      thumbNode,
      component.id,
      component.parent,
      component.specifier,
      this.rectNode.x,
      this.rectNode.y,
      this.rectNode.id
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
      let nodeReference = this.rectNode;
      if (component.specifier === 'begin') {
        previousConnectedNodeId = parentConnection.startNode?.id ?? '';
        parentConnection.startNode = this.rectNode;
        parentConnection.startNodeThumb = thumbNode;
      } else {
        previousConnectedNodeId = parentConnection.endNode?.id ?? '';
        parentConnection.endNode = this.rectNode;
        parentConnection.endNodeThumb = thumbNode;
        if (parentConnection.startNode) {
          // use start node as reference for the curve's begin point
          nodeReference = parentConnection.startNode;
        }
      }
      component.parent.isControlled = true;

      // remove the previous connected node from the connections of the rectNode
      this.rectNode.connections = (this.rectNode.connections ?? []).filter(
        (connection) => {
          return (
            connection.startNode?.id !== previousConnectedNodeId &&
            connection.endNode?.id !== previousConnectedNodeId
          );
        }
      );
      this.rectNode.connections?.push(parentConnection);

      // Update both sides of the connection to get a correct curve
      if (component.parent.update) {
        component.parent.update(
          component.parent,
          nodeReference.x,
          nodeReference.y,
          this.rectNode
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

      (this.canvas?.domElement as unknown as HTMLElement | SVGElement).append(
        parentConnection.startNode?.domElement as unknown as HTMLElement
      );

      if (this.canvasUpdated) {
        this.canvasUpdated();
      }
    }
  }

  private onCanReceiveDroppedComponent(
    thumbNode: IThumbNodeComponent<T>,
    component: INodeComponent<T>,
    receivingThumbNode: IThumbNodeComponent<T>
  ) {
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
  }

  onEndThumbConnectorElementupdate(
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape', false);
    return true;
  }

  points = {
    beginX: 0,
    beginY: 0,
    width: 0,
    height: 0,
  };

  createRectPathSVGElement(
    canvasElement: DOMElementNode,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    width: number,
    height: number,
    pathHiddenElement: IElementNode<T>,
    text?: string,
    shapeType?: ShapeType,
    thumbOffsetX?: number,
    thumbOffsetY?: number,
    getThumbPosition?: (
      thumbType: ThumbType,
      index?: number,
      offsetY?: number
    ) => { x: number; y: number },
    markup?: string | INodeComponent<T>,
    layoutProperties?: {
      classNames?: string;
    },
    hasStaticWidthHeight?: boolean,
    disableInteraction?: boolean,
    canvasUpdated?: () => void,
    id?: string
  ) {
    /*
      draw svg path based on bbox of the hidden path
        
        - add padding to the bbox x and y and width and height
  
        - subtract bbox x and y from the path points
        - set transform of svg to the bbox x and y
        - set the width and height of the svg to the bbox width and height   
    */

    this.points = {
      beginX: startX,
      beginY: startY,
      width: width,
      height: height,
    };
    const begin = getPoint(this.points.beginX, this.points.beginY);

    const pathPoints = {
      beginX: begin.x,
      beginY: begin.y,
      width: this.points.width,
      height: this.points.height,
    };

    const divElement = createElement(
      'div',
      {
        class: 'absolute top-0 left-0 select-none ', //will-change-transform
      },
      canvasElement,
      undefined,
      id
    ) as unknown as IRectNodeComponent<T> | undefined;

    if (!divElement) throw new Error('divElement is undefined');

    divElement.nodeType = 'shape';
    divElement.shapeType = shapeType;

    let astElement: any;

    const hasPointerEvents = !disableInteraction;

    if (markup !== undefined && typeof markup === 'string') {
      const compiledMarkup = compileMarkup(
        `<div class="${layoutProperties?.classNames ?? ''} overflow-hidden">
          ${markup ?? ''}
        </div>`
      );
      if (!compiledMarkup) {
        throw new Error('Invalid markup');
      }

      if (compiledMarkup && divElement && divElement.domElement) {
        astElement = createASTNodeElement(
          compiledMarkup.body,
          divElement.domElement,
          divElement.elements
        );
      }
    } else if (markup !== undefined) {
      astElement = markup as unknown as INodeComponent<T>;
      divElement.domElement.appendChild(astElement.domElement);
      divElement.elements.set(astElement.id, astElement);
    } else {
      throw new Error('No markup or INodeComponent');
    }

    if (astElement && hasPointerEvents) {
      astElement.domElement.addEventListener(
        'pointerdown',
        this.astElementOnClick(divElement, pathPoints)
      );
    }

    if (!divElement) throw new Error('nodeComponent is undefined');

    const bbox = this.getBBoxPath(pathPoints);

    (
      divElement.domElement as unknown as HTMLElement
    ).style.width = `${bbox.width}px`;
    (
      divElement.domElement as unknown as HTMLElement
    ).style.height = `${bbox.height}px`;
    (
      divElement.domElement as unknown as HTMLElement
    ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    elements.set(divElement.id, divElement);

    divElement.update = this.onUpdate(divElement, astElement, getThumbPosition);

    divElement.updateEnd = () => {
      // TODO : only do this when the interaction finishes...
      if (canvasUpdated) {
        canvasUpdated();
      }
    };

    divElement.x = startX;
    divElement.y = startY;
    divElement.width = width;
    divElement.height = height;

    if (!hasStaticWidthHeight) {
      const astElementSize = (
        astElement?.domElement as unknown as HTMLElement
      ).getBoundingClientRect();

      const { scale } = getCamera();
      divElement.width = astElementSize.width / scale;
      divElement.height = astElementSize.height / scale - 20;
      this.points.width = astElementSize.width / scale;
      this.points.height = astElementSize.height / scale - 20;
    }
    divElement.update(divElement, startX, startY, divElement);

    return {
      nodeComponent: divElement,
      resize: (width?: number) => {
        if (hasStaticWidthHeight) {
          return;
        }
        const astElementHtmlElement =
          astElement?.domElement as unknown as HTMLElement;
        astElementHtmlElement.style.width = width ? `${width}px` : 'auto';
        astElementHtmlElement.style.height = 'auto';

        (divElement.domElement as unknown as HTMLElement).style.width = width
          ? `${width}px`
          : 'auto';
        (divElement.domElement as unknown as HTMLElement).style.height = `auto`;

        const astElementSize = astElementHtmlElement.getBoundingClientRect();

        const { scale } = getCamera();
        divElement.width = astElementSize.width / scale - 20;
        divElement.height = astElementSize.height / scale - 20;
        this.points.width = astElementSize.width / scale - 20;
        this.points.height = astElementSize.height / scale - 20;

        (
          divElement.domElement as unknown as HTMLElement
        ).style.width = `${divElement.width}px`;

        (
          divElement.domElement as unknown as HTMLElement
        ).style.height = `${divElement.height}px`;

        if (divElement.update) {
          divElement.update(
            divElement,
            divElement.x + 50,
            divElement.y + 50,
            divElement
          );
        }
      },
    };
  }

  astElementOnClick =
    (
      divElement: IRectNodeComponent<T>,
      pathPoints: {
        beginX: number;
        beginY: number;
        width: number;
        height: number;
      }
    ) =>
    (e: PointerEvent) => {
      if (
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
          (e.target as HTMLElement)?.tagName
        ) >= 0
      )
        return;

      if (divElement && this.canvas) {
        const elementRect = (
          divElement.domElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();

        const { x, y } = transformToCamera(e.clientX, e.clientY);
        const rectCamera = transformToCamera(elementRect.x, elementRect.y);

        const bbox = this.getBBoxPath(pathPoints);
        const interactionInfoResult = pointerDown(
          x - rectCamera.x - (pathPoints.beginX - bbox.x),
          y - rectCamera.y - (pathPoints.beginY - bbox.y),
          divElement,
          this.canvas.domElement,
          this.interactionStateMachine
        );
        if (interactionInfoResult) {
          (
            this.canvas?.domElement as unknown as HTMLElement | SVGElement
          ).append(divElement.domElement);
        }
      }
    };

  getBBoxPath(pathPoints: {
    beginX: number;
    beginY: number;
    width: number;
    height: number;
  }) {
    return {
      x: pathPoints.beginX - 10,
      y: pathPoints.beginY - 10,
      width: pathPoints.width + 20,
      height: pathPoints.height + 20,
    };
  }

  onUpdate =
    (
      divElement: IRectNodeComponent<T>,
      astElement: INodeComponent<T>,
      getThumbPosition?: (
        thumbType: ThumbType,
        index?: number,
        offsetY?: number
      ) => { x: number; y: number }
    ) =>
    (
      incomingComponent?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !incomingComponent ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }

      if (
        (incomingComponent.nodeType === 'connection' &&
          actionComponent.nodeType === 'connection') ||
        (incomingComponent.nodeType === 'shape' &&
          actionComponent.nodeType === 'shape')
      ) {
        this.points.beginX = x - 50;
        this.points.beginY = y - 50;
        if (divElement) {
          divElement.x = this.points.beginX;
          divElement.y = this.points.beginY;
        }

        if (getThumbPosition) {
          incomingComponent?.thumbConnectors?.forEach(
            (connector: IThumbNodeComponent<T>) => {
              if (connector && connector.update && connector.thumbType) {
                const position = getThumbPosition(
                  connector.thumbType,
                  connector.thumbIndex ?? 0,
                  connector.thumbOffsetY ?? 0
                );
                connector.update(
                  connector,
                  position.x,
                  position.y,
                  actionComponent
                );
              }
            }
          );
        }
      } else {
        if (!actionComponent.specifier) {
          return false;
        }

        const getRectPoint = (
          specifier?: string,
          thumbConnector?: IThumbNodeComponent<T>
        ) => {
          if (!getThumbPosition) {
            return { x: 0, y: 0 };
          }
          if (!specifier && thumbConnector && thumbConnector.thumbType) {
            const position = getThumbPosition(
              thumbConnector.thumbType,
              thumbConnector.thumbIndex ?? 0,
              thumbConnector.thumbOffsetY ?? 0
            );
            return {
              x: position.x,
              y: position.y,
            };
          }
          return false;
        };

        incomingComponent?.thumbConnectors?.forEach(
          (connector: IThumbNodeComponent<T>) => {
            if (connector && connector.specifier) {
              const point = getRectPoint(undefined, connector);
              if (point && connector.update) {
                console.log(
                  'update thumb connector',
                  connector.thumbType,
                  point.x,
                  point.y
                );
                connector.update(
                  connector,
                  point.x,
                  point.y,
                  incomingComponent
                );
              }
            }
          }
        );
        //}
      }

      const begin = getPoint(this.points.beginX, this.points.beginY);

      const pathPoints = {
        beginX: begin.x,
        beginY: begin.y,
        width: this.points.width,
        height: this.points.height,
      };

      const bbox = this.getBBoxPath(pathPoints);

      (
        divElement.domElement as unknown as HTMLElement
      ).style.width = `${bbox.width}px`;
      (
        divElement.domElement as unknown as HTMLElement
      ).style.height = `${bbox.height}px`;
      (
        divElement.domElement as unknown as HTMLElement
      ).style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

      if (divElement) {
        divElement.x = this.points.beginX;
        divElement.y = this.points.beginY;
        divElement.width = this.points.width;
        divElement.height = this.points.height;
      }

      (
        astElement.domElement as unknown as HTMLElement
      ).style.width = `${bbox.width}px`;
      (
        astElement.domElement as unknown as HTMLElement
      ).style.height = `${bbox.height}px`;

      if (divElement) {
        // get all connections that have this node as start or end
        divElement.connections?.forEach((lookAtNodeComponent) => {
          if (lookAtNodeComponent.nodeType === 'connection') {
            const start =
              lookAtNodeComponent.startNode === divElement &&
              lookAtNodeComponent;
            const end =
              lookAtNodeComponent.endNode === divElement && lookAtNodeComponent;
            if (
              start &&
              lookAtNodeComponent &&
              lookAtNodeComponent.update &&
              divElement
            ) {
              lookAtNodeComponent.update(
                lookAtNodeComponent,
                this.points.beginX,
                this.points.beginY,
                divElement
              );
              lookAtNodeComponent.update(
                lookAtNodeComponent,
                this.points.beginX,
                this.points.beginY,
                lookAtNodeComponent.endNode
              );
            }
            if (
              end &&
              lookAtNodeComponent &&
              lookAtNodeComponent.update &&
              divElement
            ) {
              lookAtNodeComponent.update(
                lookAtNodeComponent,
                this.points.beginX,
                this.points.beginY,
                divElement
              );
              lookAtNodeComponent.update(
                lookAtNodeComponent,
                this.points.beginX,
                this.points.beginY,
                lookAtNodeComponent.startNode
              );
            }
          }
        });
      }

      return true;
    };
}
