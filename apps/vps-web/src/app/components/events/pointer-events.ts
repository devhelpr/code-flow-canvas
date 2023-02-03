import {
  InteractionEvent,
  interactionEventState,
} from '../../interaction-state-machine';
import { DOMElementNode, IElementNode } from '../../interfaces/element';
import { IPointerDownResult } from '../../interfaces/pointers';

export const pointerDown = (
  x: number,
  y: number,
  element: IElementNode,
  canvasElement: DOMElementNode
): IPointerDownResult => {
  let xOffsetWithinElementOnFirstClick = 0;
  let yOffsetWithinElementOnFirstClick = 0;

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
        interactionInfo: {
          xOffsetWithinElementOnFirstClick: x,
          yOffsetWithinElementOnFirstClick: y,
        },
      },
      element
    )
  ) {
    xOffsetWithinElementOnFirstClick = x;
    yOffsetWithinElementOnFirstClick = y;
    (canvasElement as unknown as HTMLElement | SVGElement).append(
      element.domElement
    );
  }
  return {
    xOffsetWithinElementOnFirstClick,
    yOffsetWithinElementOnFirstClick,
  };
};

export const pointerMove = (
  x: number,
  y: number,
  element: IElementNode,
  _canvasElement: DOMElementNode,
  interactionInfo: IPointerDownResult
) => {
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
        interactionInfo,
      },
      element
    )
  ) {
    if (element && element.domElement) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${
        x - interactionInfo.xOffsetWithinElementOnFirstClick
      }px, ${y - interactionInfo.yOffsetWithinElementOnFirstClick}px)`;
    }
  }
};

export const pointerUp = (
  x: number,
  y: number,
  element: IElementNode,
  _canvasElement: DOMElementNode,
  interactionInfo: IPointerDownResult
) => {
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
        interactionInfo,
      },
      element
    )
  ) {
    if (element && element.domElement) {
      (
        element.domElement as unknown as HTMLElement | SVGElement
      ).style.transform = `translate(${
        x - interactionInfo.xOffsetWithinElementOnFirstClick
      }px, ${y - interactionInfo.yOffsetWithinElementOnFirstClick}px)`;
    }
  }
};
