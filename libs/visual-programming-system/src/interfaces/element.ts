import { ThumbType } from '../types';
import { LineType } from '../types/line-type';
import { ShapeType } from '../types/shape-type';

export interface IElementNode<T> {
  id: string;
  domElement: DOMElementNode;
  elements: ElementNodeMap<T>;
  nodeInfo?: T;
}

export type DOMElementNode = HTMLElement | SVGElement | Text;
export type ElementNodeMap<T> = Map<string, IElementNode<T>>;

export interface INodeComponent<T> extends IElementNode<T> {
  parent?: IRectNodeComponent<T>;
  x: number;
  y: number;
  width?: number;
  height?: number;

  offsetX?: number;
  offsetY?: number;
  radius?: number;

  lineType?: LineType;
  controlPoints?: { x: number; y: number }[];

  specifier?: string;
  nodeType?: string;
  pathName?: string;

  isControlled?: boolean;
  isConnectPoint?: boolean;
  shapeType?: ShapeType;

  thumbConnectors?: IThumbNodeComponent<T>[];
  update?: (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
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
  onReceiveDroppedComponent?: (
    thumbNode: IThumbNodeComponent<T>,
    component: INodeComponent<T>
  ) => void;

  setVisibility?: (isVisible: boolean) => void;
  delete?: () => void;
  getThumbCircleElement?: () => HTMLElement | SVGElement;
}

export interface IRectNodeComponent<T> extends INodeComponent<T> {
  connections?: IConnectionNodeComponent<T>[];
}

export interface IConnectionNodeComponent<T> extends INodeComponent<T> {
  startNode?: IRectNodeComponent<T>;
  endNode?: IRectNodeComponent<T>;
  controlPointNodes?: IThumbNodeComponent<T>[];
  startNodeThumb?: IThumbNodeComponent<T>;
  endNodeThumb?: IThumbNodeComponent<T>;
  onCalculateControlPoints: (
    rectNode: IRectNodeComponent<T>,
    nodeType: ControlAndEndPointNodeType,
    thumbType: ThumbType,
    index?: number,
    connectedNode?: IRectNodeComponent<T>,
    thumbOffsetY?: number,
    controlPointDistance?: number,
    connectedNodeThumb?: IThumbNodeComponent<T>
  ) => IControlAndEndPoint;
}

export interface IThumbNodeComponent<T> extends INodeComponent<T> {
  thumbIndex?: number;
  thumbOffsetY?: number;
  thumbType?: ThumbType;
  thumbName: string;
  thumbLinkedToNode?: IRectNodeComponent<T>;

  thumbControlPointDistance?: number;
  thumbConnectionType?: ThumbConnectionType;

  thumbConstraint?: string;
  thumbLabel?: string;
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
  name?: string;
  thumbType: ThumbType;
  thumbIndex: number;
  connectionType: ThumbConnectionType;
  pathName?: string;
  color?: string;
  offsetY?: number;
  controlPointDistance?: number;
  hidden?: boolean;
  label?: string;
  thumbConstraint?: string;
  thumbShape?: 'circle' | 'diamond';
};
