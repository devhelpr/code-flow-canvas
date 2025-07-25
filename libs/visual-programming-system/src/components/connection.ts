import { transformCameraSpaceToWorldSpace } from '../camera';
import { paddingRect, totalPaddingRect } from '../constants/measures';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ControlAndEndPointNodeType,
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IDOMElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { Theme } from '../interfaces/theme';
import { setSelectNode } from '../reactivity';
import { ConnectionControllerType, LineType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createElement, createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { getPointerPos } from '../utils/pointer-pos';
import { pointerDown } from './events/pointer-events';
import {
  onCubicCalculateControlPoints,
  onGetConnectionToThumbOffset,
} from './utils/calculate-cubic-control-points';
import { BaseNodeInfo } from '../types/base-node-info';
import { ConnectionStartEndPositions, FlowChangeType } from '../interfaces';
import { getConnectionCssClasses } from './css-classes/connection-css-classes';
import { IBaseFlow } from '../canvas-app/base-flow';

const standardControlPointDistance = 150;

export enum ConnectionUpdateState {
  AddConnection = 'AddConnection',
  UpdateConnection = 'UpdateConnection',
  DeleteConnection = 'DeleteConnection',
  ConnectConnection = 'ConnectConnection',
}

export class Connection<T extends BaseNodeInfo> {
  nodeComponent?: IConnectionNodeComponent<T>;
  points = {
    beginX: 0,
    beginY: 0,

    cx1: 0,
    cy1: 0,
    cx2: 0,
    cy2: 0,
    endX: 0,
    endY: 0,
  };
  orgPoints = {
    beginX: 0,
    beginY: 0,

    cx1: 0,
    cy1: 0,
    cx2: 0,
    cy2: 0,
    endX: 0,
    endY: 0,
  };

  protected onCalculateControlPoints = onCubicCalculateControlPoints;
  pathElement: IElementNode<T> | undefined = undefined;
  pathTransparentElement: IElementNode<T> | undefined = undefined;
  svgParent: IElementNode<T> | undefined = undefined;
  canvas: IElementNode<T> | undefined;
  canvasElement: DOMElementNode;
  interactionStateMachine: InteractionStateMachine<T>;
  protected rootElement?: HTMLElement;

  pathHiddenElement: IElementNode<T> | null = null;
  containerNode?: INodeComponent<T>;
  setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void;
  textElement: IDOMElement | undefined = undefined;

  connectionUpdateState: ConnectionUpdateState | undefined = undefined;
  protected cssClasses: ReturnType<typeof getConnectionCssClasses>;
  canvasApp?: IBaseFlow<T>;

  constructor(
    canvas: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number,
    pathHiddenElement: IElementNode<T>,
    isDashed = false,
    onCalculateControlPoints = onCubicCalculateControlPoints,
    canvasUpdated?: (
      shouldClearExecutionHistory?: boolean,
      isStoreOnly?: boolean,
      flowChangeType?: FlowChangeType
    ) => void,
    id?: string,
    containerNode?: IRectNodeComponent<T>,
    _theme?: Theme,
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void,
    rootElement?: HTMLElement,
    canvasApp?: IBaseFlow<T>
  ) {
    /*
    draw svg path based on bbox of the hidden path
      
      - add padding to the bbox x and y and width and height

      - subtract bbox x and y from the path points
      - set transform of svg to the bbox x and y
      - set the width and height of the svg to the bbox width and height   
    */

    this.cssClasses = getConnectionCssClasses();
    this.canvasApp = canvasApp;
    this.onCalculateControlPoints = onCalculateControlPoints;
    this.pathHiddenElement = pathHiddenElement;
    this.canvas = canvas;
    this.canvasElement = canvas.domElement;
    this.interactionStateMachine = interactionStateMachine;
    this.containerNode = containerNode;
    this.setCanvasAction = setCanvasAction;
    this.rootElement = rootElement;

    this.points = {
      beginX: startX,
      beginY: startY,

      cx1: controlPoint1X,
      cy1: controlPoint1Y,
      cx2: controlPoint2X,
      cy2: controlPoint2Y,
      endX: endX,
      endY: endY,
    };

    this.svgParent = createNSElement(
      'svg',
      {
        width: 0,
        height: 0,
        class: this.cssClasses.containerCssClasses,
      },
      this.canvasElement
    );
    if (!this.svgParent) {
      throw new Error('svgParent is undefined');
    }
    (this.canvasElement as unknown as HTMLElement).prepend(
      this.svgParent.domElement
    );

    (this.svgParent.domElement as HTMLElement).setAttribute(
      'connection-id',
      id ?? ''
    );
    const prefixId = this.canvas.id.replace(/-/g, '');
    const arrowIdPrefix = `${prefixId}${(id ?? crypto.randomUUID()).replace(
      /-/g,
      ''
    )}`;
    this.createArrowMarker(arrowIdPrefix);

    this.nodeComponent = createSVGNodeComponent(
      'g',
      {},
      this.svgParent.domElement,
      undefined,
      undefined,
      id
    ) as unknown as IConnectionNodeComponent<T>;

    if (!this.nodeComponent) throw new Error('nodeComponent is undefined');
    if (!onCalculateControlPoints)
      throw new Error('onCalculateControlPoints is undefined');
    this.nodeComponent.nodeType = NodeType.Connection;
    this.nodeComponent.onCalculateControlPoints = onCalculateControlPoints;
    this.nodeComponent.controlPointNodes = [];
    this.nodeComponent.containerNode = containerNode;
    this.nodeComponent.connectorWrapper = this.svgParent;
    this.nodeComponent.delete = () => {
      if (this.svgParent) {
        this.svgParent.domElement.remove();
      }
      if (this.textElement) {
        this.textElement.domElement.remove();
      }
    };

    this.nodeComponent.controlPoints = this.setControlPoints();

    const { offsetX: startOffsetX, offsetY: startOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.start,
        this.nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
      );
    const { offsetX: endOffsetX, offsetY: endOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.end,
        this.nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
      );
    const bbox = this.getBBoxPath(
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );
    const svgParentElement = this.svgParent
      .domElement as unknown as HTMLElement;
    svgParentElement.style.width = `${bbox.width}px`;
    svgParentElement.style.height = `${bbox.height}px`;
    svgParentElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;

    const dashedStroke =
      isDashed || this.nodeComponent.isData
        ? {
            'stroke-dasharray': '10,10',
          }
        : undefined;

    const path = this.getPath(
      bbox,
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );

    // this.pathTransparentElement = createNSElement(
    //   'path',
    //   {
    //     class: this.cssClasses.pathTransparentCssClasses,
    //     d: path,
    //     stroke: containerNode
    //       ? '#94a3b8'
    //       : theme?.backgroundAsHexColor ?? '#1e293b',
    //     'stroke-width': 20,
    //     fill: 'transparent',
    //     pointerdown: this.onPointerDown,
    //   },
    //   this.nodeComponent.domElement
    // );

    this.pathElement = createNSElement(
      'path',
      {
        class: this.cssClasses.pathCssClasses,
        d: path,
        stroke: 'currentColor',
        //'marker-start': 'url(#arrowbegin)',
        'marker-end': `url(#${arrowIdPrefix}_arrow)`,
        'stroke-width': 3,
        ...dashedStroke,
        fill: 'transparent',
        style: {
          filter: `url(#${arrowIdPrefix}_shadow)`,
        },
        pointerdown: this.onPointerDown,
      },
      this.nodeComponent.domElement
    );
    this.nodeComponent.pathElement = this.pathElement;

    if (!this.pathElement) throw new Error('pathElement is undefined');
    // if (!this.pathTransparentElement)
    //   throw new Error('pathTransparentElement is undefined');

    elements.set(this.nodeComponent.id, this.nodeComponent);
    this.nodeComponent.elements.set(this.pathElement.id, this.pathElement);

    this.nodeComponent.update = this.onUpdate;

    this.nodeComponent.updateEnd = () => {
      console.log('Connection updateEnd', this.connectionUpdateState);
      let flowChangeType: FlowChangeType | undefined = undefined;
      if (this.connectionUpdateState) {
        switch (this.connectionUpdateState) {
          case ConnectionUpdateState.AddConnection:
            flowChangeType = FlowChangeType.AddConnection;
            break;
          case ConnectionUpdateState.UpdateConnection:
            flowChangeType = FlowChangeType.UpdateConnection;
            break;
          case ConnectionUpdateState.DeleteConnection:
            flowChangeType = FlowChangeType.DeleteConnection;
            break;
          case ConnectionUpdateState.ConnectConnection:
            flowChangeType = FlowChangeType.UpdateConnection;
            break;
        }
      }
      this.connectionUpdateState = undefined;
      if (canvasUpdated) {
        canvasUpdated(undefined, undefined, flowChangeType);
      }
    };

    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;
    this.nodeComponent.endX = 0;
    this.nodeComponent.endY = 0;
  }

  getBBoxPath = (
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number
  ) => {
    this.setHiddenPath(startOffsetX, startOffsetY, endOffsetX, endOffsetY);

    const bbox = (
      this.pathHiddenElement?.domElement as unknown as SVGPathElement
    ).getBBox();

    return {
      x: bbox.x - paddingRect,
      y: bbox.y - paddingRect,
      width: bbox.width + totalPaddingRect,
      height: bbox.height + totalPaddingRect,
    };
  };

  interactionInfo: false | IPointerDownResult = false;

  onPointerDown = (e: PointerEvent) => {
    console.log('CONNECTION POINTER DOWN', this.nodeComponent?.isControlled);
    if (this.nodeComponent) {
      e.stopPropagation();
      setSelectNode({
        id: this.nodeComponent.id,
        containerNode: this.nodeComponent
          .containerNode as unknown as IRectNodeComponent<BaseNodeInfo>,
      });

      this.orgPoints = { ...this.points };

      const elementRect = (
        this.nodeComponent.domElement as unknown as HTMLElement | SVGElement
      ).getBoundingClientRect();

      const { offsetX: startOffsetX, offsetY: startOffsetY } =
        onGetConnectionToThumbOffset(
          ControlAndEndPointNodeType.start,
          this.nodeComponent?.startNodeThumb?.thumbType ?? ThumbType.None
        );
      const { offsetX: endOffsetX, offsetY: endOffsetY } =
        onGetConnectionToThumbOffset(
          ControlAndEndPointNodeType.end,
          this.nodeComponent?.endNodeThumb?.thumbType ?? ThumbType.None
        );
      const bbox = this.getBBoxPath(
        startOffsetX,
        startOffsetY,
        endOffsetX,
        endOffsetY
      );

      if (!this.canvas || !this.rootElement) {
        return;
      }
      const {
        pointerXPos,
        pointerYPos,
        rootX,
        rootY,
        eventClientX,
        eventClientY,
      } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        e
      );

      const { x: rootXCamera, y: rootYCamera } =
        transformCameraSpaceToWorldSpace(rootX, rootY);

      const { x: clientXCamera, y: clientYCamera } =
        transformCameraSpaceToWorldSpace(eventClientX, eventClientY);

      const xpos = clientXCamera - rootXCamera;
      const ypos = clientYCamera - rootYCamera;

      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );
      const rect = this.containerNode
        ? transformCameraSpaceToWorldSpace(elementRect.x, elementRect.y)
        : transformCameraSpaceToWorldSpace(
            elementRect.x - rootX,
            elementRect.y - rootY
          );

      const interactionInfoResult = pointerDown<T>(
        this.containerNode
          ? xpos - this.points.beginX
          : x - rect.x - (this.points.beginX - bbox.x - paddingRect),
        this.containerNode
          ? ypos - this.points.beginY
          : y - rect.y - (this.points.beginY - bbox.y - paddingRect),
        this.nodeComponent,
        this.canvas as IElementNode<T>,
        this.interactionStateMachine
      );
      this.interactionInfo = interactionInfoResult;
    }
  };

  getMultipleConnectionsFromSameOutput() {
    if (this.nodeComponent?.startNode) {
      const connections = this.nodeComponent.startNode.connections;
      if (connections) {
        const filteredConnections = connections.filter(
          (c) =>
            c.startNode &&
            c.startNodeThumb &&
            c.startNodeThumb?.id === this.nodeComponent?.startNodeThumb?.id
        );
        return filteredConnections.length > 1 ? filteredConnections : [];
      }
    }
    return [];
  }

  onUpdate = (
    target?: INodeComponent<T>,
    x?: number,
    y?: number,
    initiator?: INodeComponent<T>,
    inUpdateLoop?: boolean
  ) => {
    const connection = target as unknown as IConnectionNodeComponent<T>;
    if (!target && x === undefined && y === undefined && !initiator) {
      // eslint-disable-next-line no-console
      // update all in this condition...
    }

    if (
      (this.nodeComponent?.startNode?.nodeInfo as BaseNodeInfo)
        ?.outputConnectionInfo?.text &&
      !this.textElement
    ) {
      const info = (this.nodeComponent?.startNode?.nodeInfo as BaseNodeInfo)
        ?.outputConnectionInfo;
      let text = info?.text;
      if (
        info?.fieldName &&
        (this.nodeComponent?.nodeInfo as BaseNodeInfo)?.formValues?.[
          info?.fieldName
        ]
      ) {
        text = parseFloat(
          (this.nodeComponent?.nodeInfo as BaseNodeInfo)?.formValues?.[
            info?.fieldName
          ]
        ).toFixed(2);
      }

      this.textElement = createElement(
        'div',
        {
          class: this.cssClasses.textCssClasses,
          style: {
            transform: `translate(${
              (this.points.beginX + this.points.endX) / 2
            }px, ${(this.points.beginY + this.points.endY) / 2}px)`,
          },
          id: `${this.nodeComponent?.id}_connection-value-label`,
        },
        this.canvasElement,
        text,
        `${this.nodeComponent?.id}_connection-value-label`
      );
    } else if (!this.nodeComponent?.startNode && this.textElement) {
      this.textElement.domElement.remove();
      this.textElement = undefined;
    }
    if (this.nodeComponent && this.nodeComponent.layer) {
      const layer = this.nodeComponent.layer ?? 1;
      const parentDomElement = this.svgParent?.domElement as SVGElement;
      if (layer > 1) {
        if (!parentDomElement.classList.contains(this.cssClasses.layer2)) {
          parentDomElement.classList.add(this.cssClasses.layer2);
        }
      } else {
        if (parentDomElement.classList.contains(this.cssClasses.layer2)) {
          parentDomElement.classList.remove(this.cssClasses.layer2);
        }
      }
    }
    if (this.nodeComponent && this.nodeComponent.isData) {
      (this.nodeComponent.domElement as SVGPathElement).setAttribute(
        'stroke-dasharray',
        '5,5'
      );
    }

    let skipChecks = false;
    let updateThumbs = false;

    if (!target || x === undefined || y === undefined || !initiator) {
      // (
      //   this.pathTransparentElement?.domElement as SVGPathElement
      // ).classList.remove('hidden');
      // if (this.nodeComponent?.startNode && this.nodeComponent?.endNode) {
      //   if (
      //     this.nodeComponent.startNode.nodeInfo?.isInGroup ||
      //     this.nodeComponent.endNode.nodeInfo?.isInGroup
      //   ) {
      //     (
      //       this.pathTransparentElement?.domElement as SVGPathElement
      //     ).classList.add('hidden');
      //   }
      // }
      // needed for updating without using parameters (...update() )
      if (this.nodeComponent?.startNode) {
        const start = this.onCalculateControlPoints(
          this.nodeComponent?.startNode,
          ControlAndEndPointNodeType.start,
          this.nodeComponent.startNodeThumb?.thumbType ??
            (this.nodeComponent.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          this.nodeComponent.startNodeThumb,
          this.nodeComponent.startNodeThumb?.thumbIndex,
          this.nodeComponent.endNode ??
            ({
              x: this.points.endX,
              y: this.points.endY,
              width: 0,
              height: 0,
            } as IRectNodeComponent<T>),
          this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
          this.nodeComponent.endNodeThumb
        );

        this.points.beginX = start.x;
        this.points.beginY = start.y;

        this.points.cx1 = start.cx;
        this.points.cy1 = start.cy;
        skipChecks = true;
        updateThumbs = true;
      } else {
        this.points.cx1 = this.points.beginX + standardControlPointDistance;
        this.points.cy1 = this.points.beginY;
      }

      if (this.nodeComponent?.endNode) {
        const end = this.onCalculateControlPoints(
          this.nodeComponent?.endNode,
          ControlAndEndPointNodeType.end,
          this.nodeComponent.endNodeThumb?.thumbType ??
            (this.nodeComponent.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          this.nodeComponent.endNodeThumb,
          this.nodeComponent.endNodeThumb?.thumbIndex,
          this.nodeComponent.startNode,
          this.nodeComponent.endNodeThumb?.thumbControlPointDistance,
          this.nodeComponent.startNodeThumb
        );
        this.points.endX = end.x;
        this.points.endY = end.y;

        this.points.cx2 = end.cx;
        this.points.cy2 = end.cy;
        skipChecks = true;
        updateThumbs = true;
      } else {
        this.points.cx2 = this.points.endX - standardControlPointDistance;
        this.points.cy2 = this.points.endY;

        if (this.nodeComponent?.startNode) {
          const start = this.onCalculateControlPoints(
            this.nodeComponent?.startNode,
            ControlAndEndPointNodeType.start,
            this.nodeComponent.startNodeThumb?.thumbType ??
              (this.nodeComponent.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None),
            this.nodeComponent.startNodeThumb,
            this.nodeComponent.startNodeThumb?.thumbIndex,
            this.nodeComponent.endNode ??
              ({
                x: this.points.endX,
                y: this.points.endY,
                width: 0,
                height: 0,
              } as IRectNodeComponent<T>),
            this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
            this.nodeComponent.endNodeThumb
          );

          this.points.beginX = start.x;
          this.points.beginY = start.y;

          this.points.cx1 = start.cx;
          this.points.cy1 = start.cy;
        }

        skipChecks = true;

        updateThumbs = true;
      }

      if (!updateThumbs) {
        return false;
      }
    }

    if (
      !skipChecks &&
      target &&
      initiator &&
      x !== undefined &&
      y !== undefined &&
      target.nodeType === NodeType.Connection &&
      (initiator.nodeType === NodeType.Connection ||
        initiator.nodeType === NodeType.Shape)
    ) {
      updateThumbs = true;
      if (connection.startNode && initiator.id === connection.startNode.id) {
        const start = this.onCalculateControlPoints(
          initiator as unknown as IRectNodeComponent<T>,
          ControlAndEndPointNodeType.start,
          connection.startNodeThumb?.thumbType ??
            (connection.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          connection.startNodeThumb,
          connection.startNodeThumb?.thumbIndex,
          connection.endNode ??
            ({
              x: this.points.endX,
              y: this.points.endY,
              width: 0,
              height: 0,
            } as IRectNodeComponent<T>),
          connection.startNodeThumb?.thumbControlPointDistance,
          connection.endNodeThumb
        );
        this.points.beginX = start.x;
        this.points.beginY = start.y;

        this.points.cx1 = start.cx;
        this.points.cy1 = start.cy;
      } else if (connection.endNode && initiator.id === connection.endNode.id) {
        const end = this.onCalculateControlPoints(
          initiator as unknown as IRectNodeComponent<T>,
          ControlAndEndPointNodeType.end,
          connection.endNodeThumb?.thumbType ??
            (connection.isAnnotationConnection
              ? ThumbType.Center
              : ThumbType.None),
          connection.endNodeThumb,
          connection.endNodeThumb?.thumbIndex,
          connection.startNode,
          connection.endNodeThumb?.thumbControlPointDistance,
          connection.startNodeThumb
        );
        this.points.endX = end.x;
        this.points.endY = end.y;

        this.points.cx2 = end.cx;
        this.points.cy2 = end.cy;
      } else {
        const isStaticStart = connection.startNode?.isStaticPosition ?? false;
        const isStaticEnd = connection.endNode?.isStaticPosition ?? false;
        const diffC1x = this.points.cx1 - this.points.beginX;
        const diffC1y = this.points.cy1 - this.points.beginY;
        let diffC2x = this.points.cx2 - this.points.beginX;
        let diffC2y = this.points.cy2 - this.points.beginY;
        let diffEndX = this.points.endX - this.points.beginX;
        let diffEndY = this.points.endY - this.points.beginY;
        if (isStaticStart && !isStaticEnd) {
          // this needs to be the org distance at the moment the drag started...

          diffC2x = this.orgPoints.cx2 - this.points.beginX;
          diffC2y = this.orgPoints.cy2 - this.points.beginY;
          diffEndX = this.orgPoints.endX - this.points.beginX;
          diffEndY = this.orgPoints.endY - this.points.beginY;
        }

        if (!isStaticStart) {
          this.points.beginX = x;
          this.points.beginY = y;

          this.points.cx1 = x + diffC1x;
          this.points.cy1 = y + diffC1y;
        }

        if (!isStaticEnd && !isStaticStart) {
          this.points.cx2 = x + diffC2x;
          this.points.cy2 = y + diffC2y;
          this.points.endX = x + diffEndX;
          this.points.endY = y + diffEndY;
        } else if (!isStaticEnd && isStaticStart) {
          this.points.cx2 = x + diffC2x;
          this.points.cy2 = y + diffC2y;
          this.points.endX = x + diffEndX;
          this.points.endY = y + diffEndY;
        }
      }

      if (this.nodeComponent?.startNode) {
        const circle =
          this.nodeComponent.connectionStartNodeThumb?.getThumbCircleElement?.();
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          this.cssClasses.draggingPointerAuto
        );
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          this.cssClasses.draggingPointerNone
        );
      }

      if (this.nodeComponent?.endNode) {
        const circle =
          this.nodeComponent.connectionEndNodeThumb?.getThumbCircleElement?.();
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          this.cssClasses.draggingPointerAuto
        );
        (circle as unknown as HTMLElement)?.classList?.remove?.(
          this.cssClasses.draggingPointerNone
        );
      }
    } else if (!skipChecks) {
      if (initiator && !initiator.connectionControllerType) {
        return false;
      }
      updateThumbs = true;

      if (initiator && x !== undefined && y !== undefined) {
        if (this.nodeComponent?.startNode) {
          const start = this.onCalculateControlPoints(
            this.nodeComponent?.startNode,
            ControlAndEndPointNodeType.start,
            this.nodeComponent.startNodeThumb?.thumbType ??
              (this.nodeComponent.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None),
            this.nodeComponent.startNodeThumb,
            this.nodeComponent.startNodeThumb?.thumbIndex,
            this.nodeComponent.endNode ??
              ({
                x: this.points.endX,
                y: this.points.endY,
                width: 0,
                height: 0,
              } as IRectNodeComponent<T>),
            this.nodeComponent.startNodeThumb?.thumbControlPointDistance,
            this.nodeComponent.endNodeThumb
          );

          this.points.beginX = start.x;
          this.points.beginY = start.y;

          this.points.cx1 = start.cx;
          this.points.cy1 = start.cy;
        }

        const { offsetX: startOffsetX, offsetY: startOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.start,
            this.nodeComponent?.startNodeThumb?.thumbType ??
              (this.nodeComponent?.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None)
          );
        const { offsetX: endOffsetX, offsetY: endOffsetY } =
          onGetConnectionToThumbOffset(
            ControlAndEndPointNodeType.end,
            this.nodeComponent?.endNodeThumb?.thumbType ??
              (this.nodeComponent?.isAnnotationConnection
                ? ThumbType.Center
                : ThumbType.None)
          );

        if (
          initiator.connectionControllerType === ConnectionControllerType.begin
        ) {
          this.points.beginX = x - startOffsetX;
          this.points.beginY = y - startOffsetY;

          if (!this.nodeComponent?.startNode) {
            this.points.cx1 = this.points.beginX + standardControlPointDistance;
            this.points.cy1 = this.points.beginY;
          }
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.c1
        ) {
          this.points.cx1 = x;
          this.points.cy1 = y;
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.c2
        ) {
          this.points.cx2 = x;
          this.points.cy2 = y;
        } else if (
          initiator.connectionControllerType === ConnectionControllerType.end
        ) {
          this.points.endX = x - endOffsetX;
          this.points.endY = y - endOffsetY;

          if (!this.nodeComponent?.endNode) {
            this.points.cx2 = this.points.endX - standardControlPointDistance;
            this.points.cy2 = this.points.endY;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    if (
      !inUpdateLoop &&
      this.nodeComponent &&
      initiator &&
      initiator.nodeType === NodeType.Connection
    ) {
      if (this.nodeComponent.startNode) {
        this.nodeComponent.startNode.update?.(
          this.nodeComponent.startNode,
          this.points.beginX,
          this.points.beginY,
          this.nodeComponent
        );
      }

      if (this.nodeComponent.endNode) {
        // hack
        let offsetX = 0;
        let offsetY = 0;
        if (
          this.nodeComponent.startNodeThumb?.thumbType !== ThumbType.Center &&
          this.nodeComponent.endNodeThumb?.thumbType === ThumbType.Center &&
          this.nodeComponent.lineType !== LineType.BezierCubic
        ) {
          if (this.points.endX < this.points.beginX) {
            offsetX = 15 + 20;
          } else {
            if (this.points.endY > this.points.beginY) {
              offsetX = 0;
              offsetY = 35;
            } else {
              offsetX = 0;
              offsetY = -35;
            }
          }
        }
        // end hack

        this.nodeComponent.endNode.update?.(
          this.nodeComponent.endNode,
          this.points.endX + offsetX,
          this.points.endY + offsetY,
          this.nodeComponent
        );
      }
    }

    if (this.nodeComponent && !this.nodeComponent.controlPoints) {
      this.nodeComponent.controlPoints = this.initializeControlPoints();
    }

    this.updateControlPoints();

    const { offsetX: startOffsetX, offsetY: startOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.start,
        this.nodeComponent?.startNodeThumb?.thumbType ??
          (this.nodeComponent?.isAnnotationConnection
            ? ThumbType.Center
            : ThumbType.None)
      );
    const { offsetX: endOffsetX, offsetY: endOffsetY } =
      onGetConnectionToThumbOffset(
        ControlAndEndPointNodeType.end,
        this.nodeComponent?.endNodeThumb?.thumbType ??
          (this.nodeComponent?.isAnnotationConnection
            ? ThumbType.Center
            : ThumbType.None)
      );

    const bbox = this.getBBoxPath(
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );
    const pathInfo = this.setPath(
      bbox,
      startOffsetX,
      startOffsetY,
      endOffsetX,
      endOffsetY
    );
    if (updateThumbs && this.nodeComponent) {
      this.nodeComponent.connectionStartNodeThumb?.update?.(
        this.nodeComponent.connectionStartNodeThumb,
        pathInfo.startX ?? this.points.beginX + startOffsetX,
        pathInfo.startY ?? this.points.beginY + startOffsetY,
        this.nodeComponent
      );

      this.nodeComponent.connectionEndNodeThumb?.update?.(
        this.nodeComponent.connectionEndNodeThumb,
        pathInfo.endX ?? this.points.endX + endOffsetX,
        pathInfo.endY ?? this.points.endY + endOffsetY,
        this.nodeComponent
      );
    }

    if (this.nodeComponent) {
      this.nodeComponent.x = this.points.beginX;
      this.nodeComponent.y = this.points.beginY;
      this.nodeComponent.endX = this.points.endX;
      this.nodeComponent.endY = this.points.endY;
    }
    if (this.svgParent) {
      const svgParentElement = this.svgParent
        .domElement as unknown as HTMLElement;
      svgParentElement.style.width = `${bbox.width}px`;
      svgParentElement.style.height = `${bbox.height}px`;
      svgParentElement.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;
    }

    if (this.textElement?.domElement) {
      (
        this.textElement.domElement as HTMLElement
      ).style.transform = `translate(calc(${
        (this.points.beginX + this.points.endX) / 2
      }px - 50%), calc(${
        (this.points.beginY + this.points.endY) / 2
      }px - 50%))`;
    }

    // commented .. when dragging a connection which is connected to a node that also has another connection as output...
    // ... the node connected to this node was not moved

    // const connectionsFromSameoutput =
    //   this.getMultipleConnectionsFromSameOutput();
    // if (
    //   !inUpdateLoop &&
    //   this.nodeComponent?.id &&
    //   connectionsFromSameoutput.length > 0
    // ) {

    //   if (
    //     !initiator ||
    //     (initiator &&
    //       (initiator.id === this.nodeComponent.id ||
    //         initiator.id === this.nodeComponent.startNode?.id ||
    //         initiator.id === this.nodeComponent.endNode?.id) &&
    //       !connectionsFromSameoutput.find((c) => c.id === initiator.id))
    //   ) {

    //     // connectionsFromSameoutput.forEach((c) => {
    //     //   if (c.id !== this.nodeComponent?.id) {
    //     //     c.update?.(c, undefined, undefined, this.nodeComponent, true);
    //     //   }
    //     // });
    //   }
    // }
    return true;
  };

  createArrowMarker(id: string) {
    if (!this.svgParent) {
      return;
    }
    const defs = createNSElement('defs', {}, this.svgParent.domElement);
    if (!defs) {
      return;
    }
    // marked id's reference the whole document, so we need to make them unique
    const marker = createNSElement(
      'marker',
      {
        id: `${id}_arrow`,
        class: this.cssClasses.arrowMarker,
        refX: '1.5',
        refY: '2',
        markerUnits: 'strokeWidth',
        markerWidth: '4',
        markerHeight: '4',
        orient: 'auto',
      },
      defs.domElement
    );
    if (!marker) {
      return;
    }
    createNSElement(
      'path',
      {
        d: 'M0,0 V4 L2,2 Z',
        class: this.cssClasses.arrowMarker,
        fill: 'white',
      },
      marker.domElement
    );

    const markerBegin = createNSElement(
      'marker',
      {
        id: `${id}_arrowbegin`,
        class: this.cssClasses.arrowMarker,
        refX: '2',
        refY: '2',
        markerUnits: 'strokeWidth',
        markerWidth: '4',
        markerHeight: '4',
        orient: 'auto',
      },
      defs.domElement
    );
    if (!markerBegin) {
      return;
    }
    createNSElement(
      'path',
      {
        d: 'M2,2 L2,2 L0,2 Z', // 'M2,0 L2,4 L0,2 Z',
        stroke: 'white',
        fill: 'white',
        class: this.cssClasses.arrowMarker,
      },
      markerBegin.domElement
    );

    const shadowFilter = createNSElement(
      'filter',
      {
        id: `${id}_shadow`,
        x: '-10%',
        y: '-10%',
        height: '120%',
        width: '120%',
        filterUnits: 'userSpaceOnUse',
      },
      defs.domElement
    );

    if (shadowFilter) {
      createNSElement(
        'feDropShadow',
        {
          dx: '2.0',
          dy: '2.0',
          stdDeviation: '1.0',
        },
        shadowFilter.domElement
      );
    }
  }

  protected initializeControlPoints(): { x: number; y: number }[] {
    return [];
  }

  protected setControlPoints(): { x: number; y: number }[] {
    return [];
  }

  protected updateControlPoints(): void {
    //
  }

  protected getPath(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bbox: { x: number; y: number; width: number; height: number },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetY: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetY: number
  ): string {
    return '';
  }

  protected setHiddenPath(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetY: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetY: number
  ): void {
    //
  }

  protected setPath(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bbox: { x: number; y: number; width: number; height: number },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startOffsetY: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetX: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endOffsetY: number
  ): ConnectionStartEndPositions {
    return {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
    };
  }
}
