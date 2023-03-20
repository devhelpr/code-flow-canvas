import {
  InteractionEvent,
  interactionEventState,
} from '../../interaction-state-machine';
import {
  DOMElementNode,
  INodeComponent,
  NodeComponentRelationType,
} from '../../interfaces/element';
import { IPointerDownResult } from '../../interfaces/pointers';

export const pointerDown = (
  x: number,
  y: number,
  element: INodeComponent,
  canvasElement: DOMElementNode
): IPointerDownResult | false => {
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
    if (element?.nodeType !== 'connection') {
      (canvasElement as unknown as HTMLElement | SVGElement).append(
        element.domElement
      );
    }

    if (element.pointerDown) {
      element.pointerDown();
    }

    return {
      xOffsetWithinElementOnFirstClick,
      yOffsetWithinElementOnFirstClick,
    };
  }
  return false;
};

export const pointerMove = (
  x: number,
  y: number,
  element: INodeComponent,
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
      //if (element.nodeType !== 'connection') {
      // (
      //   element.domElement as unknown as HTMLElement | SVGElement
      // ).style.transform = `translate(${
      //   x - interactionInfo.xOffsetWithinElementOnFirstClick
      // }px, ${y - interactionInfo.yOffsetWithinElementOnFirstClick}px)`;
      if (element.update) {
        console.log('before update', element.x, element.y);
        element.update(
          element,
          x - interactionInfo.xOffsetWithinElementOnFirstClick,
          y - interactionInfo.yOffsetWithinElementOnFirstClick,
          element
        );
      }

      if (element.pointerMove) {
        console.log('before pointermove', element.x, element.y);
        element.pointerMove();
      }
      //}

      return true;
    }
  }
  return false;
};

export const pointerUp = (
  x: number,
  y: number,
  element: INodeComponent,
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
      element.x = x - interactionInfo.xOffsetWithinElementOnFirstClick;
      element.y = y - interactionInfo.yOffsetWithinElementOnFirstClick;
      console.log('pointerUp', element.x, element.y);
      if (element.pointerUp) {
        element.pointerUp();
      }
    }
  }
};
