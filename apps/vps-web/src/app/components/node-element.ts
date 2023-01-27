import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createEffect, getCount } from '../reactivity';
import { createElement } from '../utils/create-element';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

export const createNodeElement = (
  tagName: string,
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };
  let element: IElementNode | undefined = undefined;

  element = createElement(
    tagName,
    {
      class: `
        absolute
        select-none cursor-pointer
        transition-transform
        ease-in-out duration-[75ms]
        `,
      style: {
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
          interactionInfo = pointerDown(
            e.clientX - elementRect.x,
            e.clientY - elementRect.y,
            element,
            canvasElement
          );
          return;
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
          return;
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
          return;
        }
      },
    },
    canvasElement
  );
  if (element) {
    element.domElement.id = element.id;
    elements.set(element.id, element);

    const childElement = createElement(
      'div',
      {
        class: 'translate-x-[-50%]  p-10',
        style: {
          'background-color':
            '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      },
      element.domElement,
      'Hello world'
    );

    createEffect(() => {
      const counter = getCount();
      // if (element) {
      //   element.domElement.textContent = `Hello world ${counter}`;
      // }
      if (childElement) {
        childElement.domElement.textContent = `Hello world ${counter}`;
      }
    });
  }
};
