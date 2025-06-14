import { IFlowCanvasBase } from '../canvas-app/flow-canvas';
import { ConnectionControllerType, ThumbType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { LineType } from '../types/line-type';
import { NodeType } from '../types/node-type';

export interface IDOMElement {
  id: string;
  domElement: DOMElementNode;
}

export interface IElementNode<T extends BaseNodeInfo> {
  id: string;
  domElement: DOMElementNode;
  elements: ElementNodeMap<T>;
  nodeInfo?: T;
}

export type DOMElementNode = HTMLElement | SVGElement | Text;
export type ElementNodeMap<T extends BaseNodeInfo> = Map<
  string,
  IElementNode<T>
>;

export interface INodeComponent<T extends BaseNodeInfo>
  extends IElementNode<T> {
  parent?: INodeComponent<T>;
  x: number;
  y: number;
  width?: number;
  height?: number;

  offsetX?: number;
  offsetY?: number;
  radius?: number;

  connectionControllerType?: ConnectionControllerType;
  nodeType?: NodeType;
  pathName?: string;

  isControlled?: boolean;
  isConnectPoint?: boolean;

  thumbConnectors?: IThumbNodeComponent<T>[];
  containerNode?: IRectNodeComponent<T>;
  nestedLevel?: number;

  label?: string;

  getParentedCoordinates?: () => { x: number; y: number };
  update?: (
    target?: INodeComponent<T>,
    x?: number,
    y?: number,
    initiator?: INodeComponent<T>,
    inUpdateLoop?: boolean
  ) => boolean;
  updateEnd?: () => void;
  initPointerDown?: (initialXOffset: number, initialYOffset: number) => void;
  pointerDown?: () => void;
  pointerMove?: () => void;
  pointerUp?: () => void;
  onClick?: () => void;
  onCanReceiveDroppedComponent?: (
    thumbNode: IThumbNodeComponent<T>,
    component: IConnectionNodeComponent<T>,
    receivingThumbNode: IThumbNodeComponent<T>
  ) => boolean;
  onReceiveDraggedConnection?: (
    thumbNode: IThumbNodeComponent<T>,
    component: INodeComponent<T>
  ) => void;

  setVisibility?: (isVisible: boolean) => void;
  delete?: () => void;
  getThumbCircleElement?: () => HTMLElement | SVGElement;
}

export interface IRectNodeComponent<T extends BaseNodeInfo>
  extends INodeComponent<T> {
  connections: IConnectionNodeComponent<T>[];
  isStaticPosition?: boolean;
  isCircle?: boolean;
  isThumb?: boolean;
  canvasAppInstance?: IFlowCanvasBase<T>;
  canBeResized?: boolean;
  thumbs: IThumb[];
  isSettingSize?: boolean;
  setSize: (width: number, height: number) => void;
  groupNode?: IRectNodeComponent<T>;
  nodesInGroup?: IRectNodeComponent<T>[];
  restrictHeight?: number;
  restrictWidth?: number;
}

export interface IConnectionNodeComponent<T extends BaseNodeInfo>
  extends INodeComponent<T> {
  endX: number;
  endY: number;
  lineType?: LineType;
  connectorWrapper?: IElementNode<T>;
  pathElement?: IElementNode<T>;

  controlPoints?: { x: number; y: number }[];
  connectionStartNodeThumb?: IThumbNodeComponent<T>;
  connectionEndNodeThumb?: IThumbNodeComponent<T>;
  startNode?: IRectNodeComponent<T>;
  endNode?: IRectNodeComponent<T>;
  controlPointNodes?: IThumbNodeComponent<T>[];
  startNodeThumb?: IThumbNodeComponent<T>;
  endNodeThumb?: IThumbNodeComponent<T>;
  isData?: boolean;
  layer?: number;
  isAnnotationConnection?: boolean;
  isLoopBack?: boolean;
  hasMultipleOutputs?: boolean;
  onCalculateControlPoints: (
    rectNode: IRectNodeComponent<T>,
    nodeType: ControlAndEndPointNodeType,
    thumbType: ThumbType,
    rectNodeThumb?: IThumbNodeComponent<T>,
    index?: number,
    connectedNode?: IRectNodeComponent<T>,
    controlPointDistance?: number,
    connectedNodeThumb?: IThumbNodeComponent<T>
  ) => IControlAndEndPoint;
}

export interface IThumbNodeComponent<T extends BaseNodeInfo>
  extends INodeComponent<T> {
  thumbIndex?: number;
  thumbType?: ThumbType;
  thumbName: string;
  thumbIdentifierWithinNode?: string;
  thumbLinkedToNode?: IRectNodeComponent<T>;

  thumbControlPointDistance?: number;
  thumbConnectionType?: ThumbConnectionType;

  thumbConstraint?: string | string[];
  allowTaskTypes?: string[];
  thumbLabel?: string;
  isDataPort?: boolean;
  maxConnections?: number;

  thumbFormId?: string;
  thumbFormFieldName?: string;

  prefixIcon?: string;
  prefixIconColor?: string;
  prefixLabel?: string;
  hint?: string;
}

export const ControlAndEndPointNodeType = {
  start: 'start',
  end: 'end',
} as const;

export type ControlAndEndPointNodeType =
  (typeof ControlAndEndPointNodeType)[keyof typeof ControlAndEndPointNodeType];

export const CurveType = {
  bezierCubic: 'bezier-cubic',
  bezierQuadratic: 'bezier-quadratic',
  straight: 'straight',
} as const;

export type CurveType = (typeof CurveType)[keyof typeof CurveType];

export interface IControlAndEndPoint {
  x: number;
  y: number;
  cx: number;
  cy: number;
  nodeType: ControlAndEndPointNodeType;
}

export const ThumbConnectionType = {
  start: 'start',
  end: 'end',
  startOrEnd: 'startOrEnd',
} as const;

export type ThumbConnectionType =
  (typeof ThumbConnectionType)[keyof typeof ThumbConnectionType];

export type IThumb = {
  thumbIdentifierWithinNode?: string;
  name?: string;
  thumbType: ThumbType;
  thumbIndex: number;
  connectionType: ThumbConnectionType;
  pathName?: string;
  color?: string;
  controlPointDistance?: number;
  hidden?: boolean;
  label?: string;
  thumbConstraint?: string | string[];
  allowTaskTypes?: string[];
  thumbShape?: 'circle' | 'diamond';
  isDataPort?: boolean;
  maxConnections?: number;
  class?: string;
  formId?: string;
  formFieldName?: string;
  prefixIcon?: string;
  prefixIconColor?: string;
  prefixLabel?: string;
  prefixLabelCssClass?: string;
  nodeId?: string;
  hint?: string;
  internalName?: string;
};

export interface ConnectionStartEndPositions {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
