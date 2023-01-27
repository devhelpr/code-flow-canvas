import { DOMElementNode, IElementNode } from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';

export enum InteractionState {
  Idle = 0,
  Moving = 2,
  Resizing = 3,
  Rotating = 4,
  ConnectingStart = 5,
  ConnectingEnd = 6,
  MovingControlPoint = 7,
}

export enum InteractionEvent {
  PointerDown = 0,
  PointerMove = 1,
  PointerUp = 2,
  PointerEnter = 3,
  PointerLeave = 4,
  PointerClick = 5,
}

export interface InteractionTarget {
  id: string;
  type: string;
  pointerDown: (
    x: number,
    y: number,
    element: IElementNode,
    canvasElement: DOMElementNode
  ) => IPointerDownResult;
  pointerMove: (
    x: number,
    y: number,
    element: IElementNode,
    canvasElement: DOMElementNode,
    interactionInfo: IPointerDownResult
  ) => void;
  pointerUp: (
    x: number,
    y: number,
    element: IElementNode,
    canvasElement: DOMElementNode,
    interactionInfo: IPointerDownResult
  ) => void;
  interactionInfo: IPointerDownResult;
}

export interface InterActionInfo {
  state: InteractionState;
  target?: InteractionTarget;
  isNewState: boolean;
}

let interactionState = InteractionState.Idle;
let interactionTarget: InteractionTarget | undefined = undefined;
let currentElement: IElementNode | undefined = undefined;

export const getCurrentInteractionState = () => {
  return {
    state: interactionState,
    target: interactionTarget,
    element: currentElement,
  };
};

export const interactionEventState = (
  event: InteractionEvent,
  target: InteractionTarget,
  element: IElementNode
): false | InterActionInfo => {
  if (interactionState === InteractionState.Idle) {
    if (event === InteractionEvent.PointerDown) {
      interactionState = InteractionState.Moving;
      interactionTarget = target;
      currentElement = element;
      return {
        state: interactionState,
        target: interactionTarget,
        isNewState: true,
      };
    }
  }

  if (
    interactionState === InteractionState.Moving &&
    interactionTarget &&
    interactionTarget.id === target.id
  ) {
    if (event === InteractionEvent.PointerMove) {
      return {
        state: interactionState,
        target: interactionTarget,
        isNewState: false,
      };
    }
    if (event === InteractionEvent.PointerUp) {
      interactionState = InteractionState.Idle;
      interactionTarget = undefined;
      currentElement = undefined;
      return {
        state: interactionState,
        target: interactionTarget,
        isNewState: true,
      };
    }
    if (event === InteractionEvent.PointerLeave) {
      interactionState = InteractionState.Idle;
      interactionTarget = undefined;
      currentElement = undefined;
      return {
        state: interactionState,
        target: interactionTarget,
        isNewState: true,
      };
    }
  }
  return false;
};
