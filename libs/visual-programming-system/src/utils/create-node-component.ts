import { DOMElementNode, INodeComponent } from '../interfaces/element';
import { BaseNodeInfo } from '../types/base-node-info';
import {
  createNodeElement,
  createNSElement,
  EventHandler,
} from './create-element';

export const createNodeComponent = <T extends BaseNodeInfo>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string,
  id?: string
): INodeComponent<T> | undefined => {
  const element = createNodeElement<T>(
    elementName,
    attributes,
    parent,
    content,
    id
  );
  if (!element) {
    return;
  }
  return {
    ...element,
    x: 0,
    y: 0,
  };
};

export const createSVGNodeComponent = <T extends BaseNodeInfo>(
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
): INodeComponent<T> | undefined => {
  const element = createNSElement<T>(
    elementName,
    attributes,
    parent,
    content,
    id
  );
  if (!element) {
    return;
  }
  return {
    ...element,
    x: 0,
    y: 0,
    update: update,
  };
};
