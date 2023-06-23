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

export enum NodeComponentRelationType {
  self = 'self',
  //childComponent = 'childComponent',
  controller = 'controller',
  //sibling = 'sibling',
  controllerTarget = 'controllerTarget',
  connection = 'connection',
  start = 'start',
  end = 'end',
}
export interface INodeComponentRelation<T> {
  component: INodeComponent<T>;
  type: NodeComponentRelationType;
  // connectionStart?: INodeComponent;
  // connectionEnd?: INodeComponent;
  update?: (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => boolean;
  commitUpdate?: (
    component: INodeComponent<T>,
    x: number,
    y: number,
    actionComponent: INodeComponent<T>
  ) => void;
  controllers?: any;
}

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
  components: INodeComponentRelation<T>[];

  isControlled?: boolean;
  isConnectPoint?: boolean;
  shapeType?: ShapeType;

  thumbIndex?: number;
  thumbOffsetY?: number;
  thumbType?: ThumbType;
  thumbName?: string;
  thumbLinkedToNode?: IRectNodeComponent<T>;

  thumbControlPointDistance?: number;
  thumbConnectionType?: ThumbConnectionType;
  thumbConnectors?: INodeComponent<T>[];
  update?: (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => boolean;
  initPointerDown?: (initialXOffset: number, initialYOffset: number) => void;
  pointerDown?: () => void;
  pointerMove?: () => void;
  pointerUp?: () => void;
  onClick?: () => void;
  onCanReceiveDroppedComponent?: (
    thumbNode: INodeComponent<T>,
    component: INodeComponent<T>
  ) => boolean;
  onReceiveDroppedComponent?: (
    thumbNode: INodeComponent<T>,
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

  startNodeThumb?: INodeComponent<T>;
  endNodeThumb?: INodeComponent<T>;
  onCalculateControlPoints?: (
    rectNode: IRectNodeComponent<T>,
    nodeType: ControlAndEndPointNodeType,
    thumbType: ThumbType,
    index?: number,
    connectedNode?: IRectNodeComponent<T>,
    thumbOffsetY?: number,
    controlPointDistance?: number,
    connectedNodeThumb?: INodeComponent<T>
  ) => IControlAndEndPoint;
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
};
