import {
  compileMarkup,
  IASTNode,
  IASTTextNode,
} from '@devhelpr/markup-compiler';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { createElement } from '../utils/create-element';

export const createMarkupElement = (
  markup: string,
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  const compiledMarkup = compileMarkup(markup);
  if (!compiledMarkup) {
    throw new Error('Invalid markup');
  }

  let element: IElementNode | undefined = undefined;
  element = createElement(
    compiledMarkup.tagName,
    {
      class: 'absolute p-10 select-none cursor-pointer',
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
    ''
  );
  if (element && element.domElement) {
    if (compiledMarkup.body && element && element.domElement) {
      compiledMarkup.body.forEach((astNode) => {
        console.log(astNode);
        if (element && element.domElement && element.elements) {
          createASTNodeElement(
            astNode,
            element.domElement,
            element.elements,
            (astNode as unknown as IASTTextNode).value
          );
        }
      });
    }
    element.domElement.id = element.id;
    elements.set(element.id, element);
  }
};

export const createASTNodeElement = (
  astNode: IASTNode,
  parentElement: DOMElementNode,
  elements: IElementNode[],
  text = ''
) => {
  let element: IElementNode | undefined = undefined;
  element = createElement(
    astNode.tagName,
    {
      class: '',
    },
    parentElement,
    text
  );
  if (element) {
    element.domElement.id = element.id;
    elements.push(element);
  }
};
