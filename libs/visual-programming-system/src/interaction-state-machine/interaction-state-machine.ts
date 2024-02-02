import { IElementNode, INodeComponent } from '../interfaces/element';
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
    canvasNode: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>
  ) => IPointerDownResult | false;
  pointerMove?: (
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    interactionStateMachine: InteractionStateMachine<T>
  ) => void;
  pointerUp?: (
    x: number,
    y: number,
    element: INodeComponent<T>,
    canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    interactionStateMachine: InteractionStateMachine<T>
  ) => void;
  interactionInfo: IPointerDownResult;
}

//type GenericInteractionTarget = InteractionTarget<T>;
//type GenericNodeComponent = INodeComponent<T>;

interface InterActionInfo<T> {
  state: InteractionState;
  target?: InteractionTarget<T>;
  isNewState: boolean;
  isClicking?: boolean;
  isMoving?: boolean;
  timeSinceStart: number;
  canvasNode?: IElementNode<T>;
}

export interface InteractionStateMachine<T> {
  interactionEventState: (
    event: InteractionEvent,
    target: InteractionTarget<T>,
    element: INodeComponent<T>,
    peek?: boolean,
    canvasNode?: IElementNode<T>
  ) => false | InterActionInfo<T>;
  getCurrentInteractionState: () => {
    state: InteractionState;
    target: InteractionTarget<T> | undefined;
    element: INodeComponent<T> | undefined;
    canvasNode?: IElementNode<T>;
  };
  setCurrentDropTarget: (dropTarget: INodeComponent<T>) => void;
  clearDropTarget: (dropTarget: INodeComponent<T>) => void;
  getCurrentDropTarget: () => INodeComponent<T> | undefined;
  reset: () => void;
}

export const createInteractionStateMachine = <
  T
>(): InteractionStateMachine<T> => {
  let interactionState = InteractionState.Idle;
  let interactionTarget: InteractionTarget<T> | undefined = undefined;
  let currentElement: INodeComponent<T> | undefined = undefined;
  let currentCanvasNode: IElementNode<T> | undefined = undefined;

  let isClicking = false;
  let isMoving = false;
  let startTime = 0;

  const getCurrentInteractionState = () => {
    return {
      state: interactionState,
      target: interactionTarget,
      element: currentElement,
      canvasNode: currentCanvasNode,
    };
  };

  const interactionEventState = (
    event: InteractionEvent,
    target: InteractionTarget<T>,
    element: INodeComponent<T>,
    peek = false,
    canvasNode?: IElementNode<T>
  ): false | InterActionInfo<T> => {
    // console.log(
    //   'interactionEventState',
    //   interactionState,
    //   interactionState === InteractionState.Moving,
    //   event,
    //   interactionTarget?.id,
    //   target.id
    // );
    if (interactionState === InteractionState.Idle) {
      if (event === InteractionEvent.PointerDown) {
        interactionState = InteractionState.Moving;
        interactionTarget = target;
        currentElement = element;
        currentCanvasNode = canvasNode;
        isClicking = true;
        startTime = Date.now();
        return {
          state: interactionState,
          target: interactionTarget,
          canvasNode: currentCanvasNode,
          isNewState: true,
          isClicking,
          isMoving,
          timeSinceStart: 0,
        };
      }
    }

    if (
      interactionState === InteractionState.Moving &&
      interactionTarget &&
      interactionTarget.id === target.id
    ) {
      if (event === InteractionEvent.PointerMove) {
        if (isClicking) {
          isMoving = true;
        }
        return {
          state: interactionState,
          target: interactionTarget,
          canvasNode: currentCanvasNode,
          isNewState: false,
          isClicking,
          isMoving,
          timeSinceStart: Date.now() - startTime,
        };
      }
      if (event === InteractionEvent.PointerUp) {
        if (peek) {
          return {
            state: interactionState,
            target: interactionTarget,
            canvasNode: currentCanvasNode,
            isNewState: false,
            isClicking,
            isMoving,
            timeSinceStart: Date.now() - startTime,
          };
        } else {
          interactionState = InteractionState.Idle;
          interactionTarget = undefined;
          currentElement = undefined;
          currentCanvasNode = undefined;
          const oldIsClicking = isClicking;
          const oldIsMoving = isMoving;
          isClicking = false;
          isMoving = false;
          return {
            state: interactionState,
            target: interactionTarget,
            canvasNode: currentCanvasNode,
            isNewState: true,
            isClicking: oldIsClicking,
            isMoving: oldIsMoving,
            timeSinceStart: Date.now() - startTime,
          };
        }
      }
      if (event === InteractionEvent.PointerLeave) {
        interactionState = InteractionState.Idle;
        interactionTarget = undefined;
        currentElement = undefined;
        currentCanvasNode = undefined;
        isClicking = false;
        isMoving = false;
        return {
          state: interactionState,
          target: interactionTarget,
          canvasNode: currentCanvasNode,
          isNewState: true,
          isClicking,
          isMoving,
          timeSinceStart: Date.now() - startTime,
        };
      }
    }
    return false;
  };

  let currentDropTarget: INodeComponent<T> | undefined = undefined;
  const setCurrentDropTarget = (dropTarget: INodeComponent<T>) => {
    currentDropTarget = dropTarget;
  };

  const clearDropTarget = (dropTarget: INodeComponent<T>) => {
    console.log('clearDropTarget', currentDropTarget?.id, dropTarget.id);
    if (currentDropTarget && currentDropTarget.id === dropTarget.id) {
      currentDropTarget = undefined;
    }
  };

  const getCurrentDropTarget = () => {
    return currentDropTarget;
  };

  const reset = () => {
    interactionState = InteractionState.Idle;
    interactionTarget = undefined;
    currentElement = undefined;
    currentCanvasNode = undefined;
    isClicking = false;
    isMoving = false;
  };

  return {
    interactionEventState,
    getCurrentInteractionState,
    setCurrentDropTarget,
    clearDropTarget,
    getCurrentDropTarget,
    reset,
  };
};
