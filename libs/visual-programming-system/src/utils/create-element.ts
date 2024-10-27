import {
  DOMElementNode,
  IDOMElement,
  IElementNode,
} from '../interfaces/element';
import { BaseNodeInfo } from '../types/base-node-info';
import { createElementMap } from './create-element-map';

export type EventHandler = (event: Event) => void | boolean;

export const renderElement = (
  element: JSX.Element,
  parent?: HTMLElement | null
) => {
  if (!parent) {
    return;
  }
  parent.appendChild(element as unknown as HTMLElement);
};

export const createElement = (
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string | HTMLElement | JSX.Element,
  id?: string
): IDOMElement | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const nodeId = id ?? crypto.randomUUID();
  let domElement: HTMLElement | Text | undefined = undefined;
  let isTextNode = false;
  if (!elementName && content) {
    if (typeof content === 'string') {
      isTextNode = true;
      domElement = document.createTextNode(content);
    } else {
      domElement = document.createElement('div');
    }
  } else {
    domElement = document.createElement(elementName);
  }
  if (domElement && attributes && !isTextNode) {
    Object.keys(attributes).forEach((key) => {
      if (typeof attributes[key] === 'object') {
        Object.keys(attributes[key]).forEach((styleProperty: string) => {
          (domElement as unknown as HTMLElement).style.setProperty(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
        });
      } else if (typeof attributes[key] === 'function') {
        (domElement as unknown as HTMLElement).addEventListener(
          key,
          attributes[key] as EventHandler
        );
      } else if (typeof attributes[key] === 'string') {
        (domElement as unknown as HTMLElement).setAttribute(
          key,
          attributes[key] as string
        );
      } else if (typeof attributes[key] === 'number') {
        (domElement as unknown as HTMLElement).setAttribute(
          key,
          attributes[key].toString()
        );
      }
    });
  }
  if (parent) {
    parent.appendChild(domElement);
  }
  if (content && elementName) {
    if (typeof content === 'string') {
      domElement.textContent = content;
    } else {
      domElement.appendChild(content as unknown as HTMLElement);
    }
  }
  return {
    id: nodeId,
    domElement: domElement,
  };
};

export const createNodeElement = <T extends BaseNodeInfo>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string | HTMLElement | JSX.Element,
  id?: string
): IElementNode<T> | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const nodeId = id ?? crypto.randomUUID();
  let domElement: HTMLElement | Text | undefined = undefined;
  let isTextNode = false;
  if (!elementName && content) {
    if (typeof content === 'string') {
      isTextNode = true;
      domElement = document.createTextNode(content);
    } else {
      domElement = document.createElement('div');
    }
  } else {
    domElement = document.createElement(elementName);
  }
  if (domElement && attributes && !isTextNode) {
    Object.keys(attributes).forEach((key) => {
      if (typeof attributes[key] === 'object') {
        Object.keys(attributes[key]).forEach((styleProperty: string) => {
          (domElement as unknown as HTMLElement).style.setProperty(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
        });
      } else if (typeof attributes[key] === 'function') {
        (domElement as unknown as HTMLElement).addEventListener(
          key,
          attributes[key] as EventHandler
        );
      } else if (typeof attributes[key] === 'string') {
        (domElement as unknown as HTMLElement).setAttribute(
          key,
          attributes[key] as string
        );
      } else if (typeof attributes[key] === 'number') {
        (domElement as unknown as HTMLElement).setAttribute(
          key,
          attributes[key].toString()
        );
      }
    });
  }
  if (parent) {
    parent.appendChild(domElement);
  }
  if (content && elementName) {
    if (typeof content === 'string') {
      domElement.textContent = content;
    } else {
      domElement.appendChild(content as unknown as HTMLElement);
    }
  }
  return {
    id: nodeId,
    domElement: domElement,
    elements: createElementMap<T>(),
  };
};

export const createNSElement = <T extends BaseNodeInfo>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string,
  id?: string
): IElementNode<T> | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const nodeId = id ?? crypto.randomUUID();
  const domElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    elementName
  );
  domElement.id = `${nodeId}`;
  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      if (typeof attributes[key] === 'object' && key === 'style') {
        Object.keys(attributes[key]).forEach((styleProperty: string) => {
          // console.log(
          //   styleProperty,
          //   (attributes[key] as unknown as any)[styleProperty]
          // );
          domElement.style.setProperty(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
        });
      } else if (
        (typeof attributes[key] === 'object' ||
          Array.isArray(attributes[key])) &&
        key !== 'style' &&
        key in domElement
      ) {
        (domElement as any)[key] = attributes[key];
      } else if (typeof attributes[key] === 'function') {
        domElement.addEventListener(key, attributes[key] as EventHandler);
      } else if (typeof attributes[key] === 'string') {
        domElement.setAttribute(key, attributes[key] as string);
      } else if (typeof attributes[key] === 'number') {
        domElement.setAttribute(key, attributes[key].toString());
      }
    });
  }
  if (parent) {
    parent.appendChild(domElement);
  }
  if (content) {
    domElement.textContent = content;
  }
  return {
    id: nodeId,
    domElement: domElement,
    elements: createElementMap<T>(),
  };
};
