import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createNSElement } from '../utils/create-element';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

export const createSVGElement = (
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };
  let element: IElementNode | undefined = undefined;
  element = createNSElement(
    'svg',
    {
      class:
        'absolute cursor-pointer transition-transform ease-in-out duration-[75ms]',
      style: {
        transform: `translate(${Math.floor(
          Math.random() * 1024
        )}px, ${Math.floor(Math.random() * 500)}px)`,
      },
      width: 100,
      height: 100,
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
  element.domElement.id = element.id;
  if (element) {
    let circleElement: IElementNode | undefined = undefined;
    circleElement = createNSElement(
      'circle',
      {
        cx: 50,
        cy: 50,
        r: 40,
        stroke: 'black',
        'stroke-width': 3,
        fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
      element.domElement
    );
    elements.set(element.id, element);
    element.elements.push(circleElement);
  }
};
