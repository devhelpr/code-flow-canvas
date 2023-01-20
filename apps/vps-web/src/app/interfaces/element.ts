export interface IElementNode {
  id: string;
  domElement: DOMElementNode;
  elements: IElementNode[];
}

export type DOMElementNode = HTMLElement | SVGElement;
export type ElementNodeMap = Map<string, IElementNode>;
