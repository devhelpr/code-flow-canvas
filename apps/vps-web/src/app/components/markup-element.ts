import {
  compileMarkup,
  IASTNode,
  IASTTextNode,
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

  let xOffsetWithinElementOnFirstClick = 0;
  let yOffsetWithinElementOnFirstClick = 0;

  let element: IElementNode | undefined = undefined;

  const pointerDown = (x: number, y: number) => {
    if (
      element &&
      interactionEventState(
        InteractionEvent.PointerDown,
        {
          id: element.id,
          type: 'MarkupElement',
          pointerDown,
          pointerMove,
          pointerUp,
        },
        element
      )
    ) {
      xOffsetWithinElementOnFirstClick = x;
      yOffsetWithinElementOnFirstClick = y;
      canvasElement.append(element.domElement);
    }
  };

  const pointerMove = (x: number, y: number) => {
    if (
      element &&
      interactionEventState(
        InteractionEvent.PointerMove,
        {
          id: element.id,
          type: 'MarkupElement',
          pointerDown,
          pointerMove,
          pointerUp,
        },
        element
      )
    ) {
      if (element && element.domElement) {
        element.domElement.style.transform = `translate(${
          x - xOffsetWithinElementOnFirstClick
        }px, ${y - yOffsetWithinElementOnFirstClick}px)`;
      }
    }
  };

  const pointerUp = (x: number, y: number) => {
    if (
      element &&
      interactionEventState(
        InteractionEvent.PointerUp,
        {
          id: element.id,
          type: 'MarkupElement',
          pointerDown,
          pointerMove,
          pointerUp,
        },
        element
      )
    ) {
      if (element && element.domElement) {
        element.domElement.style.transform = `translate(${
          x - xOffsetWithinElementOnFirstClick
        }px, ${y - yOffsetWithinElementOnFirstClick}px)`;
      }
    }
  };

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
          pointerDown(e.clientX - elementRect.x, e.clientY - elementRect.y);
          return;
        }
      },
      pointermove: (e: PointerEvent) => {
        const canvasRect = canvasElement.getBoundingClientRect();
        if (element) {
          if (element && element.domElement) {
            pointerMove(e.clientX - canvasRect.x, e.clientY - canvasRect.y);
          }
          return;
        }
      },
      pointerup: (e: PointerEvent) => {
        if (element) {
          if (element && element.domElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            pointerUp(e.clientX - canvasRect.x, e.clientY - canvasRect.y);
          }
          return;
        }
      },
      pointerleave: (e: PointerEvent) => {
        console.log('pointerleave element', event);
        /*
        if (
          element &&
          interactionEventState(InteractionEvent.PointerLeave, {
            id: element.id,
            type: 'MarkupElement',
          }, element)
        ) {
          return;
        }
        */
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
