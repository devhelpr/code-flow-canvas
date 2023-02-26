import { DOMElementNode, INodeComponent } from '../interfaces/element';
import { createElement, createNSElement, EventHandler } from './create-element';

export const createNodeComponent = (
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string
): INodeComponent => {
  const element = createElement(elementName, attributes, parent, content);
  return {
    ...element,
    x: 0,
    y: 0,
    components: [],
  };
};

export const createSVGNodeComponent = (
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string,
  update?: (nodeComponent: INodeComponent, x: number, y: number) => void
): INodeComponent => {
  const element = createNSElement(elementName, attributes, parent, content);
  return {
    ...element,
    x: 0,
    y: 0,
    components: [],
    update: update,
  };
};
