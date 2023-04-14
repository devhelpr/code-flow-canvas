import { DOMElementNode, IElementNode } from '../interfaces/element';
import { createElementMap } from './create-element-map';

export type EventHandler = (event: Event) => void | boolean;

export const createElement = <T>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string
): IElementNode<T> => {
  const id = crypto.randomUUID();
  let domElement: HTMLElement | Text | undefined = undefined;
  let isTextNode = false;
  if (!elementName && content) {
    isTextNode = true;
    domElement = document.createTextNode(content);
  } else {
    domElement = document.createElement(elementName);
  }
  if (domElement && attributes && !isTextNode) {
    Object.keys(attributes).forEach((key) => {
      if (typeof attributes[key] === 'object') {
        Object.keys(attributes[key]).forEach((styleProperty: string) => {
          console.log(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
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
    domElement.textContent = content;
  }
  return {
    id: id,
    domElement: domElement,
    elements: createElementMap<T>(),
  };
};

export const createNSElement = <T>(
  elementName: string,
  attributes?: Record<string, string | number | object | EventHandler>,
  parent?: DOMElementNode,
  content?: string
): IElementNode<T> => {
  const id = crypto.randomUUID();
  const domElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    elementName
  );
  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      if (typeof attributes[key] === 'object') {
        Object.keys(attributes[key]).forEach((styleProperty: string) => {
          console.log(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
          domElement.style.setProperty(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
        });
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
    id: id,
    domElement: domElement,
    elements: createElementMap<T>(),
  };
};
