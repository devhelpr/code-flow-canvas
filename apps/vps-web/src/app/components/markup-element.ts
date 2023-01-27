import {
  compileMarkup,
  IASTNode,
  IASTTextNode,
  IASTTree,
} from '@devhelpr/markup-compiler';
import {
  InteractionEvent,
  interactionEventState,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createElement } from '../utils/create-element';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

export const createMarkupElement = (
  markup: string,
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  const compiledMarkup = compileMarkup(markup);
  if (!compiledMarkup) {
    throw new Error('Invalid markup');
  }

  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };

  let element: IElementNode | undefined = undefined;

  element = createElement(
    compiledMarkup.tagName,
    {
      class:
        'absolute p-10 select-none cursor-pointer text-center transition-transform ease-in-out duration-[75ms]',
      style: {
        'background-color':
          '#' + Math.floor(Math.random() * 16777215).toString(16),
        transform: `translate(${Math.floor(
          Math.random() * 1024
        )}px, ${Math.floor(Math.random() * 500)}px)`,
      },
      /*click: () => {
        console.log(element);
        if (element) {
          element.domElement.style.backgroundColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
        }
      },
      */
      pointerdown: (e: PointerEvent) => {
        if (element) {
          const elementRect = element.domElement.getBoundingClientRect();
          interactionInfo = pointerDown(
            e.clientX - elementRect.x,
            e.clientY - elementRect.y,
            element,
            canvasElement
          );
        }
      },
      pointermove: (e: PointerEvent) => {
        const canvasRect = canvasElement.getBoundingClientRect();
        if (element) {
          if (element && element.domElement) {
            pointerMove(
              e.clientX - canvasRect.x,
              e.clientY - canvasRect.y,
              element,
              canvasElement,
              interactionInfo
            );
          }
        }
      },
      pointerup: (e: PointerEvent) => {
        if (element) {
          if (element && element.domElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            pointerUp(
              e.clientX - canvasRect.x,
              e.clientY - canvasRect.y,
              element,
              canvasElement,
              interactionInfo
            );
          }
        }
      },
      pointerleave: (e: PointerEvent) => {
        console.log('pointerleave element', event);
      },
    },
    canvasElement,
    ''
  );
  if (element && element.domElement) {
    console.log(
      'compiledMarkup',
      compiledMarkup,
      Array.isArray(compiledMarkup.body)
    );
    if (compiledMarkup.body && element && element.domElement) {
      if (Array.isArray(compiledMarkup.body)) {
        (compiledMarkup.body as unknown as IASTNode[]).forEach((astNode) => {
          console.log(astNode);
          if (element && element.domElement && element.elements) {
            createASTNodeElement(
              astNode,
              element.domElement,
              element.elements,
              (astNode as unknown as IASTTextNode).value ?? ''
            );
          }
        });
      } else {
        console.log(compiledMarkup.body);
        createASTNodeElement(
          compiledMarkup.body,
          element.domElement,
          element.elements,
          (compiledMarkup.body as unknown as IASTTextNode).value ?? ''
        );
      }
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
  if (Array.isArray((astNode as unknown as IASTTree).body)) {
    ((astNode as unknown as IASTTree).body as unknown as IASTNode[]).forEach(
      (astNode) => {
        console.log(astNode);
        createASTNodeElement(
          astNode,
          parentElement,
          elements,
          (astNode as unknown as IASTTextNode).value ?? ''
        );
      }
    );
  } else if (
    (astNode as unknown as IASTTree).body &&
    ((astNode as unknown as IASTTree).body as any).tagName
  ) {
    createASTNodeElement(
      (astNode as unknown as any).body as unknown as IASTNode,
      parentElement,
      elements,
      (astNode as unknown as IASTTextNode).value ?? ''
    );
  } else {
    let element: IElementNode | undefined = undefined;
    element = createElement(
      astNode?.tagName ?? 'div',
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
  }
};
