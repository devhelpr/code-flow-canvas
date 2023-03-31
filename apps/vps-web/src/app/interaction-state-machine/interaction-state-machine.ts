import { DOMElementNode, INodeComponent } from '../interfaces/element';
import { NodeInfo } from '../interfaces/nodeInfo';
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

export interface InteractionTarget<T> {
  id: string;
  type: string;
  pointerDown?: (
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasElement: DOMElementNode
  ) => IPointerDownResult | false;
  pointerMove?: (
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasElement: DOMElementNode,
    interactionInfo: IPointerDownResult
  ) => void;
  pointerUp?: (
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasElement: DOMElementNode,
    interactionInfo: IPointerDownResult
  ) => void;
  interactionInfo: IPointerDownResult;
}

export interface InterActionInfo<T> {
  state: InteractionState;
  target?: InteractionTarget<T>;
  isNewState: boolean;
}

let interactionState = InteractionState.Idle;
let interactionTarget: InteractionTarget<NodeInfo> | undefined = undefined;
let currentElement: INodeComponent<NodeInfo> | undefined = undefined;

export const getCurrentInteractionState = () => {
  return {
    state: interactionState,
    target: interactionTarget,
    element: currentElement,
  };
};

export const interactionEventState = <T>(
  event: InteractionEvent,
  target: InteractionTarget<T>,
  element: INodeComponent<T>,
  peek = false
): false | InterActionInfo<T> => {
  // console.log(
  //   'interactionEventState',
  //   interactionState,
  //   interactionState === InteractionState.Moving,
  //   event === InteractionEvent.PointerUp,
  //   interactionTarget?.id,
  //   target.id
  // );
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
      if (peek) {
        return {
          state: interactionState,
          target: interactionTarget,
          isNewState: false,
        };
      } else {
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

let currentDropTarget: INodeComponent<NodeInfo> | undefined = undefined;
export const setCurrentDropTarget = <T>(dropTarget: INodeComponent<T>) => {
  currentDropTarget = dropTarget;
};

export const clearDropTarget = <T>(dropTarget: INodeComponent<T>) => {
  console.log('clearDropTarget', currentDropTarget?.id, dropTarget.id);
  if (currentDropTarget && currentDropTarget.id === dropTarget.id) {
    currentDropTarget = undefined;
  }
};

export const getCurrentDropTarget = () => {
  return currentDropTarget;
};
