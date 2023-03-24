import {
  InteractionEvent,
  interactionEventState,
} from '../../interaction-state-machine';
import {
  DOMElementNode,
  INodeComponent,
  NodeComponentRelationType,
} from '../../interfaces/element';
import { NodeInfo } from '../../interfaces/nodeInfo';
import { IPointerDownResult } from '../../interfaces/pointers';

export const pointerDown = (
  x: number,
  y: number,
  element: INodeComponent<NodeInfo>,
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
  element: INodeComponent<NodeInfo>,
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
      if (element.update) {
        element.update(
          element,
          x - interactionInfo.xOffsetWithinElementOnFirstClick,
          y - interactionInfo.yOffsetWithinElementOnFirstClick,
          element
        );
      }

      if (element.pointerMove) {
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
  element: INodeComponent<NodeInfo>,
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
      if (element.update) {
        element.update(
          element,
          x - interactionInfo.xOffsetWithinElementOnFirstClick,
          y - interactionInfo.yOffsetWithinElementOnFirstClick,
          element
        );
      }

      if (element.pointerUp) {
        element.pointerUp();
      }
    }
  }
};
