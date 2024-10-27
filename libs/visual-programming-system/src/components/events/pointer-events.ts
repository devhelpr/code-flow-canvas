import { CLICK_MOVEMENT_THRESHOLD } from '../../constants';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../../interaction-state-machine';
import { IElementNode, INodeComponent } from '../../interfaces/element';
import { IPointerDownResult } from '../../interfaces/pointers';
import { NodeType } from '../../types';
import { BaseNodeInfo } from '../../types/base-node-info';

export const pointerDown = <T extends BaseNodeInfo>(
  x: number,
  y: number,
  element: INodeComponent<T>,
  canvasNode: IElementNode<T>,
  interactionStateMachine: InteractionStateMachine<T>
): IPointerDownResult | false => {
  let xOffsetWithinElementOnFirstClick = 0;
  let yOffsetWithinElementOnFirstClick = 0;
  let offsetXhelper = 0;

  // const canvasBoundingRect = (
  //   canvasNode.domElement as HTMLElement
  // ).getBoundingClientRect();
  const boundingOffsetX = 0;
  const boundingOffsetY = 0; // -canvasBoundingRect.y; //-(element.domElement as HTMLElement).scrollTop; //window.scrollY;

  //console.log('canvasBoundingRect', y, canvasBoundingRect.y);

  // this fixes moving elements that have a xOffset (like the node-tree-visualizer)
  if (element && element.domElement) {
    const offsetX =
      (element.domElement as HTMLElement).getAttribute &&
      (element.domElement as HTMLElement).getAttribute('data-xoffset');
    if (offsetX) {
      offsetXhelper = parseFloat(offsetX);
    }

    // const boundingRect = (
    //   canvasNode.domElement as HTMLElement
    // ).getBoundingClientRect();
    // boundingOffsetX = boundingRect.x;
    // boundingOffsetY = boundingRect.y;
    // console.log(
    //   'boundingRect',
    //   boundingRect.x,
    //   boundingRect.y,
    //   boundingRect.left,
    //   boundingRect.top,
    //   x,
    //   y
    // );
  }

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
          xOffsetWithinElementOnFirstClick: x + offsetXhelper + boundingOffsetX,
          yOffsetWithinElementOnFirstClick: y + boundingOffsetY,
        },
      },
      element,
      undefined,
      canvasNode
    )
  ) {
    xOffsetWithinElementOnFirstClick = x + offsetXhelper + boundingOffsetX;
    yOffsetWithinElementOnFirstClick = y + boundingOffsetY;

    if (element?.nodeType === NodeType.Shape) {
      // .. this is a hack to make sure that the element is always on top
      // .. this causes a refresh of the iframe-html-node
      // (canvasNode?.domElement as unknown as HTMLElement | SVGElement)?.append(
      //   element.domElement
      // );
    }

    // console.log(
    //   'update pointerDown',
    //   element.id,
    //   element?.nodeType,
    //   element?.parent?.nodeType,
    //   x,
    //   y,
    //   xOffsetWithinElementOnFirstClick,
    //   yOffsetWithinElementOnFirstClick
    // );

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

export const pointerMove = <T extends BaseNodeInfo>(
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
          y -
            //canvasBoundingRect.y -
            interactionInfo.yOffsetWithinElementOnFirstClick,
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

export const pointerUp = <T extends BaseNodeInfo>(
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
            interactionInfo.yOffsetWithinElementOnFirstClick,
            x - interactionInfo.xOffsetWithinElementOnFirstClick,
            y -
              //canvasBoundingRect.y -
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
