export interface IElementNode {
  id: string;
  domElement: DOMElementNode;
  elements: IElementNode[];
}

export type DOMElementNode = HTMLElement | SVGElement | Text;
export type ElementNodeMap = Map<string, IElementNode>;

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
export interface INodeComponentRelation {
  component: INodeComponent;
  type: NodeComponentRelationType;
  // connectionStart?: INodeComponent;
  // connectionEnd?: INodeComponent;
  update?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => boolean;
  commitUpdate?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => void;
  controllers?: any;
}

export interface INodeComponent extends IElementNode {
  parent?: INodeComponent;
  x: number;
  y: number;
  xEnd?: number;
  yEnd?: number;
  width?: number;
  height?: number;
  specifier?: string;
  nodeType?: string;
  components: INodeComponentRelation[];
  startNode?: INodeComponent;
  endNode?: INodeComponent;
  isControlled?: boolean;
  isConnectPoint?: boolean;
  update?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => boolean;
  pointerDown?: () => void;
  pointerMove?: () => void;
  pointerUp?: () => void;
  onCanReceiveDroppedComponent?: (component: INodeComponent) => boolean;
  onReceiveDroppedComponent?: (component: INodeComponent) => void;
}
