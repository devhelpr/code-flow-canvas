import {
  InteractionEvent,
  interactionEventState,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { createEffect, getCount } from '../reactivity';
import { createElement } from '../utils/create-element';

export const createNodeElement = (
  tagName: string,
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
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
      return;
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
      return;
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
      return;
    }
  };

  element = createElement(
    tagName,
    {
      class:
        'absolute p-10 select-none cursor-pointer transition-transform ease-in-out duration-[75ms]',
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
          element.domElement.textContent = `Hello world ${Math.floor(
            Math.random() * 100
          )}`;
        }
      },*/
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
    },
    canvasElement,
    'Hello world'
  );
  if (element) {
    element.domElement.id = element.id;
    elements.set(element.id, element);

    createEffect(() => {
      const counter = getCount();
      if (element) {
        element.domElement.textContent = `Hello world ${counter}`;
      }
    });
  }
};
