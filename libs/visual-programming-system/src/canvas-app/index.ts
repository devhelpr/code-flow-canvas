import {
  Camera,
  getCamera,
  setCamera,
  transformCameraSpaceToWorldSpace,
} from '../camera';
import { LineConnection } from '../components/line-connection';
import { NodeTransformer } from '../components/node-transformer';
import { QuadraticBezierConnection } from '../components/quadratic-bezier-connection';
import { CubicBezierConnection } from '../components/qubic-bezier-connection';
import { Rect } from '../components/rect';
import { RectThumb } from '../components/rect-thumb';
import { CLICK_MOVEMENT_THRESHOLD } from '../constants';
import {
  InteractionEvent,
  InteractionState,
  InteractionStateMachine,
  createInteractionStateMachine,
} from '../interaction-state-machine';
import {
  ICommandHandler,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  ThumbConnectionType,
} from '../interfaces';
import { setSelectNode } from '../reactivity';
import { NodeType } from '../types';
import { createElementMap, createNSElement, createNodeElement } from '../utils';
import {
  SetNodeStatedHandler,
  GetNodeStatedHandler,
} from '../interfaces/node-state-handlers';
import { NodeSelector } from '../components/node-selector';
import { Compositions } from '../compositions/compositions';
import { Composition } from '../interfaces/composition';
import { standardTheme } from '../themes/standard';
import { Theme } from '../interfaces/theme';
import { ThumbNodeConnector } from '../components/thumb-node-connector';
import { thumbPosition } from '../components/utils/calculate-connector-thumbs';
import { updateThumbPrefixLabel } from '../utils/thumbs';

export const createCanvasApp = <T>(
  rootElement: HTMLElement,
  disableInteraction?: boolean,
  disableZoom?: boolean,
  backgroundColor?: string,
  interactionStateMachineInstance?: InteractionStateMachine<T>,
  canvasId?: string,
  customTheme?: Theme,
  onEditCompositionName?: () => Promise<string | false>
) => {
  const theme = customTheme ?? standardTheme;
  const interactionStateMachine =
    interactionStateMachineInstance ?? createInteractionStateMachine<T>();
  const elements = createElementMap<T>();
  const rectInstanceList = {} as Record<string, Rect<T>>;

  let variables: Record<
    string,
    {
      id: string;
      getData: (parameter?: any, scopeId?: string) => any;
      setData: (data: any, scopeId?: string) => void;
      initializeDataStructure?: (structureInfo: any, scopeId?: string) => void;
      removeScope: (scopeId: string) => void;
    }
  > = {};
  const variableObservers: Map<
    string,
    Map<string, (data: any) => void>
  > = new Map();

  const commandHandlers: Record<string, ICommandHandler> = {};
  const nodeSetStateHandlers: Record<string, SetNodeStatedHandler> = {};
  const nodeGetStateHandlers: Record<string, GetNodeStatedHandler> = {};

  const tempVariables: Record<string, any> = {};

  const isMacOs =
    typeof navigator !== 'undefined' &&
    navigator?.userAgent?.indexOf('Mac') >= 0;

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
  let onCameraChanged: ((camera: Camera) => void) | undefined = undefined;
  let onWheelEvent:
    | ((x: number, y: number, scale: number) => void)
    | undefined = undefined;

  let onDragCanvasEvent: ((x: number, y: number) => void) | undefined =
    undefined;

  const canvas = createNodeElement<T>(
    'div',
    {
      id: canvasId ?? 'canvas',
      class: `w-full h-full origin-top-left ${
        backgroundColor ?? theme.background ?? 'bg-slate-800'
      } flex-auto relative z-10 transition-none transform-gpu`,
    },
    rootElement
  );

  const nodeTransformer = new NodeTransformer(
    canvas.domElement,
    interactionStateMachine
  );

  const compositons = new Compositions<T>();

  const nodeSelector = new NodeSelector<T>(
    canvas.domElement,
    interactionStateMachine,
    elements,
    true,
    compositons,
    onEditCompositionName ?? (() => Promise.resolve(false))
  );

  const setCameraPosition = (x: number, y: number) => {
    if (canvas.domElement) {
      const diffX = x - startClientDragX;
      const diffY = y - startClientDragY;

      xCamera = startDragX + diffX;
      yCamera = startDragY + diffY;

      setCamera(xCamera, yCamera, scaleCamera);
      nodeTransformer.updateCamera();
      nodeSelector.updateCamera();
      if (onCameraChanged) {
        onCameraChanged({ x: xCamera, y: yCamera, scale: scaleCamera });
      }

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
  const onContextMenu = (event: Event) => {
    console.log('contextmenu canvas', event.target, canvas.domElement);
    interactionStateMachine.reset();
  };
  rootElement.addEventListener('contextmenu', onContextMenu, false);
  let skipFirstPointerMoveOnTouch = false;
  const onPointerDown = (event: PointerEvent) => {
    isZoomingViaTouch = false;
    skipFirstPointerMoveOnTouch = false;
    //console.log('pointerdown canvas', event.target, canvas.domElement);
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
        !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
      ) {
        isClicking = false;
        isMoving = false;
        wasMoved = false;
        return;
      }
    }
    const eventTargetHelper = event.target as HTMLElement;
    if (
      event.target &&
      eventTargetHelper.hasPointerCapture &&
      eventTargetHelper.releasePointerCapture &&
      eventTargetHelper.hasPointerCapture(event.pointerId)
    ) {
      eventTargetHelper.releasePointerCapture(event.pointerId);
    }

    if (event.pointerType === 'touch') {
      skipFirstPointerMoveOnTouch = true;
    }
    if (event.shiftKey) {
      nodeSelector.onPointerDown(event);
      return;
    }

    isClicking = true;
    isMoving = false;
    wasMoved = false;
    startTime = Date.now();
  };
  rootElement.addEventListener('pointerdown', onPointerDown);

  //let wheelTime = -1;

  const wheelEvent = (event: WheelEvent) => {
    if (
      event.target &&
      (event.target as any).closest &&
      ((event.target as any).closest('.menu') ||
        (event.target as any).closest('.menu-container'))
    ) {
      return;
    }

    if (disableInteraction) {
      return;
    }
    if (isZoomingViaTouch && !(event as any).viaTouch) {
      return;
    }
    if (!(event as any).viaTouch) {
      event.preventDefault();
    }
    // if (wheelTime === -1) {
    //   wheelTime = event.timeStamp;
    // }
    // let timeDiff = event.timeStamp - wheelTime;
    // if (event.shiftKey) {
    //   timeDiff = timeDiff * 16;
    // }

    const factor = event.ctrlKey ? (isMacOs ? 350 : 50) : isMacOs ? 150 : 20;

    const delta =
      -event.deltaY *
      (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
      factor;

    // Determine the scale factor for the zoom
    const scaleFactor = 1 + delta * 0.05;

    const scaleBy = scaleFactor;

    if (canvas.domElement) {
      const mousePointTo = {
        x: event.clientX / scaleCamera - xCamera / scaleCamera,
        y: event.clientY / scaleCamera - yCamera / scaleCamera,
      };

      let newScale = scaleCamera * scaleBy;
      //console.log('wheel', scaleBy, scaleCamera, newScale);
      if (newScale < 0.05) {
        newScale = 0.05;
      } else if (newScale > 205) {
        newScale = 205;
      }

      const newPos = {
        x: -(mousePointTo.x - event.clientX / newScale) * newScale,
        y: -(mousePointTo.y - event.clientY / newScale) * newScale,
      };

      if (onWheelEvent) {
        onWheelEvent(newPos.x, newPos.y, newScale);
      }
    }
    return false;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (disableInteraction) {
      return;
    }
    if (isZoomingViaTouch) {
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
        !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
      ) {
        return;
      }
    }

    if (isClicking) {
      isMoving = true;
      wasMoved = true;
    }
    if (skipFirstPointerMoveOnTouch) {
      skipFirstPointerMoveOnTouch = false;
      console.log('skipFirstPointerMoveOnTouch');
      return;
    }
    if (Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD) {
      //return;
    }
    let currentState = interactionStateMachine.getCurrentInteractionState();

    if (
      currentState.state === InteractionState.Idle &&
      isClicking &&
      !disableZoom
    ) {
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
        //console.log('pointermove canvas', interactionState);
        if (interactionState.target?.id === canvas.id) {
          setCameraPosition(event.clientX, event.clientY);
          if (onDragCanvasEvent) {
            onDragCanvasEvent(xCamera, yCamera);
          }
        } else {
          const { x, y } = transformCameraSpaceToWorldSpace(
            event.clientX,
            event.clientY
          );

          currentState.target.pointerMove &&
            currentState.target.pointerMove(
              x,
              y,
              currentState.element,
              canvas,
              currentState.target.interactionInfo,
              interactionStateMachine
            );

          if (onCameraChanged) {
            onCameraChanged(getCamera());
          }
        }
      }
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (disableInteraction) {
      return;
    }
    const currentState = interactionStateMachine.getCurrentInteractionState();
    if (
      currentState.state === InteractionState.Moving &&
      currentState.element &&
      currentState.target &&
      !isZoomingViaTouch
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
          console.log('pointerup canvas', isMoving, wasMoved);
          if (!wasMoved) {
            setSelectNode(undefined);
          }
        } else {
          const { x, y } = transformCameraSpaceToWorldSpace(
            event.clientX,
            event.clientY
          );

          currentState.target.pointerUp &&
            currentState.target.pointerUp(
              x,
              y,
              currentState.element,
              canvas,
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
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (disableInteraction) {
      return;
    }
    if (isZoomingViaTouch) {
      console.log('pointerleave isZoomingViaTouch', event);
      return;
    }
    isMoving = false;
    isClicking = false;
    wasMoved = false;

    const currentState = interactionStateMachine.getCurrentInteractionState();
    console.log('pointerleave canvas', event, currentState, canvas.id);
    if (currentState?.canvasNode?.id === undefined || !event.target) {
      console.log('pointerleave reset');
      interactionStateMachine.reset();
      return;
    } else if (currentState.canvasNode?.id !== canvas.id) {
      return;
    }
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
        } else if (
          currentState.element?.parent?.containerNode?.domElement ===
          event.target
        ) {
          //
        } else {
          const canvasRect = (
            canvas.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();
          const { x, y } = transformCameraSpaceToWorldSpace(
            event.clientX - canvasRect.x,
            event.clientY - canvasRect.y
          );
          console.log(
            'POINTER LEAVE CANVAS',
            event,
            currentState.target,
            currentState.element,
            'Ids',
            currentState.element?.parent?.containerNode?.id,
            currentState.target?.id
          );

          currentState.target.pointerUp &&
            currentState.target.pointerUp(
              x,
              y,
              currentState.element,
              canvas,
              currentState.target.interactionInfo,
              interactionStateMachine
            );
        }
      }
    }
  };

  let isZoomingViaTouch = false;
  let startDistance: null | number = null;
  let startCenterX = 0;
  let startCenterY = 0;
  //let initialScale = -1;
  const onTouchMove = (event: TouchEvent) => {
    if (
      event.target &&
      (event.target as any).closest &&
      ((event.target as any).closest('.menu') ||
        (event.target as any).closest('.menu-container'))
    ) {
      return;
    }

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
        !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
      ) {
        return;
      }
    }

    event.preventDefault();
    if (event.touches.length == 2) {
      isZoomingViaTouch = true;
      event.stopPropagation();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (startDistance === null) {
        startDistance = distance;
        //initialScale = scaleCamera;
        startCenterX = (touch1.clientX + touch2.clientX) / 2;
        startCenterY = (touch1.clientY + touch2.clientY) / 2;
      } else {
        //const scaleBy = (distance / startDistance) * 0.05;

        if (canvas.domElement) {
          startCenterX = (touch1.clientX + touch2.clientX) / 2;
          startCenterY = (touch1.clientY + touch2.clientY) / 2;

          // console.log(
          //   'touchmove',
          //   // distance - startDistance,
          //   // distance,
          //   // startDistance,
          //   startCenterX,
          //   startCenterY,
          //   touch1.clientX,
          //   touch1.clientY,
          //   touch2.clientX,
          //   touch2.clientY
          // );
          wheelEvent({
            deltaY: (distance - startDistance) * -0.085,
            target: event.target,
            viaTouch: true,
            clientX: startCenterX,
            clientY: startCenterY,
          } as unknown as WheelEvent);
          // const mousePointTo = {
          //   x: centerX / scaleCamera - xCamera / scaleCamera,
          //   y: centerY / scaleCamera - yCamera / scaleCamera,
          // };

          // const sign = distance > startDistance ? 1 : -1;
          // let newScale = initialScale + scaleBy * sign; // * scaleCamera;
          // if (newScale < 0.05) {
          //   newScale = 0.05;
          // } else if (newScale > 205) {
          //   newScale = 205;
          // }

          // const newPos = {
          //   x: -(mousePointTo.x - centerX / newScale) * newScale,
          //   y: -(mousePointTo.y - centerY / newScale) * newScale,
          // };
          // console.log(
          //   'touchzoom',
          //   sign,
          //   initialScale,
          //   scaleBy,
          //   //startDistance,
          //   newScale,
          //   newPos,
          //   event.touches
          // );
          // if (onWheelEvent) {
          //   onWheelEvent(newPos.x, newPos.y, newScale);
          // }
        }
      }
      return false;
    }
    return true;
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (isZoomingViaTouch) {
      console.log('touchend isZoomingViaTouch', event);
      isMoving = false;
      isClicking = false;
      wasMoved = false;
      interactionStateMachine.reset();
    }

    startDistance = null;
    isZoomingViaTouch = false;
  };

  const onClick = (event: MouseEvent) => {
    const tagName = (event.target as HTMLElement)?.tagName;
    console.log(
      'click canvas (click event)',
      wasMoved,
      isMoving,
      tagName,
      disableInteraction,
      event.target
    );
    if (disableInteraction) {
      return false;
    }

    if (
      !wasMoved &&
      onClickCanvas &&
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(tagName) < 0
    ) {
      if (
        // isClicking
        (!wasMoved && event.target === rootElement) ||
        event.target === canvas.domElement
      ) {
        console.log('rootElement click', event.target, tagName);
        event.preventDefault();
        const mousePointTo = {
          x: event.clientX / scaleCamera - xCamera / scaleCamera,
          y: event.clientY / scaleCamera - yCamera / scaleCamera,
        };
        onClickCanvas(mousePointTo.x, mousePointTo.y);
        nodeTransformer.detachNode();
        nodeSelector.removeSelector();

        return false;
      }
    }

    return true;
  };

  if (!disableInteraction) {
    rootElement.addEventListener('pointermove', onPointerMove);
    rootElement.addEventListener('pointerup', onPointerUp);
    rootElement.addEventListener('pointerleave', onPointerLeave);
    if (!disableZoom) {
      rootElement.addEventListener('touchmove', onTouchMove, {
        passive: false,
      });
      rootElement.addEventListener('touchend', onTouchEnd);
      rootElement.addEventListener('touchcancel', onTouchEnd);
      rootElement.addEventListener('wheel', wheelEvent);
    }

    rootElement.addEventListener('click', onClick);
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

  const removeEvents = () => {
    rootElement.removeEventListener('wheel', wheelEvent);
    rootElement.removeEventListener('pointerdown', onPointerDown);
    rootElement.removeEventListener('pointermove', onPointerMove);
    rootElement.removeEventListener('pointerup', onPointerUp);
    rootElement.removeEventListener('pointerleave', onPointerLeave);
    rootElement.removeEventListener('contextmenu', onContextMenu, false);
    rootElement.removeEventListener('touchmove', onTouchMove);
    rootElement.removeEventListener('touchend', onTouchEnd);
    rootElement.removeEventListener('touchcancel', onTouchEnd);
  };

  // const getCurrentScope = () => {
  //   return scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : '';
  // };

  let isCameraFollowingPaused = false;
  return {
    elements,
    canvas,
    rootElement,
    interactionStateMachine,
    nodeTransformer,
    compositons,
    isContextOnly: false,
    isComposition: false,
    theme: theme,
    setOnAddcomposition: (
      onAddComposition: (
        composition: Composition<T>,
        connections: {
          thumbIdentifierWithinNode: string;
          connection: IConnectionNodeComponent<T>;
        }[]
      ) => void
    ) => {
      nodeSelector.onAddComposition = onAddComposition;
    },
    addComposition: (composition: Composition<T>) => {
      if (nodeSelector.onAddComposition) {
        nodeSelector.onAddComposition(composition, []);
      }
    },
    destoyCanvasApp: () => {
      nodeTransformer.destroy();
    },
    getIsCameraFollowingPaused: () => {
      return isCameraFollowingPaused;
    },
    setIsCameraFollowingPaused: (paused: boolean) => {
      isCameraFollowingPaused = paused;
    },
    getOnCanvasUpdated: () => {
      return onCanvasUpdated;
    },
    setOnCanvasUpdated: (onCanvasUpdatedHandler: () => void) => {
      onCanvasUpdated = onCanvasUpdatedHandler;
    },
    setOnCanvasClick: (
      onClickCanvasHandler: (x: number, y: number) => void
    ) => {
      onClickCanvas = onClickCanvasHandler;
    },
    resetNodeTransform: () => {
      nodeTransformer.detachNode();
    },
    setOnCameraChanged: (
      onCameraChangedHandler: (camera: {
        x: number;
        y: number;
        scale: number;
      }) => void
    ) => {
      onCameraChanged = onCameraChangedHandler;
    },
    getCamera: () => {
      return {
        x: xCamera,
        y: yCamera,
        scale: scaleCamera,
      };
    },
    setCamera: (x: number, y: number, scale: number) => {
      xCamera = x;
      yCamera = y;
      scaleCamera = scale;

      setCamera(xCamera, yCamera, scaleCamera);
      nodeTransformer.updateCamera();
      nodeSelector.updateCamera();

      if (onCameraChanged) {
        onCameraChanged({ x: xCamera, y: yCamera, scale: scaleCamera });
      }

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
    transformCameraSpaceToWorldSpace: (x: number, y: number) => {
      return transformCameraSpaceToWorldSpace(x, y);
    },
    setDisableInteraction: (disable: boolean) => {
      disableInteraction = disable;
    },
    removeEvents: () => {
      removeEvents();
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
          elementHelper.nodeType === NodeType.Shape &&
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

        const helperWidth = maxX - minX;
        const helperScale = rootWidth / helperWidth;

        const width = maxX - minX + 120 / helperScale;
        const height = maxY - minY;

        let scale = rootWidth / width;

        if (height * scale > rootHeight) {
          scale = rootHeight / (height * scale);
        }

        console.log(
          'centerCamera x',
          minX,
          maxX,
          'width',
          width,
          'rootWidth',
          rootWidth
        );

        console.log(
          'centerCamera y',
          minY,
          maxY,
          'height',
          height,
          'rootHeight',
          rootHeight
        );
        xCamera =
          rootWidth / 2 -
          (scale * width) / 2 -
          scale * (minX - 60 / helperScale);
        yCamera = rootHeight / 2 - (scale * height) / 2 - scale * minY;
        scaleCamera = scale;

        console.log('centerCamera', xCamera, yCamera, scaleCamera);
      }

      setCamera(xCamera, yCamera, scaleCamera);
      nodeTransformer.updateCamera();
      if (onCameraChanged) {
        onCameraChanged({ x: xCamera, y: yCamera, scale: scaleCamera });
      }

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

      if (onWheelEvent) {
        onWheelEvent(xCamera, yCamera, scaleCamera);
      }
    },
    selectNode: (nodeComponent: IRectNodeComponent<T>) => {
      if (!nodeComponent) {
        return;
      }
      setSelectNode({
        id: nodeComponent.id,
        containerNode:
          nodeComponent.containerNode as unknown as IRectNodeComponent<unknown>,
      });
      nodeTransformer.attachNode(nodeComponent);
    },
    deselectNode: () => {
      setSelectNode(undefined);
      nodeTransformer.detachNode();
    },
    createRect: (
      x: number,
      y: number,
      width: number,
      height: number,
      text?: string,
      thumbs?: IThumb[],
      markup?: string | INodeComponent<T>,
      layoutProperties?: {
        classNames?: string;
      },
      hasStaticWidthHeight?: boolean,
      disableInteraction?: boolean,
      disableManualResize?: boolean,
      id?: string,
      nodeInfo?: T,
      containerNode?: IRectNodeComponent<T>,
      isStaticPosition?: boolean,
      parentNodeClassNames?: string
    ) => {
      const rectInstance = new Rect<T>(
        canvas as unknown as INodeComponent<T>,
        interactionStateMachine,
        nodeTransformer as unknown as NodeTransformer<T>,
        pathHiddenElement,
        elements,
        x,
        y,
        width,
        height,
        text,
        thumbs,
        markup,
        layoutProperties,
        hasStaticWidthHeight,
        disableInteraction,
        disableManualResize,
        onCanvasUpdated,
        id,
        containerNode,
        isStaticPosition,
        parentNodeClassNames
      );
      if (!rectInstance || !rectInstance.nodeComponent) {
        throw new Error('rectInstance is undefined');
      }
      rectInstanceList[rectInstance.nodeComponent.id] = rectInstance;
      rectInstance.nodeComponent.nodeInfo = nodeInfo;
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return rectInstance;
    },
    createRectThumb: (
      x: number,
      y: number,
      width: number,
      height: number,
      text?: string,
      thumbs?: IThumb[],
      markup?: string | INodeComponent<T>,
      layoutProperties?: {
        classNames?: string;
      },
      hasStaticWidthHeight?: boolean,
      disableInteraction?: boolean,
      disableManualResize?: boolean,
      id?: string,
      nodeInfo?: T,
      containerNode?: IRectNodeComponent<T>,
      isStaticPosition?: boolean,
      isCircle?: boolean,
      createStraightLineConnection?: boolean
    ) => {
      const rectInstance = new RectThumb<T>(
        canvas as unknown as INodeComponent<T>,
        interactionStateMachine,
        nodeTransformer as unknown as NodeTransformer<T>,
        pathHiddenElement,
        elements,
        x,
        y,
        width,
        height,
        text,
        thumbs,
        markup,
        layoutProperties,
        hasStaticWidthHeight,
        disableInteraction,
        disableManualResize,
        onCanvasUpdated,
        id,
        containerNode,
        isStaticPosition,
        isCircle,
        createStraightLineConnection
      );
      if (!rectInstance || !rectInstance.nodeComponent) {
        throw new Error('rectInstance is undefined');
      }
      rectInstance.nodeComponent.nodeInfo = nodeInfo;
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return rectInstance;
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
      id?: string,
      containerNode?: IRectNodeComponent<T>
    ) => {
      const curve = new CubicBezierConnection<T>(
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
        id,
        containerNode,
        theme
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
      id?: string,
      containerNode?: IRectNodeComponent<T>
    ) => {
      const curve = new QuadraticBezierConnection<T>(
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
        id,
        containerNode,
        theme
      );
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return curve;
    },
    createLine: (
      startX?: number,
      startY?: number,
      endX?: number,
      endY?: number,
      isControlled?: boolean,
      isDashed = false,
      id?: string,
      containerNode?: IRectNodeComponent<T>
    ) => {
      const line = new LineConnection<T>(
        canvas as unknown as INodeComponent<T>,
        interactionStateMachine,
        pathHiddenElement,
        elements,
        startX ?? 0,
        startY ?? 0,
        endX ?? 0,
        endY ?? 0,
        0,
        0,
        isControlled,
        isDashed,
        onCanvasUpdated,
        id,
        containerNode,
        theme
      );
      if (onCanvasUpdated) {
        onCanvasUpdated();
      }
      return line;
    },
    editThumbNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
      if (!nodeComponent) {
        return;
      }
      const rectInstance = rectInstanceList[nodeComponent.id];
      if (!rectInstance) {
        return;
      }

      if (rectInstance.nodeComponent?.thumbConnectors) {
        const thumbIndex = rectInstance.nodeComponent.thumbConnectors.findIndex(
          (t) =>
            t.thumbIdentifierWithinNode === thumb.thumbIdentifierWithinNode &&
            thumb.thumbIdentifierWithinNode
        );
        if (thumbIndex >= 0) {
          const thumbNode =
            rectInstance.nodeComponent.thumbConnectors[thumbIndex];

          if (thumbNode) {
            rectInstance.nodeComponent.connections.forEach((c) => {
              if (c.startNodeThumb?.id === thumbNode.id) {
                c.startNodeThumb.thumbConstraint = thumb.thumbConstraint;
                c.startNodeThumb.prefixLabel = thumb.prefixLabel;

                updateThumbPrefixLabel(
                  thumb.prefixLabel ?? '',
                  c.startNodeThumb
                );

                if (c.endNodeThumb?.thumbConstraint !== thumb.thumbConstraint) {
                  c.startNodeThumb = undefined;
                  c.startNode = undefined;
                }
              }
              if (c.endNodeThumb?.id === thumbNode.id) {
                c.endNodeThumb.thumbConstraint = thumb.thumbConstraint;
                c.endNodeThumb.prefixLabel = thumb.prefixLabel;

                updateThumbPrefixLabel(thumb.prefixLabel ?? '', c.endNodeThumb);

                if (
                  c.startNodeThumb?.thumbConstraint !== thumb.thumbConstraint
                ) {
                  c.endNodeThumb = undefined;
                  c.endNode = undefined;
                }
              }
            });
            const nodeId = rectInstance.nodeComponent.id;

            rectInstance.nodeComponent.connections =
              rectInstance.nodeComponent.connections.filter(
                (c) => c.startNode?.id === nodeId || c.endNode?.id === nodeId
              );
          }
        }
      }

      rectInstance.cachedHeight = -1;
      rectInstance.cachedWidth = -1;

      // ugly workaround for getting correct height because when calculating the above the thumb wasn't at the correct position

      nodeComponent?.update?.(
        nodeComponent,
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent
      );

      // now recalculate height of node

      rectInstance.updateMinHeight();
      rectInstance.updateNodeSize(
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent.width ?? 0,
        nodeComponent.height ?? 0,
        false
      );
      rectInstance.cachedHeight = -1;
      rectInstance.cachedWidth = -1;

      nodeComponent?.update?.(
        nodeComponent,
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent
      );
    },
    deleteThumbNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
      if (!nodeComponent) {
        return;
      }
      const rectInstance = rectInstanceList[nodeComponent.id];
      if (!rectInstance) {
        return;
      }

      if (rectInstance.nodeComponent?.thumbConnectors) {
        const thumbIndex = rectInstance.nodeComponent.thumbConnectors.findIndex(
          (t) =>
            t.thumbIdentifierWithinNode === thumb.thumbIdentifierWithinNode &&
            thumb.thumbIdentifierWithinNode
        );
        if (thumbIndex >= 0) {
          const thumbNode =
            rectInstance.nodeComponent.thumbConnectors[thumbIndex];

          if (thumbNode) {
            rectInstance.nodeComponent.elements?.delete(thumbNode.id);
            rectInstance.nodeComponent.thumbConnectors.splice(thumbIndex, 1);

            rectInstance.nodeComponent.connections.forEach((c) => {
              if (c.startNodeThumb?.id === thumbNode.id) {
                c.startNodeThumb = undefined;
                c.startNode = undefined;
              }
              if (c.endNodeThumb?.id === thumbNode.id) {
                c.endNodeThumb = undefined;
                c.endNode = undefined;
              }
            });
            const nodeId = rectInstance.nodeComponent.id;
            rectInstance.nodeComponent.connections =
              rectInstance.nodeComponent.connections.filter(
                (c) => c.startNode?.id === nodeId || c.endNode?.id === nodeId
              );
            thumbNode.domElement.remove();
            thumbNode.delete?.();
          }
        }
      }

      console.log('deleteThumbNode', thumb, nodeComponent);

      rectInstance.cachedHeight = -1;
      rectInstance.cachedWidth = -1;

      // ugly workaround for getting correct height because when calculating the above the thumb wasn't at the correct position

      nodeComponent?.update?.(
        nodeComponent,
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent
      );

      // now recalculate height of node

      rectInstance.updateMinHeight();
      rectInstance.updateNodeSize(
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent.width ?? 0,
        nodeComponent.height ?? 0,
        false
      );
      rectInstance.cachedHeight = -1;
      rectInstance.cachedWidth = -1;

      nodeComponent?.update?.(
        nodeComponent,
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent
      );
      return undefined;
    },
    addThumbToNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
      if (!nodeComponent) {
        return;
      }
      const rectInstance = rectInstanceList[nodeComponent.id];
      if (!rectInstance) {
        return;
      }
      const { x, y } = thumbPosition(
        nodeComponent,
        thumb.thumbType,
        thumb.thumbIndex ?? 0
      );

      const thumbNode = new ThumbNodeConnector<T>(
        thumb,
        nodeComponent.domElement,
        canvas,
        interactionStateMachine,
        nodeComponent.elements,
        thumb.name ??
          (thumb.connectionType === ThumbConnectionType.start
            ? 'output'
            : 'input'),
        thumb.thumbType,
        thumb.connectionType,
        thumb.color ?? '#008080',
        x,
        y,
        undefined,
        NodeType.Connector,
        `top-0 left-0 origin-center z-[1150]  ${thumb.class ?? ''} ${
          thumb.hidden ? 'invisible pointer-events-none' : ''
        }`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        thumb.thumbIndex ?? 0,
        true,

        elements,
        nodeComponent,
        pathHiddenElement,
        false,
        thumb.label,
        thumb.thumbShape ?? 'circle',
        onCanvasUpdated,
        rectInstance.containerNode
      );

      if (!thumbNode.nodeComponent) {
        throw new Error('ThumbNode.nodeComponent is undefined');
      }
      thumbNode.nodeComponent.pathName = thumb.pathName;
      thumbNode.nodeComponent.isControlled = true;
      thumbNode.nodeComponent.isConnectPoint = true;
      thumbNode.nodeComponent.thumbConnectionType = thumb.connectionType;
      thumbNode.nodeComponent.thumbControlPointDistance =
        thumb.controlPointDistance;
      thumbNode.nodeComponent.thumbLinkedToNode = nodeComponent;
      thumbNode.nodeComponent.thumbConstraint = thumb.thumbConstraint;
      thumbNode.nodeComponent.isDataPort = thumb.isDataPort;
      thumbNode.nodeComponent.maxConnections = thumb.maxConnections;
      thumbNode.nodeComponent.thumbFormId = thumb.formId;
      thumbNode.nodeComponent.thumbFormFieldName = thumb.formFieldName;

      thumbNode.nodeComponent.onCanReceiveDroppedComponent =
        rectInstance.onCanReceiveDroppedComponent;
      thumbNode.nodeComponent.onReceiveDraggedConnection =
        rectInstance.onReceiveDraggedConnection(nodeComponent);
      thumbNode.nodeComponent.update =
        rectInstance.onEndThumbConnectorElementupdate;

      if (nodeComponent.thumbConnectors) {
        nodeComponent.thumbConnectors.push(thumbNode.nodeComponent);
      }

      rectInstance.cachedHeight = -1;
      rectInstance.cachedWidth = -1;

      // ugly workaround for getting correct height because when calculating the above the thumb wasn't at the correct position

      nodeComponent?.update?.(
        nodeComponent,
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent
      );

      // now recalculate height of node

      rectInstance.updateMinHeight();
      rectInstance.updateNodeSize(
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent.width ?? 0,
        nodeComponent.height ?? 0,
        false
      );
      rectInstance.cachedHeight = -1;
      rectInstance.cachedWidth = -1;

      nodeComponent?.update?.(
        nodeComponent,
        nodeComponent.x,
        nodeComponent.y,
        nodeComponent
      );
      return undefined;
    },
    deleteElement: (id: string) => {
      const node = elements?.get(id);
      if (node && node.nodeInfo) {
        if ((node.nodeInfo as any).canvasAppInstance) {
          (node.nodeInfo as any).canvasAppInstance.destoyCanvasApp();
        }
      }
      elements?.delete(id);
      if (rectInstanceList[id]) {
        delete rectInstanceList[id];
      }
    },
    deleteElementFromNode: (
      element: INodeComponent<T>,
      child: INodeComponent<T>,
      noCanvasUpdated = false
    ) => {
      if (element && child) {
        if (element.elements) {
          element.elements.delete(child.id);
        }
        element.domElement.removeChild(child.domElement);

        if (onCanvasUpdated && !noCanvasUpdated) {
          onCanvasUpdated();
        }
      }
    },
    setOnWheelEvent: (
      onWheelEventHandler: (x: number, y: number, scale: number) => void
    ) => {
      onWheelEvent = onWheelEventHandler;
    },
    setonDragCanvasEvent: (
      onDragCanvasEventHandler: (x: number, y: number) => void
    ) => {
      onDragCanvasEvent = onDragCanvasEventHandler;
    },
    registerVariable: (
      variableName: string,
      variable: {
        id: string;
        getData: () => any;
        setData: (data: any) => void;
        initializeDataStructure?: (structureInfo: any) => void;
        removeScope: (scopeId: string) => void;
      }
    ) => {
      if (variableName && variable.id) {
        variables[variableName] = variable;
      }
    },
    registerTempVariable: (
      variableName: string,
      data: any,
      scopeId: string
    ) => {
      if (!tempVariables[scopeId]) {
        tempVariables[scopeId] = {};
      }
      tempVariables[scopeId][variableName] = data;
    },
    unregisterVariable: (variableName: string, id: string) => {
      if (
        id &&
        variableName &&
        variables[variableName] &&
        variables[variableName].id === id
      ) {
        delete variables[variableName];
      }
    },
    getVariable: (variableName: string, parameter?: any, scopeId?: string) => {
      if (
        variableName &&
        scopeId &&
        tempVariables[scopeId] &&
        tempVariables[scopeId][variableName]
      ) {
        return tempVariables[scopeId][variableName];
      }
      if (variableName && variables[variableName]) {
        return variables[variableName].getData(parameter, scopeId);
      }
      return false;
    },
    getVariableInfo: (variableName: string, scopeId?: string) => {
      if (scopeId && tempVariables[scopeId][variableName]) {
        return {
          [variableName]: {
            id: variableName,
          },
          data: tempVariables[scopeId][variableName],
        };
      }

      if (variableName && variables[variableName]) {
        return {
          ...variables[variableName],
          data: variables[variableName].getData(undefined, scopeId),
        };
      }
      return false;
    },
    setVariable: (variableName: string, data: any, scopeId?: string) => {
      if (scopeId && tempVariables[scopeId][variableName]) {
        tempVariables[scopeId][variableName] = data;
      } else if (variableName && variables[variableName]) {
        variables[variableName].setData(data, scopeId);

        const map = variableObservers.get(`${variableName}`);
        if (map) {
          map.forEach((observer) => {
            observer(data);
          });
        }
      }
    },
    getVariables: (scopeId?: string) => {
      const result: Record<string, any> = {};
      Object.entries(variables).forEach(([key, value]) => {
        if (key) {
          result[key] = value.getData(undefined, scopeId);
        }
      });
      return result;
    },
    deleteVariables: () => {
      variables = {};
      variableObservers.clear();
    },
    getVariableNames: (scopeId?: string) => {
      if (scopeId) {
        return [
          ...Object.keys(variables),
          ...Object.keys(tempVariables[scopeId] ?? {}),
        ];
      }
      return Object.keys(variables);
    },
    initializeVariableDataStructure: (
      variableName: string,
      structureInfo: any,
      scopeId?: string
    ) => {
      if (variableName && variables[variableName]) {
        const variable = variables[variableName];
        if (variable.initializeDataStructure) {
          variable.initializeDataStructure(structureInfo, scopeId);
        }
      }
    },
    observeVariable: (
      nodeId: string,
      variableName: string,
      updated: (data: any) => void
    ) => {
      let map = variableObservers.get(`${variableName}`);
      if (!map) {
        map = new Map();
        variableObservers.set(`${variableName}`, map);
      }
      map.set(`${nodeId}`, updated);
    },
    removeObserveVariable: (nodeId: string, variableName: string) => {
      const map = variableObservers.get(`${variableName}`);
      if (map) {
        map.delete(`${nodeId}`);
      }
    },
    removeScope: (scopeId: string) => {
      if (scopeId) {
        const keys = Object.keys(variables);
        keys.forEach((key) => {
          const variable = variables[key];
          variable.removeScope(scopeId);
        });

        if (tempVariables[scopeId]) {
          delete tempVariables[scopeId];
        }
      }
    },
    registerCommandHandler: (name: string, handler: ICommandHandler) => {
      commandHandlers[name] = handler;
    },
    unregisterCommandHandler: (name: string) => {
      delete commandHandlers[name];
    },
    registeGetNodeStateHandler: (
      name: string,
      handler: GetNodeStatedHandler
    ) => {
      nodeGetStateHandlers[name] = handler;
    },
    unRegisteGetNodeStateHandler: (name: string) => {
      delete nodeGetStateHandlers[name];
    },
    registeSetNodeStateHandler: (
      name: string,
      handler: SetNodeStatedHandler
    ) => {
      nodeSetStateHandlers[name] = handler;
    },
    unRegisteSetNodeStateHandler: (name: string) => {
      delete nodeSetStateHandlers[name];
    },
    getNodeStates: () => {
      const result: Map<string, any> = new Map();
      Object.entries(nodeGetStateHandlers).forEach(([key, getHandler]) => {
        if (key) {
          const nodeState = getHandler();
          result.set(nodeState.id, nodeState.data);
        }
      });
      return result;
    },
    setNodeStates: (nodeStates: Map<string, any>) => {
      nodeStates.forEach((data, id) => {
        const setHandler = nodeSetStateHandlers[id];
        if (setHandler) {
          setHandler(id, data);
        }
      });
    },

    executeCommandOnCommandHandler: (
      name: string,
      commandName: string,
      data: any
    ) => {
      if (commandHandlers[name]) {
        commandHandlers[name].execute(commandName, data);
      }
    },
  };
};
