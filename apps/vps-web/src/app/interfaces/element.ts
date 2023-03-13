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
  x: number;
  y: number;
  xEnd?: number;
  yEnd?: number;
  width?: number;
  height?: number;
  specifier?: string;
  nodeType?: string;
  components: INodeComponentRelation[];
  isControlled?: boolean;
  update?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => boolean;
}
