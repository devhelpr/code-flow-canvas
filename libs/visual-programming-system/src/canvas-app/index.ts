import { setCamera, transformToCamera } from '../camera';
import { CLICK_MOVEMENT_THRESHOLD } from '../constants';
import {
  InteractionEvent,
  InteractionState,
  getCurrentInteractionState,
  interactionEventState,
} from '../interaction-state-machine';
import { INodeComponent } from '../interfaces';
import { setSelectNode } from '../reactivity';
import { createElement, createElementMap, createNSElement } from '../utils';

export const createCanvasApp = <T>(rootElement: HTMLElement) => {
  const elements = createElementMap<T>();
  let scaleCamera = 1;
  let xCamera = 0;
  let yCamera = 0;
  let isClicking = false;
  let isMoving = false;
  let startTime = 0;

  let startDragX = 0;
  let startDragY = 0;

  let startClientDragX = 0;
  let startClientDragY = 0;

  const canvas = createElement(
    'div',
    {
      id: 'canvas',
      class:
        'w-full h-full bg-slate-800 flex-auto relative z-10 origin-top-left transition-none',
    },
    rootElement
  );

  const setCameraPosition = (x: number, y: number) => {
    if (canvas.domElement) {
      const diffX = x - startClientDragX;
      const diffY = y - startClientDragY;

      xCamera = startDragX + diffX;
      yCamera = startDragY + diffY;

      setCamera(xCamera, yCamera, scaleCamera);

      (canvas.domElement as unknown as HTMLElement).style.transform =
        'translate(' +
        xCamera +
        'px,' +
        yCamera +
        'px) ' +
        'scale(' +
        scaleCamera +
        ',' +
        scaleCamera +
        ') ';
    }
  };

  rootElement.addEventListener('pointerdown', (event: PointerEvent) => {
    isClicking = true;
    isMoving = false;
    startTime = Date.now();
  });

  rootElement.addEventListener('pointermove', (event: PointerEvent) => {
    //const canvasRect = canvas.domElement.getBoundingClientRect();
    if (isClicking) {
      isMoving = true;
    }
    if (Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD) {
      //return;
    }
    let currentState = getCurrentInteractionState();

    if (currentState.state === InteractionState.Idle && isClicking) {
      startClientDragX = event.clientX;
      startClientDragY = event.clientY;
      startDragX = xCamera;
      startDragY = yCamera;

      interactionEventState(
        InteractionEvent.PointerDown,
        {
          id: canvas.id,
          type: 'Canvas',
          interactionInfo: {
            xOffsetWithinElementOnFirstClick: 0,
            yOffsetWithinElementOnFirstClick: 0,
          },
        },
        canvas as unknown as INodeComponent<T>
      );
      currentState = getCurrentInteractionState();
    }
    if (
      currentState.state === InteractionState.Moving &&
      currentState.element &&
      currentState.target
    ) {
      const interactionState = interactionEventState(
        InteractionEvent.PointerMove,
        currentState.target,
        currentState.element
      );
      if (interactionState) {
        if (interactionState.target?.id === canvas.id) {
          setCameraPosition(event.clientX, event.clientY);
        } else {
          const canvasRect = (
            canvas.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();

          const { x, y } = transformToCamera(
            event.clientX, //- canvasRect.x,
            event.clientY //- canvasRect.y
          );

          currentState.target.pointerMove &&
            currentState.target.pointerMove(
              x,
              y,
              currentState.element,
              canvas.domElement,
              currentState.target.interactionInfo
            );
        }
      }
    }
  });
  rootElement.addEventListener('pointerup', (event: PointerEvent) => {
    const currentState = getCurrentInteractionState();
    if (
      currentState.state === InteractionState.Moving &&
      currentState.element &&
      currentState.target
    ) {
      const interactionState = interactionEventState(
        InteractionEvent.PointerUp,
        currentState.target,
        currentState.element,
        true
      );
      if (interactionState) {
        if (currentState.target?.id === canvas.id) {
          setCameraPosition(event.clientX, event.clientY);

          interactionEventState(
            InteractionEvent.PointerUp,
            currentState.target,
            currentState.element
          );

          setSelectNode(undefined);
        } else {
          const canvasRect = (
            canvas.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();
          const { x, y } = transformToCamera(
            event.clientX, //- canvasRect.x,
            event.clientY //- canvasRect.y
          );

          currentState.target.pointerUp &&
            currentState.target.pointerUp(
              x,
              y,
              currentState.element,
              canvas.domElement,
              currentState.target.interactionInfo
            );
        }
      }
    } else {
      if (
        !isMoving &&
        isClicking
        // ||
        // (isClicking &&
        //   isMoving &&
        //   Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD)
      ) {
        console.log('click canvas', isMoving, Date.now() - startTime);
        setSelectNode(undefined);
      }
    }
    isMoving = false;
    isClicking = false;
  });
  rootElement.addEventListener('pointerleave', (event: PointerEvent) => {
    console.log('pointerleave canvas', event);

    isMoving = false;
    isClicking = false;

    const currentState = getCurrentInteractionState();
    if (
      currentState.state === InteractionState.Moving &&
      currentState.element &&
      currentState.target
    ) {
      const interactionState = interactionEventState(
        InteractionEvent.PointerLeave,
        currentState.target,
        currentState.element
      );

      if (interactionState) {
        if (currentState.target?.id === canvas.id) {
          //
        } else {
          const canvasRect = (
            canvas.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();
          const { x, y } = transformToCamera(
            event.clientX - canvasRect.x,
            event.clientY - canvasRect.y
          );

          currentState.target.pointerUp &&
            currentState.target.pointerUp(
              x,
              y,
              currentState.element,
              canvas.domElement,
              currentState.target.interactionInfo
            );
        }
      }
    }
  });

  let wheelTime = -1;
  rootElement.addEventListener('wheel', (event: WheelEvent) => {
    event.preventDefault();

    if (wheelTime === -1) {
      wheelTime = event.timeStamp;
    }
    let timeDiff = event.timeStamp - wheelTime;
    if (event.shiftKey) {
      timeDiff = timeDiff * 16;
    }
    //const delta = result.pixelY; // / timeDiff;
    const delta = Math.max(
      -1,
      Math.min(1, (event as unknown as any).wheelDelta || -event.detail)
    );

    // Determine the scale factor for the zoom
    const scaleFactor = 1 + delta * 0.1;

    const scaleBy = scaleFactor;
    // if (scaleBy < 0.95) {
    //   scaleBy = 0.95;
    // } else if (scaleBy > 1.05) {
    //   scaleBy = 1.05;
    // }

    if (canvas.domElement) {
      const mousePointTo = {
        x: event.clientX / scaleCamera - xCamera / scaleCamera,
        y: event.clientY / scaleCamera - yCamera / scaleCamera,
      };

      scaleCamera = scaleCamera * scaleBy;
      //result.pixelY > 0 ? this.scale * scaleBy : this.scale / scaleBy;
      if (scaleCamera < 0.15) {
        scaleCamera = 0.15;
      } else if (scaleCamera > 3) {
        scaleCamera = 3;
      }

      const newPos = {
        x: -(mousePointTo.x - event.clientX / scaleCamera) * scaleCamera,
        y: -(mousePointTo.y - event.clientY / scaleCamera) * scaleCamera,
      };

      xCamera = newPos.x;
      yCamera = newPos.y;

      setCamera(xCamera, yCamera, scaleCamera);

      (canvas.domElement as unknown as HTMLElement).style.transform =
        'translate(' +
        xCamera +
        'px,' +
        yCamera +
        'px) ' +
        'scale(' +
        scaleCamera +
        ',' +
        scaleCamera +
        ') ';
    }
    return false;
  });

  const hiddenSVG = createNSElement(
    'svg',
    {
      width: 0,
      height: 0,
      style: {
        visibility: 'hidden',
        position: 'absolute',
      },
    },
    canvas.domElement
  );

  const pathHiddenElement = createNSElement(
    'path',
    {
      class: 'cursor-pointer pointer-events-auto',
    },
    hiddenSVG.domElement
  );

  return {
    elements,
    canvas,
    hiddenSVG,
    pathHiddenElement,
  };
};
