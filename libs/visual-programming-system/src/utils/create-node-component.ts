import { DOMElementNode, INodeComponent } from '../interfaces/element';
import {
  createNodeElement,
  createNSElement,
  EventHandler,
} from './create-element';

export const createNodeComponent = <T>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string,
  id?: string
): INodeComponent<T> => {
  const element = createNodeElement<T>(
    elementName,
    attributes,
    parent,
    content,
    id
  );
  return {
    ...element,
    x: 0,
    y: 0,
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
  ) => boolean,
  id?: string
): INodeComponent<T> => {
  const element = createNSElement<T>(
    elementName,
    attributes,
    parent,
    content,
    id
  );
  return {
    ...element,
    x: 0,
    y: 0,
    update: update,
  };
};
