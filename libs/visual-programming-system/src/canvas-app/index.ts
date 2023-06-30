import { setCamera, transformToCamera } from '../camera';
import {
  createCubicBezier,
  createQuadraticBezier,
  createRect,
} from '../components';
import { CLICK_MOVEMENT_THRESHOLD } from '../constants';
import {
  InteractionEvent,
  InteractionState,
  createInteractionStateMachine,
} from '../interaction-state-machine';
import { INodeComponent, IThumb } from '../interfaces';
import { setSelectNode } from '../reactivity';
import { ShapeType } from '../types';
import { createElement, createElementMap, createNSElement } from '../utils';

export const createCanvasApp = <T>(
  rootElement: HTMLElement,
  disableInteraction?: boolean
) => {
  const interactionStateMachine = createInteractionStateMachine<T>();
  const elements = createElementMap<T>();
  let scaleCamera = 1;
  let xCamera = 0;
  let yCamera = 0;
  let isClicking = false;
  let isMoving = false;
  let wasMoved = false;
  let startTime = 0;

  let startDragX = 0;
  let startDragY = 0;

  let startClientDragX = 0;
  let startClientDragY = 0;
  let onClickCanvas: ((x: number, y: number) => void) | undefined = undefined;
  let onCanvasUpdated: (() => void) | undefined = undefined;

  const canvas = createElement<T>(
    'div',
    {
      id: 'canvas',
      class:
        'w-full h-full origin-top-left bg-slate-800 flex-auto relative z-10 transition-none transform-gpu',
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
    if (disableInteraction) {
      return;
    }
    if (
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
        (event.target as HTMLElement)?.tagName
      ) >= 0 ||
      (event.target !== rootElement && event.target !== canvas.domElement)
    ) {
      if (
        !(event.target as unknown as any).closest ||
        !(event.target as unknown as any).closest('#canvas')
      ) {
        isClicking = false;
        isMoving = false;
        wasMoved = false;
        return;
      }
    }
    isClicking = true;
    isMoving = false;
    wasMoved = false;
    startTime = Date.now();
  });

  if (!disableInteraction) {
    rootElement.addEventListener('pointermove', (event: PointerEvent) => {
      if (disableInteraction) {
        return;
      }
      //const canvasRect = canvas.domElement.getBoundingClientRect();
      if (
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
          (event.target as HTMLElement)?.tagName
        ) >= 0 ||
        (event.target !== rootElement && event.target !== canvas.domElement)
      ) {
        if (
          !(event.target as unknown as any).closest ||
          !(event.target as unknown as any).closest('#canvas')
        ) {
          return;
        }
      }

      if (isClicking) {
        isMoving = true;
        wasMoved = true;
      }
      if (Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD) {
        //return;
      }
      let currentState = interactionStateMachine.getCurrentInteractionState();

      if (currentState.state === InteractionState.Idle && isClicking) {
        startClientDragX = event.clientX;
        startClientDragY = event.clientY;
        startDragX = xCamera;
        startDragY = yCamera;
        console.log('dragging canvas', canvas.id, event.target);
        interactionStateMachine.interactionEventState(
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
        currentState = interactionStateMachine.getCurrentInteractionState();
      }
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState = interactionStateMachine.interactionEventState(
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
              currentState.target.pointerMove<T>(
                x,
                y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo,
                interactionStateMachine
              );
          }
        }
      }
    });
    rootElement.addEventListener('pointerup', (event: PointerEvent) => {
      if (disableInteraction) {
        return;
      }
      const currentState = interactionStateMachine.getCurrentInteractionState();
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState = interactionStateMachine.interactionEventState(
          InteractionEvent.PointerUp,
          currentState.target,
          currentState.element,
          true
        );
        if (interactionState) {
          if (currentState.target?.id === canvas.id) {
            setCameraPosition(event.clientX, event.clientY);

            interactionStateMachine.interactionEventState(
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
              currentState.target.pointerUp<T>(
                x,
                y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo,
                interactionStateMachine
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
          console.log(
            'click canvas',
            event.target,
            isMoving,
            Date.now() - startTime
          );

          // comment this to keep the selected id after clicking in the menu .. side effects?
          //setSelectNode(undefined);

          // if (onClickCanvas) {
          //   const mousePointTo = {
          //     x: event.clientX / scaleCamera - xCamera / scaleCamera,
          //     y: event.clientY / scaleCamera - yCamera / scaleCamera,
          //   };
          //   onClickCanvas(mousePointTo.x, mousePointTo.y);
          // }
        }
      }
      isMoving = false;
      isClicking = false;
    });
    rootElement.addEventListener('pointerleave', (event: PointerEvent) => {
      if (disableInteraction) {
        return;
      }
      console.log('pointerleave canvas', event);

      isMoving = false;
      isClicking = false;
      wasMoved = false;

      const currentState = interactionStateMachine.getCurrentInteractionState();
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState = interactionStateMachine.interactionEventState(
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
              currentState.target.pointerUp<T>(
                x,
                y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo,
                interactionStateMachine
              );
          }
        }
      }
    });

    let wheelTime = -1;
    rootElement.addEventListener('wheel', (event: WheelEvent) => {
      if (disableInteraction) {
        return;
      }
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
      const scaleFactor = 1 + delta * 0.05;

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
        if (scaleCamera < 0.05) {
          scaleCamera = 0.05;
        } else if (scaleCamera > 5) {
          scaleCamera = 5;
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

    rootElement.addEventListener('click', (event: MouseEvent) => {
      if (disableInteraction) {
        return false;
      }
      const tagName = (event.target as HTMLElement)?.tagName;

      if (
        !wasMoved &&
        onClickCanvas &&
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(tagName) < 0
      ) {
        if (
          event.target === rootElement ||
          event.target === canvas.domElement
        ) {
          console.log('rootElement click', event.target, tagName);
          event.preventDefault();
          const mousePointTo = {
            x: event.clientX / scaleCamera - xCamera / scaleCamera,
            y: event.clientY / scaleCamera - yCamera / scaleCamera,
          };
          onClickCanvas(mousePointTo.x, mousePointTo.y);

          return false;
        }
      }
      return true;
    });
  }

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

  const pathHiddenElement = createNSElement<T>(
    'path',
    {
      class: 'pointer-events-auto',
    },
    hiddenSVG.domElement
  );

  return {
    elements,
    canvas,
    setOnCanvasUpdated: (onCanvasUpdatedHandler: () => void) => {
      onCanvasUpdated = onCanvasUpdatedHandler;
    },
    setOnCanvasClick: (
      onClickCanvasHandler: (x: number, y: number) => void
    ) => {
      onClickCanvas = onClickCanvasHandler;
    },
    setCamera: (x: number, y: number, scale: number) => {
      xCamera = x;
      yCamera = y;
      scaleCamera = scale;

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
    },
    centerCamera: () => {
      console.log('centerCamera');
      let minX: number | undefined = undefined;
      let minY: number | undefined = undefined;
      let maxX: number | undefined = undefined;
      let maxY: number | undefined = undefined;
      elements.forEach((element) => {
        const elementHelper = element as unknown as INodeComponent<T>;
        if (
          elementHelper.shapeType === 'rect' &&
          elementHelper.width !== undefined &&
          elementHelper.height !== undefined
        ) {
          //console.log('element', element);
          if (minX === undefined || elementHelper.x < minX) {
            minX = elementHelper.x;
          }
          if (minY === undefined || elementHelper.y < minY) {
            minY = elementHelper.y;
          }
          if (
            maxX === undefined ||
            elementHelper.x + elementHelper.width > maxX
          ) {
            maxX = elementHelper.x + elementHelper.width;
          }
          if (
            maxY === undefined ||
            elementHelper.y + elementHelper.height > maxY
          ) {
            maxY = elementHelper.y + elementHelper.height;
          }
        }
      });

      if (
        minX !== undefined &&
        minY !== undefined &&
        maxX !== undefined &&
        maxY !== undefined
      ) {
        const rootWidth = rootElement.clientWidth;
        const rootHeight = rootElement.clientHeight;

        const width = maxX - minX + 20;
        const height = maxY - minY;
        const scale = rootWidth / width;

        console.log(
          'centerCamera',
          minX,
          maxX,
          'width',
          width,
          'rootWidth',
          rootWidth
        );
        xCamera = rootWidth / 2 - (scale * width) / 2 - scale * minX;
        yCamera = rootHeight / 2 - (scale * height) / 2 - scale * minY;
        scaleCamera = scale;
      }

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
    },
    createRect: (
      x: number,
      y: number,
      width: number,
      height: number,
      text?: string,
      shapeType?: ShapeType,
      thumbs?: IThumb[],
      markup?: string | INodeComponent<T>,
      layoutProperties?: {
        classNames?: string;
      },
      hasStaticWidthHeight?: boolean,
      disableInteraction?: boolean,
      disableManualResize?: boolean,
      id?: string,
      nodeInfo?: T
    ) => {
      const rect = createRect<T>(
        canvas as unknown as INodeComponent<T>,
        interactionStateMachine,
        pathHiddenElement,
        elements,
        x,
        y,
        width,
        height,
        text,
        shapeType,
        thumbs,
        markup,
        layoutProperties,
        hasStaticWidthHeight,
        disableInteraction,
        disableManualResize,
        onCanvasUpdated,
        id
      );
      rect.nodeComponent.nodeInfo = nodeInfo;
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return rect;
    },
    createCubicBezier: (
      startX?: number,
      startY?: number,
      endX?: number,
      endY?: number,
      controlPointX1?: number,
      controlPointY1?: number,
      controlPointX2?: number,
      controlPointY2?: number,
      isControlled?: boolean,
      isDashed = false,
      id?: string
    ) => {
      const curve = createCubicBezier<T>(
        canvas as unknown as INodeComponent<T>,
        interactionStateMachine,
        pathHiddenElement,
        elements,
        startX ?? 0,
        startY ?? 0,
        endX ?? 0,
        endY ?? 0,
        controlPointX1 ?? 0,
        controlPointY1 ?? 0,
        controlPointX2 ?? 0,
        controlPointY2 ?? 0,
        isControlled,
        isDashed,
        onCanvasUpdated,
        id
      );
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return curve;
    },
    createQuadraticBezier: (
      startX?: number,
      startY?: number,
      endX?: number,
      endY?: number,
      controlPointX?: number,
      controlPointY?: number,
      isControlled?: boolean,
      isDashed = false,
      id?: string
    ) => {
      const curve = createQuadraticBezier<T>(
        canvas as unknown as INodeComponent<T>,
        interactionStateMachine,
        pathHiddenElement,
        elements,
        startX ?? 0,
        startY ?? 0,
        endX ?? 0,
        endY ?? 0,
        controlPointX ?? 0,
        controlPointY ?? 0,
        isControlled,
        isDashed,
        onCanvasUpdated,
        id
      );
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return curve;
    },
    deleteElementFromNode: (
      element: INodeComponent<T>,
      child: INodeComponent<T>
    ) => {
      if (element && child) {
        element.elements.delete(child.id);
        element.domElement.removeChild(child.domElement);

        if (onCanvasUpdated) {
          onCanvasUpdated();
        }
      }
    },
  };
};

export type CanvasAppInstance = ReturnType<typeof createCanvasApp>;
