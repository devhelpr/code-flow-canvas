import { ShapeType } from '../types/shape-type';

export interface IElementNode<T> {
  id: string;
  domElement: DOMElementNode;
  elements: IElementNode<T>[];
  nodeInfo?: T;
}

export type DOMElementNode = HTMLElement | SVGElement | Text;
export type ElementNodeMap<T> = Map<string, IElementNode<T>>;

export enum NodeComponentRelationType {
  self = 'self',
  childComponent = 'childComponent',
  controller = 'controller',
  sibling = 'sibling',
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
  parent?: INodeComponent<T>;
  x: number;
  y: number;
  xEnd?: number;
  yEnd?: number;
  width?: number;
  height?: number;
  specifier?: string;
  nodeType?: string;
  components: INodeComponentRelation<T>[];
  startNode?: INodeComponent<T>;
  endNode?: INodeComponent<T>;
  isControlled?: boolean;
  isConnectPoint?: boolean;
  shapeType?: ShapeType;
  update?: (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => boolean;
  pointerDown?: () => void;
  pointerMove?: () => void;
  pointerUp?: () => void;
  onClick?: () => void;
  onCanReceiveDroppedComponent?: (component: INodeComponent<T>) => boolean;
  onReceiveDroppedComponent?: (component: INodeComponent<T>) => void;
}
