import { DOMElementNode, INodeComponent } from '../interfaces/element';
import { createElement, createNSElement, EventHandler } from './create-element';

export const createNodeComponent = <T>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string
): INodeComponent<T> => {
  const element = createElement<T>(elementName, attributes, parent, content);
  return {
    ...element,
    x: 0,
    y: 0,
    components: [],
  };
};

export const createSVGNodeComponent = <T>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string,
  update?: (
    nodeComponent?: INodeComponent<T>,
    x?: number,
    y?: number
  ) => boolean
): INodeComponent<T> => {
  const element = createNSElement<T>(elementName, attributes, parent, content);
  return {
    ...element,
    x: 0,
    y: 0,
    components: [],
    update: update,
  };
};