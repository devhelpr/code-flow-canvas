import { CLICK_MOVEMENT_THRESHOLD } from '../../constants';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../../interaction-state-machine';
import {
  DOMElementNode,
  IElementNode,
  INodeComponent,
} from '../../interfaces/element';
import { IPointerDownResult } from '../../interfaces/pointers';
import { NodeType } from '../../types';

export const pointerDown = <T>(
  x: number,
  y: number,
  element: INodeComponent<T>,
  canvasNode: IElementNode<T>,
  interactionStateMachine: InteractionStateMachine<T>
): IPointerDownResult | false => {
  let xOffsetWithinElementOnFirstClick = 0;
  let yOffsetWithinElementOnFirstClick = 0;

  if (
    element &&
    interactionStateMachine.interactionEventState(
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
      element,
      undefined,
      canvasNode
    )
  ) {
    xOffsetWithinElementOnFirstClick = x;
    yOffsetWithinElementOnFirstClick = y;
    if (
      element?.nodeType !== NodeType.Connection &&
      element?.nodeType !== NodeType.Shape
    ) {
      (canvasNode?.domElement as unknown as HTMLElement | SVGElement).append(
        element.domElement
      );
    }

    console.log(
      'update pointerDown',
      element.id,
      element?.nodeType,
      element?.parent?.nodeType,
      x,
      y,
      xOffsetWithinElementOnFirstClick,
      yOffsetWithinElementOnFirstClick
    );

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

export const pointerMove = <T>(
  x: number,
  y: number,
  element: INodeComponent<T>,
  _canvasElement: IElementNode<T>,
  interactionInfo: IPointerDownResult,
  interactionStateMachine: InteractionStateMachine<T>
) => {
  if (element) {
    const interactionState = interactionStateMachine.interactionEventState(
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
    );

    if (interactionState && element && element.domElement) {
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

      return true;
    }
  }
  return false;
};

export const pointerUp = <T>(
  x: number,
  y: number,
  element: INodeComponent<T>,
  _canvasElement: IElementNode<T>,
  interactionInfo: IPointerDownResult,
  interactionStateMachine: InteractionStateMachine<T>
) => {
  if (element) {
    const currentInteractionInfo =
      interactionStateMachine.interactionEventState(
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
      );

    let handledAsClick = false;
    if (currentInteractionInfo) {
      if (
        (currentInteractionInfo.isClicking &&
          !currentInteractionInfo.isMoving) ||
        (currentInteractionInfo.isClicking &&
          currentInteractionInfo.isMoving &&
          currentInteractionInfo.timeSinceStart < CLICK_MOVEMENT_THRESHOLD)
      ) {
        if (element.onClick) {
          console.log(
            'click',
            currentInteractionInfo.isMoving,
            element.id,
            currentInteractionInfo.timeSinceStart
          );
          handledAsClick = true;
          element.onClick();
        }
      }

      if (element && element.domElement) {
        if (element.update) {
          console.log(
            'update pointerUp',
            element.id,
            element,
            x,
            y,
            interactionInfo.xOffsetWithinElementOnFirstClick,
            interactionInfo.yOffsetWithinElementOnFirstClick
          );
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

        if (element.updateEnd) {
          console.log('updateEnd', element);
          element.updateEnd();
        } else if (element.parent && element.parent.updateEnd) {
          console.log('updateEnd parent', element.parent);
          element.parent.updateEnd();
        }
      }
    }
  }
};
