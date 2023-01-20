import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { createElement } from '../utils/create-element';

export const createNodeElement = (
  tagName: string,
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  let element: IElementNode | undefined = undefined;
  element = createElement(
    tagName,
    {
      class: 'absolute p-10',
      style: {
        'background-color':
          '#' + Math.floor(Math.random() * 16777215).toString(16),
        transform: `translate(${Math.floor(
          Math.random() * 1024
        )}px, ${Math.floor(Math.random() * 500)}px)`,
      },
      click: () => {
        console.log(element);
        if (element) {
          element.domElement.style.backgroundColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
        }
      },
    },
    canvasElement,
    'Hello world'
  );
  if (element) {
    element.domElement.id = element.id;
    elements.set(element.id, element);
  }
};
