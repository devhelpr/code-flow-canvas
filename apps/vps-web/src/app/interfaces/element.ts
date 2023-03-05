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
}
export interface INodeComponentRelation {
  component: INodeComponent;
  type: NodeComponentRelationType;
  connectionStart?: INodeComponent;
  connectionEnd?: INodeComponent;
  update?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => void;
  commitUpdate?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => void;
}

export interface INodeComponent extends IElementNode {
  x: number;
  y: number;
  xEnd?: number;
  yEnd?: number;
  specifier?: string;
  nodeType?: string;
  components: INodeComponentRelation[];
  update?: (
    component: INodeComponent,
    x: number,
    y: number,
    actionComponent: INodeComponent
  ) => void;
}
