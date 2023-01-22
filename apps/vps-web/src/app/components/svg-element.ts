import {
  InteractionEvent,
  interactionEventState,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { createNSElement } from '../utils/create-element';

export const createSVGElement = (
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
