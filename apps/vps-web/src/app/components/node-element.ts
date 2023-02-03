import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createEffect, getCount, setCount, setSelectNode } from '../reactivity';
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
  let isClicking = false;
  let isMoving = false;
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
      click: () => {
        console.log('click', element);
        /*if (element) {
          element.domElement.style.backgroundColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
          element.domElement.textContent = `Hello world ${Math.floor(
            Math.random() * 100
          )}`;
        }*/
      },
      pointerdown: (e: PointerEvent) => {
        isClicking = true;
        isMoving = false;
        if (element) {
          const elementRect = (
            element.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();
          interactionInfo = pointerDown(
            e.clientX - elementRect.x,
            e.clientY - elementRect.y,
            element,
            canvasElement
          );
        }
      },
      pointermove: (e: PointerEvent) => {
        const canvasRect = (
          canvasElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();
        if (element) {
          isMoving = true;
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
            const canvasRect = (
              canvasElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();
            pointerUp(
              e.clientX - canvasRect.x,
              e.clientY - canvasRect.y,
              element,
              canvasElement,
              interactionInfo
            );

            if (isClicking && !isMoving) {
              console.log('CLICK', element);
              setCount(getCount() + 1);
              setSelectNode(element.id);
            }
          }
        }
        e.preventDefault();
        e.stopPropagation();

        isMoving = false;
        isClicking = false;

        return false;
      },
      pointerleave: (e: PointerEvent) => {
        isClicking = false;
      },
    },
    canvasElement
  );
  if (element) {
    (element.domElement as unknown as HTMLElement | SVGElement).id = element.id;
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
