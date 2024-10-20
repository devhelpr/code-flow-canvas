import { MediaLibrary } from '@devhelpr/media-library';
import {
  Camera,
  getCamera,
  setCamera,
  transformCameraSpaceToWorldSpace,
} from '../camera';
import { LineConnection } from '../components/line-connection';
import { NodeSelector } from '../components/node-selector';
import { NodeTransformer } from '../components/node-transformer';
import { QuadraticBezierConnection } from '../components/quadratic-bezier-connection';
import { CubicBezierConnection } from '../components/qubic-bezier-connection';
import { Rect } from '../components/rect';
import { RectThumb } from '../components/rect-thumb';
import { ThumbNodeConnector } from '../components/thumb-node-connector';
import { thumbPosition } from '../components/utils/calculate-connector-thumbs';
import { Compositions } from '../compositions/compositions';
import { CLICK_MOVEMENT_THRESHOLD } from '../constants';
import { CanvasAction } from '../enums/canvas-action';
import {
  InteractionEvent,
  InteractionState,
  InteractionStateMachine,
  createInteractionStateMachine,
} from '../interaction-state-machine';
import {
  AnimatePathFunctions,
  ElementNodeMap,
  FlowChangeType,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  ThumbConnectionType,
} from '../interfaces';
import { Composition } from '../interfaces/composition';
import { Theme } from '../interfaces/theme';
import { setSelectNode } from '../reactivity';
import { standardTheme } from '../themes/standard';
import { NodeType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { createElementMap, createNSElement, createNodeElement } from '../utils';
import { getPointerPos } from '../utils/pointer-pos';
import { updateThumbPrefixLabel } from '../utils/thumbs';
import { getCanvasAppCssClasses } from './css-classes/canvasapp-css-classes';
import { IFlowCanvasBase } from './flow-canvas';
import { FlowCore } from './flow-core';

export const createFlowCanvas = <T>(
  rootElement: HTMLElement,
  disableInteraction?: boolean,
  disableZoom?: boolean,
  backgroundColor?: string,
  interactionStateMachineInstance?: InteractionStateMachine<T>,
  canvasId?: string,
  customTheme?: Theme,
  onEditCompositionName?: () => Promise<string | false>,
  isNodeContainer?: boolean,
  _appRootElement?: HTMLElement,
  heightSpaceForHeaderFooterToolbars?: number,
  widthSpaceForSideToobars?: number
): IFlowCanvasBase<T> => {
  return new FlowCanvas(
    rootElement,
    disableInteraction,
    disableZoom,
    backgroundColor,
    interactionStateMachineInstance,
    canvasId,
    customTheme,
    onEditCompositionName,
    isNodeContainer,
    _appRootElement,
    heightSpaceForHeaderFooterToolbars,
    widthSpaceForSideToobars
  );
};

export class FlowCanvas<T> extends FlowCore implements IFlowCanvasBase<T> {
  public theme: Theme;
  private cssClasses = getCanvasAppCssClasses();
  public interactionStateMachine: InteractionStateMachine<T>;
  public elements: ElementNodeMap<T>;
  public rootElement: HTMLElement;
  public nodeTransformer: NodeTransformer<BaseNodeInfo>;
  public compositons: Compositions<T>;
  public nodeSelector: NodeSelector<T>;
  public isContextOnly = false;
  public isComposition = false;

  private rectInstanceList: Record<string, Rect<T>>;
  private CanvasClickEvent: Event;
  private animationFunctions: undefined | AnimatePathFunctions<T>;

  private isMacOs =
    typeof navigator !== 'undefined' &&
    navigator?.userAgent?.indexOf('Mac') >= 0;

  private scaleCamera = 1;
  private xCamera = 0;
  private yCamera = 0;
  private isClicking = false;
  private isMoving = false;
  private wasMoved = false;
  private startTime = 0;

  private startDragX = 0;
  private startDragY = 0;

  private startClientDragX = 0;
  private startClientDragY = 0;

  private isZoomingViaTouch = false;
  private startDistance: null | number = null;
  private startCenterX = 0;
  private startCenterY = 0;
  private pathHiddenElement: IElementNode<T>;

  private onCanvasAction:
    | ((canvasAction: CanvasAction, payload?: any) => void)
    | undefined = undefined;

  private onClickCanvas: ((x: number, y: number) => void) | undefined =
    undefined;

  private onCanvasUpdated:
    | ((
        shouldClearExecutionHistory?: boolean,
        _isStoreOnly?: boolean,
        _flowChangeType?: FlowChangeType
      ) => void)
    | undefined = undefined;

  private onCameraChanged: ((camera: Camera) => void) | undefined = undefined;
  private onWheelEvent:
    | ((x: number, y: number, scale: number) => void)
    | undefined = undefined;

  private onDragCanvasEvent: ((x: number, y: number) => void) | undefined =
    undefined;
  private mediaLibraryInstance: MediaLibrary | undefined = undefined;
  public canvas: IElementNode<T>;
  private skipFirstPointerMoveOnTouch = false;
  private isCameraFollowingPaused = false;
  private apiUrl = '';
  private disableInteraction = false;

  private heightSpaceForHeaderFooterToolbars: number | undefined;
  private widthSpaceForSideToobars: number | undefined;

  constructor(
    rootElement: HTMLElement,
    disableInteraction?: boolean,
    disableZoom?: boolean,
    backgroundColor?: string,
    interactionStateMachineInstance?: InteractionStateMachine<T>,
    canvasId?: string,
    customTheme?: Theme,
    onEditCompositionName?: () => Promise<string | false>,
    isNodeContainer?: boolean,
    _appRootElement?: HTMLElement,
    heightSpaceForHeaderFooterToolbars?: number,
    widthSpaceForSideToobars?: number
  ) {
    super();
    this.disableInteraction = disableInteraction ?? false;

    this.heightSpaceForHeaderFooterToolbars =
      heightSpaceForHeaderFooterToolbars;
    this.widthSpaceForSideToobars = widthSpaceForSideToobars;

    this.rootElement = rootElement;
    this.theme = customTheme ?? standardTheme;
    this.interactionStateMachine =
      interactionStateMachineInstance ?? createInteractionStateMachine<T>();
    this.elements = createElementMap<T>();
    this.rectInstanceList = {} as Record<string, Rect<T>>;
    this.CanvasClickEvent = new Event('canvas-click');
    this.canvas = createNodeElement<T>(
      'div',
      {
        id: canvasId ?? 'canvas',
        class: `${this.cssClasses.canvasAppClasses} ${
          backgroundColor ??
          this.theme.background ??
          this.cssClasses.defaultBackgroundColor
        } `,
      },
      rootElement
    ) as unknown as IElementNode<T>;
    this.nodeTransformer = new NodeTransformer(
      this.canvas as unknown as IElementNode<BaseNodeInfo>,
      rootElement,
      this
        .interactionStateMachine as unknown as InteractionStateMachine<BaseNodeInfo>
    );
    this.compositons = new Compositions<T>();

    this.nodeSelector = new NodeSelector<T>(
      this.canvas,
      rootElement,
      this.interactionStateMachine,
      this.elements,
      !isNodeContainer,
      this.compositons,
      onEditCompositionName ?? (() => Promise.resolve(false)),
      isNodeContainer
    );

    const onContextMenu = (event: Event) => {
      console.log('contextmenu canvas', event.target, this.canvas.domElement);
      this.interactionStateMachine.reset();
    };
    rootElement.addEventListener('contextmenu', onContextMenu, false);

    const onPointerDown = (event: PointerEvent) => {
      this.isZoomingViaTouch = false;
      this.skipFirstPointerMoveOnTouch = false;
      //console.log('pointerdown canvas', event.target, canvas.domElement);
      if (this.disableInteraction) {
        return;
      }

      if (
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'CANVAS'].indexOf(
          (event.target as HTMLElement)?.tagName
        ) >= 0 ||
        (event.target !== rootElement &&
          event.target !== this.canvas.domElement)
      ) {
        if (
          !(event.target as unknown as any).closest ||
          !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
        ) {
          this.isClicking = false;
          this.isMoving = false;
          this.wasMoved = false;
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
        this.skipFirstPointerMoveOnTouch = true;
      }
      if (event.shiftKey) {
        this.nodeSelector.onPointerDown(event);
        return;
      }

      this.isClicking = true;
      this.isMoving = false;
      this.wasMoved = false;
      this.startTime = Date.now();
    };
    rootElement.addEventListener('pointerdown', onPointerDown);

    const wheelEvent = (event: WheelEvent) => {
      if (
        event.target &&
        (event.target as any).closest &&
        ((event.target as any).closest('.menu') ||
          (event.target as any).closest('.menu-container') ||
          (event.target as any).closest('.toolbar-task-list'))
      ) {
        return;
      }

      if (this.disableInteraction) {
        return;
      }
      if (this.isZoomingViaTouch && !(event as any).viaTouch) {
        return;
      }
      if (!(event as any).viaTouch) {
        event.preventDefault();
      }

      const factor = event.ctrlKey
        ? this.isMacOs
          ? 350
          : 50
        : this.isMacOs
        ? 150
        : 20;

      const delta =
        -event.deltaY *
        (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
        factor;

      // Determine the scale factor for the zoom
      const scaleFactor = 1 + delta * 0.05;

      const scaleBy = scaleFactor;
      const boundingRect = rootElement.getBoundingClientRect();
      const clientX = event.clientX - boundingRect.x;
      const clientY = event.clientY - boundingRect.y;
      console.log('wheel', boundingRect.y, event.clientY, event.pageY, clientY);

      //console.log('wheel', clientY, clientX);
      if (this.canvas.domElement) {
        const mousePointTo = {
          x: clientX / this.scaleCamera - this.xCamera / this.scaleCamera,
          y: clientY / this.scaleCamera - this.yCamera / this.scaleCamera,
        };

        let newScale = this.scaleCamera * scaleBy;
        //console.log('wheel', scaleBy, scaleCamera, newScale);
        if (newScale < 0.05) {
          newScale = 0.05;
        } else if (newScale > 205) {
          newScale = 205;
        }

        const newPos = {
          x: -(mousePointTo.x - clientX / newScale) * newScale,
          y: -(mousePointTo.y - clientY / newScale) * newScale,
        };

        if (this.onWheelEvent) {
          this.onWheelEvent(newPos.x, newPos.y, newScale);
        }
      }
      return false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (this.disableInteraction) {
        return;
      }
      if (this.isZoomingViaTouch) {
        return;
      }

      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        rootElement,
        event
      );

      if (
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'CANVAS'].indexOf(
          (event.target as HTMLElement)?.tagName
        ) >= 0 ||
        (event.target !== rootElement &&
          event.target !== this.canvas.domElement)
      ) {
        if ((event.target as HTMLElement)?.tagName === 'CANVAS') {
          console.log(
            'pointermove canvas',
            (event.target as HTMLElement)?.tagName
          );
          return;
        }

        if (
          !(event.target as unknown as any).closest ||
          !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
        ) {
          return;
        }
      }

      if (this.isClicking) {
        this.isMoving = true;
        this.wasMoved = true;
      }
      if (this.skipFirstPointerMoveOnTouch) {
        this.skipFirstPointerMoveOnTouch = false;
        console.log('skipFirstPointerMoveOnTouch');
        return;
      }
      if (Date.now() - this.startTime < CLICK_MOVEMENT_THRESHOLD) {
        //return;
      }
      let currentState =
        this.interactionStateMachine.getCurrentInteractionState();

      if (
        currentState.state === InteractionState.Idle &&
        this.isClicking &&
        !disableZoom
      ) {
        this.startClientDragX = event.clientX;
        this.startClientDragY = event.clientY;
        this.startDragX = this.xCamera;
        this.startDragY = this.yCamera;
        console.log('dragging canvas', this.canvas.id, event.target);
        this.interactionStateMachine.interactionEventState(
          InteractionEvent.PointerDown,
          {
            id: this.canvas.id,
            type: 'Canvas',
            interactionInfo: {
              xOffsetWithinElementOnFirstClick: 0,
              yOffsetWithinElementOnFirstClick: 0,
            },
          },
          this.canvas as unknown as INodeComponent<T>
        );
        currentState =
          this.interactionStateMachine.getCurrentInteractionState();
      }
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState =
          this.interactionStateMachine.interactionEventState(
            InteractionEvent.PointerMove,
            currentState.target,
            currentState.element
          );

        if (interactionState) {
          //console.log('pointermove canvas', interactionState);
          if (interactionState.target?.id === this.canvas.id) {
            this.setCameraPosition(event.clientX, event.clientY);
            if (this.onDragCanvasEvent) {
              this.onDragCanvasEvent(this.xCamera, this.yCamera);
            }
          } else {
            const { x, y } = transformCameraSpaceToWorldSpace(
              pointerXPos,
              pointerYPos
            );

            const rect = currentState?.element as IRectNodeComponent<T>;

            if (
              rect?.containerNode?.id === this.canvas.id ||
              rect?.canvasAppInstance?.canvas?.id !== this.canvas.id ||
              !rect?.canvasAppInstance?.canvas?.id
              //true
            ) {
              event.preventDefault();
              event.stopPropagation();
              currentState.target.pointerMove &&
                currentState.target.pointerMove(
                  x,
                  y,
                  currentState.element,
                  this.canvas,
                  currentState.target.interactionInfo,
                  this.interactionStateMachine
                );

              if (this.onCameraChanged) {
                this.onCameraChanged(getCamera());
              }
            }
          }
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (this.disableInteraction) {
        return;
      }
      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        rootElement,
        event
      );

      const currentState =
        this.interactionStateMachine.getCurrentInteractionState();
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target &&
        !this.isZoomingViaTouch
      ) {
        const interactionState =
          this.interactionStateMachine.interactionEventState(
            InteractionEvent.PointerUp,
            currentState.target,
            currentState.element,
            true
          );
        if (interactionState) {
          if (currentState.target?.id === this.canvas.id) {
            this.setCameraPosition(event.clientX, event.clientY);

            this.interactionStateMachine.interactionEventState(
              InteractionEvent.PointerUp,
              currentState.target,
              currentState.element
            );
            console.log('pointerup canvas', this.isMoving, this.wasMoved);
            if (!this.wasMoved) {
              setSelectNode(undefined);
            }
          } else {
            const rect = currentState?.element as IRectNodeComponent<T>;
            console.log(
              'pointerup canvas',
              this.canvas.id,
              rect?.containerNode?.id,
              rect?.canvasAppInstance?.canvas?.id,
              rect?.canvasAppInstance?.canvas?.id !== this.canvas.id
            );
            if (
              rect?.containerNode?.id === this.canvas.id ||
              rect?.canvasAppInstance?.canvas?.id !== this.canvas.id ||
              !rect?.canvasAppInstance?.canvas?.id
            ) {
              event.stopPropagation();
              this.wasMoved = true; // HACK
              const { x, y } = transformCameraSpaceToWorldSpace(
                pointerXPos,
                pointerYPos
              );

              currentState.target.pointerUp &&
                currentState.target.pointerUp(
                  x,
                  y,
                  currentState.element,
                  this.canvas,
                  currentState.target.interactionInfo,
                  this.interactionStateMachine
                );
            }
          }
        }
      } else {
        if (!this.isMoving && this.isClicking) {
          console.log(
            'click canvas',
            event.target,
            this.isMoving,
            Date.now() - this.startTime
          );
        }
      }
      this.isMoving = false;
      this.isClicking = false;
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (this.disableInteraction) {
        return;
      }
      if (this.isZoomingViaTouch) {
        console.log('pointerleave isZoomingViaTouch', event);
        return;
      }
      this.isMoving = false;
      this.isClicking = false;
      this.wasMoved = false;

      const currentState =
        this.interactionStateMachine.getCurrentInteractionState();
      console.log('pointerleave canvas', event, currentState, this.canvas.id);
      if (currentState?.canvasNode?.id === undefined || !event.target) {
        console.log('pointerleave reset');
        this.interactionStateMachine.reset();
        return;
      } else if (currentState.canvasNode?.id !== this.canvas.id) {
        return;
      }
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState =
          this.interactionStateMachine.interactionEventState(
            InteractionEvent.PointerLeave,
            currentState.target,
            currentState.element
          );

        if (interactionState) {
          if (currentState.target?.id === this.canvas.id) {
            //
          } else if (
            currentState.element?.parent?.containerNode?.domElement ===
            event.target
          ) {
            //
          } else {
            const canvasRect = (
              this.canvas.domElement as unknown as HTMLElement | SVGElement
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
                this.canvas,
                currentState.target.interactionInfo,
                this.interactionStateMachine
              );
          }
        }
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (
        event.target &&
        (event.target as any).closest &&
        ((event.target as any).closest('.menu') ||
          (event.target as any).closest('.menu-container'))
      ) {
        return;
      }

      if (this.disableInteraction) {
        return;
      }

      if (
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
          (event.target as HTMLElement)?.tagName
        ) >= 0 ||
        (event.target !== rootElement &&
          event.target !== this.canvas.domElement)
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
        this.isZoomingViaTouch = true;
        event.stopPropagation();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (this.startDistance === null) {
          this.startDistance = distance;
          this.startCenterX = (touch1.clientX + touch2.clientX) / 2;
          this.startCenterY = (touch1.clientY + touch2.clientY) / 2;
        } else {
          if (this.canvas.domElement) {
            this.startCenterX = (touch1.clientX + touch2.clientX) / 2;
            this.startCenterY = (touch1.clientY + touch2.clientY) / 2;

            wheelEvent({
              deltaY: (distance - this.startDistance) * -0.085,
              target: event.target,
              viaTouch: true,
              clientX: this.startCenterX,
              clientY: this.startCenterY,
            } as unknown as WheelEvent);
          }
        }
        return false;
      }
      return true;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (this.isZoomingViaTouch) {
        console.log('touchend isZoomingViaTouch', event);
        this.isMoving = false;
        this.isClicking = false;
        this.wasMoved = false;
        this.interactionStateMachine.reset();
      }

      this.startDistance = null;
      this.isZoomingViaTouch = false;
    };

    const onClick = (event: MouseEvent) => {
      const tagName = (event.target as HTMLElement)?.tagName;
      console.log(
        'click canvas (click event)',
        this.wasMoved,
        this.isMoving,
        tagName,
        this.disableInteraction,
        event.target
      );
      if (this.disableInteraction) {
        return false;
      }

      if (
        !this.wasMoved &&
        this.onClickCanvas &&
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(tagName) < 0
      ) {
        if (
          // isClicking
          (!this.wasMoved && event.target === rootElement) ||
          event.target === this.canvas.domElement
        ) {
          console.log('rootElement click', event.target, tagName);
          event.preventDefault();
          const mousePointTo = {
            x:
              event.clientX / this.scaleCamera -
              this.xCamera / this.scaleCamera,
            y:
              event.clientY / this.scaleCamera -
              this.yCamera / this.scaleCamera,
          };
          this.onClickCanvas(mousePointTo.x, mousePointTo.y);
          this.nodeTransformer.detachNode();
          this.nodeSelector.removeSelector();

          document.body.dispatchEvent(this.CanvasClickEvent);

          return false;
        }
      }

      return true;
    };

    if (!this.disableInteraction) {
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
      this.canvas.domElement
    ) as unknown as IElementNode<T>;

    this.pathHiddenElement = createNSElement<T>(
      'path',
      {
        class: this.cssClasses.autoPointerEvents,
      },
      hiddenSVG.domElement
    ) as unknown as IElementNode<T>;

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
    this.removeEventsHelper = removeEvents;
  }
  // END constructor
  private removeEventsHelper: () => void;
  private setCameraPosition = (x: number, y: number) => {
    if (this.canvas.domElement) {
      const diffX = x - this.startClientDragX;
      const diffY = y - this.startClientDragY;

      this.xCamera = this.startDragX + diffX;
      this.yCamera = this.startDragY + diffY;

      setCamera(this.xCamera, this.yCamera, this.scaleCamera);
      this.nodeTransformer.updateCamera();
      this.nodeSelector.updateCamera();
      if (this.onCameraChanged) {
        this.onCameraChanged({
          x: this.xCamera,
          y: this.yCamera,
          scale: this.scaleCamera,
        });
      }

      (this.canvas.domElement as unknown as HTMLElement).style.transform =
        'translate(' +
        this.xCamera +
        'px,' +
        this.yCamera +
        'px) ' +
        'scale(' +
        this.scaleCamera +
        ',' +
        this.scaleCamera +
        ') ';
    }
  };

  setOnAddcomposition = (
    onAddComposition: (
      composition: Composition<T>,
      connections: {
        thumbIdentifierWithinNode: string;
        connection: IConnectionNodeComponent<T>;
      }[]
    ) => void
  ) => {
    this.nodeSelector.onAddComposition = onAddComposition;
  };

  addComposition = (composition: Composition<T>) => {
    if (this.nodeSelector.onAddComposition) {
      this.nodeSelector.onAddComposition(composition, []);
    }
  };

  destoyCanvasApp = () => {
    this.nodeTransformer.destroy();
  };

  getIsCameraFollowingPaused = () => {
    return this.isCameraFollowingPaused;
  };

  setIsCameraFollowingPaused = (paused: boolean) => {
    this.isCameraFollowingPaused = paused;
  };

  getOnCanvasUpdated = () => {
    return this.onCanvasUpdated;
  };

  setOnCanvasUpdated = (onCanvasUpdatedHandler: () => void) => {
    this.onCanvasUpdated = onCanvasUpdatedHandler;
  };

  setOnCanvasClick = (onClickCanvasHandler: (x: number, y: number) => void) => {
    this.onClickCanvas = onClickCanvasHandler;
  };

  public setCanvasAction = (
    setCanvasActionHandler: (canvasAction: CanvasAction, payload?: any) => void
  ) => {
    this.onCanvasAction = setCanvasActionHandler;
  };

  resetNodeTransform = () => {
    this.nodeTransformer.detachNode();
  };

  setOnCameraChanged = (
    onCameraChangedHandler: (camera: {
      x: number;
      y: number;
      scale: number;
    }) => void
  ) => {
    this.onCameraChanged = onCameraChangedHandler;
  };

  getCamera = () => {
    return {
      x: this.xCamera,
      y: this.yCamera,
      scale: this.scaleCamera,
    };
  };

  setCamera = (x: number, y: number, scale: number) => {
    this.xCamera = x;
    this.yCamera = y;
    this.scaleCamera = scale;

    setCamera(this.xCamera, this.yCamera, this.scaleCamera);

    this.nodeTransformer.updateCamera();
    this.nodeSelector.updateCamera();

    if (this.onCameraChanged) {
      this.onCameraChanged({
        x: this.xCamera,
        y: this.yCamera,
        scale: this.scaleCamera,
      });
    }

    let boudingBoxCorrectionX = 0;
    let boudingBoxCorrectionY = 0;
    boudingBoxCorrectionX = 0; //boundingBox.x + scrollLeft;
    boudingBoxCorrectionY = 0; //boundingRectHelper.y + scrollTopHelper;
    (this.canvas.domElement as unknown as HTMLElement).style.transform =
      'translate(' +
      (this.xCamera - boudingBoxCorrectionX) +
      'px,' +
      (this.yCamera - boudingBoxCorrectionY) +
      'px) ' +
      'scale(' +
      this.scaleCamera +
      ',' +
      this.scaleCamera +
      ') ';
  };

  transformCameraSpaceToWorldSpace = (x: number, y: number) => {
    return transformCameraSpaceToWorldSpace(x, y);
  };

  setDisableInteraction = (disable: boolean) => {
    this.disableInteraction = disable;
  };

  removeEvents = () => {
    this.removeEventsHelper();
  };

  centerCamera = () => {
    console.log('centerCamera');
    let minX: number | undefined = undefined;
    let minY: number | undefined = undefined;
    let maxX: number | undefined = undefined;
    let maxY: number | undefined = undefined;
    this.elements.forEach((element) => {
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
      const rootWidth = this.rootElement.clientWidth;
      const rootHeight = this.rootElement.clientHeight;

      const helperWidth = maxX - minX;
      const helperScale = rootWidth / helperWidth;
      const helperHeight = maxY - minY;
      const helperScaleHeight = rootHeight / helperHeight;

      const width = maxX - minX + 120 / helperScale;
      const height = maxY - minY + 240 / helperScaleHeight;

      let scale = rootWidth / width;
      const scaleX = scale;
      if (height * scale > rootHeight) {
        scale = rootHeight / (height * scale);
      }
      scale = rootHeight / height;
      if (scale > scaleX) {
        scale = scaleX;
      }
      console.log(
        'centerCamera x',
        minX,
        maxX,
        'width',
        width,
        'rootWidth',
        rootWidth,
        scaleX,
        scale
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

      //const boundingRect = rootElement.getBoundingClientRect();

      // const boudingBoxCorrectionX = -175 + boundingBox.x * 2; // 400; //;
      // const boudingBoxCorrectionY = -180 + -boundingBox.y * 4; // -500; //boundingBox.y;
      // const boudingBoxCorrectionX =
      //   -boundingBox.x - (widthSpaceForSideToobars ?? 0); // 32; //-230; //-boundingBox.x; // 400; //;
      // const boudingBoxCorrectionY =
      //   -boundingBox.y - (heightSpaceForHeaderFooterToolbars ?? 0); // 100; //-150 //-boundingBox.y; // -500; //boundingBox.y;

      const boudingBoxCorrectionX = -(this.widthSpaceForSideToobars ?? 0); // 32; //-230; //-boundingBox.x; // 400; //;
      const boudingBoxCorrectionY = -(
        this.heightSpaceForHeaderFooterToolbars ?? 0
      ); // 100; //-150 //-boundingBox.y; // -500; //boundingBox.y;

      this.xCamera =
        rootWidth / 2 -
        (scale * width) / 2 -
        scale * (minX + (-60 + 60) / helperScale) -
        boudingBoxCorrectionX;
      this.yCamera =
        rootHeight / 2 -
        (scale * height) / 2 -
        scale * (minY + (-120 + 120) / helperScaleHeight) -
        boudingBoxCorrectionY;
      this.scaleCamera = scale;

      console.log('centerCamera', this.xCamera, this.yCamera, this.scaleCamera);
    }

    setCamera(this.xCamera, this.yCamera, this.scaleCamera);
    this.nodeTransformer.updateCamera();
    if (this.onCameraChanged) {
      this.onCameraChanged({
        x: this.xCamera,
        y: this.yCamera,
        scale: this.scaleCamera,
      });
    }

    (this.canvas.domElement as unknown as HTMLElement).style.transform =
      'translate(' +
      this.xCamera +
      'px,' +
      this.yCamera +
      'px) ' +
      'scale(' +
      this.scaleCamera +
      ',' +
      this.scaleCamera +
      ') ';

    if (this.onWheelEvent) {
      this.onWheelEvent(this.xCamera, this.yCamera, this.scaleCamera);
    }
  };

  selectNode = (nodeComponent: IRectNodeComponent<T>) => {
    if (!nodeComponent) {
      return;
    }
    setSelectNode({
      id: nodeComponent.id,
      containerNode:
        nodeComponent.containerNode as unknown as IRectNodeComponent<unknown>,
    });
    this.nodeTransformer.attachNode(
      nodeComponent as unknown as IRectNodeComponent<BaseNodeInfo>
    );
  };

  deselectNode = () => {
    setSelectNode(undefined);
    this.nodeTransformer.detachNode();
  };

  createRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    text?: string,
    thumbs?: IThumb[],
    markup?: string | INodeComponent<T> | HTMLElement,
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
      this.canvas as unknown as INodeComponent<T>,
      this.interactionStateMachine,
      this.nodeTransformer as unknown as NodeTransformer<BaseNodeInfo>,
      this.pathHiddenElement,
      this.elements,
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
      this.onCanvasUpdated,
      id,
      containerNode,
      isStaticPosition,
      parentNodeClassNames,
      this.onCanvasAction,
      this.rootElement
    );
    if (!rectInstance || !rectInstance.nodeComponent) {
      throw new Error('rectInstance is undefined');
    }
    this.rectInstanceList[rectInstance.nodeComponent.id] = rectInstance;
    rectInstance.nodeComponent.nodeInfo = nodeInfo;
    if (this.onCanvasUpdated) {
      this.onCanvasUpdated(undefined, undefined, FlowChangeType.AddNode);
    }
    return rectInstance;
  };

  createRectThumb = (
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
      this.canvas as unknown as INodeComponent<T>,
      this.interactionStateMachine,
      this.nodeTransformer as unknown as NodeTransformer<BaseNodeInfo>,
      this.pathHiddenElement,
      this.elements,
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
      this.onCanvasUpdated,
      id,
      containerNode,
      isStaticPosition,
      isCircle,
      createStraightLineConnection,
      this.onCanvasAction,
      this.rootElement
    );
    if (!rectInstance || !rectInstance.nodeComponent) {
      throw new Error('rectInstance is undefined');
    }
    rectInstance.nodeComponent.nodeInfo = nodeInfo;
    if (this.onCanvasUpdated) {
      this.onCanvasUpdated(undefined, undefined, FlowChangeType.AddNode);
    }
    return rectInstance;
  };

  createCubicBezier = (
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
      this.canvas as unknown as INodeComponent<T>,
      this.interactionStateMachine,
      this.pathHiddenElement,
      this.elements,
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
      this.onCanvasUpdated,
      id,
      containerNode,
      this.theme,
      this.onCanvasAction,
      this.rootElement
    );
    curve.connectionUpdateState = undefined;
    if (this.onCanvasUpdated) {
      this.onCanvasUpdated(undefined, undefined, FlowChangeType.AddConnection);
    }
    return curve;
  };

  createQuadraticBezier = (
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
      this.canvas as unknown as INodeComponent<T>,
      this.interactionStateMachine,
      this.pathHiddenElement,
      this.elements,
      startX ?? 0,
      startY ?? 0,
      endX ?? 0,
      endY ?? 0,
      controlPointX ?? 0,
      controlPointY ?? 0,
      isControlled,
      isDashed,
      this.onCanvasUpdated,
      id,
      containerNode,
      this.theme,
      this.onCanvasAction,
      this.rootElement
    );
    curve.connectionUpdateState = undefined;
    if (this.onCanvasUpdated) {
      this.onCanvasUpdated(undefined, undefined, FlowChangeType.AddConnection);
    }
    return curve;
  };

  createLine = (
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
      this.canvas as unknown as INodeComponent<T>,
      this.interactionStateMachine,
      this.pathHiddenElement,
      this.elements,
      startX ?? 0,
      startY ?? 0,
      endX ?? 0,
      endY ?? 0,
      0,
      0,
      isControlled,
      isDashed,
      this.onCanvasUpdated,
      id,
      containerNode,
      this.theme,
      this.onCanvasAction,
      this.rootElement
    );
    line.connectionUpdateState = undefined;
    if (this.onCanvasUpdated) {
      this.onCanvasUpdated(undefined, undefined, FlowChangeType.AddConnection);
    }
    return line;
  };

  editThumbNode = (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
    if (!nodeComponent) {
      return;
    }
    const rectInstance = this.rectInstanceList[nodeComponent.id];
    if (!rectInstance) {
      return;
    }
    const getThumbConstraint = (constraint?: string | string[]) => {
      return constraint === 'default' ? '' : constraint;
    };

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
              c.startNodeThumb.thumbConstraint = getThumbConstraint(
                thumb.thumbConstraint
              );
              c.startNodeThumb.prefixLabel = thumb.prefixLabel;

              updateThumbPrefixLabel(thumb.prefixLabel ?? '', c.startNodeThumb);

              if (
                (c.endNodeThumb?.thumbConstraint ?? '') !==
                getThumbConstraint(thumb.thumbConstraint)
              ) {
                c.startNodeThumb = undefined;
                c.startNode = undefined;
              }
            }
            if (c.endNodeThumb?.id === thumbNode.id) {
              c.endNodeThumb.thumbConstraint = getThumbConstraint(
                thumb.thumbConstraint
              );
              c.endNodeThumb.prefixLabel = thumb.prefixLabel;

              updateThumbPrefixLabel(thumb.prefixLabel ?? '', c.endNodeThumb);

              if (
                (c.startNodeThumb?.thumbConstraint ?? '') !==
                getThumbConstraint(thumb.thumbConstraint)
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
  };

  deleteThumbNode = (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
    if (!nodeComponent) {
      return;
    }
    const rectInstance = this.rectInstanceList[nodeComponent.id];
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
  };

  addThumbToNode = (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
    if (!nodeComponent) {
      return;
    }
    const rectInstance = this.rectInstanceList[nodeComponent.id];
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
      this.canvas,
      this.interactionStateMachine,
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
      `${this.cssClasses.defaultNodePortClasses} ${thumb.class ?? ''} ${
        thumb.hidden ? 'invisible pointer-events-none' : ''
      }`,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      thumb.thumbIndex ?? 0,
      true,

      this.elements,
      nodeComponent,
      this.pathHiddenElement,
      false,
      thumb.label,
      thumb.thumbShape ?? 'circle',
      this.onCanvasUpdated,
      rectInstance.containerNode,
      undefined,
      this.rootElement
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
  };

  deleteElement = (id: string) => {
    const node = this.elements?.get(id);
    if (node && node.nodeInfo) {
      if ((node.nodeInfo as any).canvasAppInstance) {
        (node.nodeInfo as any).canvasAppInstance.destoyCanvasApp();
      }
    }
    this.elements?.delete(id);
    if (this.rectInstanceList[id]) {
      delete this.rectInstanceList[id];
    }
  };

  deleteElementFromNode = (
    element: INodeComponent<T>,
    child: INodeComponent<T>,
    noCanvasUpdated = false
  ) => {
    if (element && child) {
      if (element.elements) {
        element.elements.delete(child.id);
      }
      element.domElement.removeChild(child.domElement);

      if (this.onCanvasUpdated && !noCanvasUpdated) {
        this.onCanvasUpdated();
      }
    }
  };

  setOnWheelEvent = (
    onWheelEventHandler: (x: number, y: number, scale: number) => void
  ) => {
    this.onWheelEvent = onWheelEventHandler;
  };
  setonDragCanvasEvent = (
    onDragCanvasEventHandler: (x: number, y: number) => void
  ) => {
    this.onDragCanvasEvent = onDragCanvasEventHandler;
  };

  setMediaLibrary = (mediaLibrary: MediaLibrary) => {
    this.mediaLibraryInstance = mediaLibrary;
  };
  getMediaLibrary = () => {
    return this.mediaLibraryInstance;
  };
  setAnimationFunctions = (newAnimationFunctions: AnimatePathFunctions<T>) => {
    this.animationFunctions = newAnimationFunctions;
  };
  getAnimationFunctions = () => {
    return this.animationFunctions;
  };
  getSelectedNodes = () => {
    return this.nodeSelector.getSelectedNodes();
  };
  resetNodeSelector = () => {
    this.nodeSelector.selectionWasPlacedOrMoved = false;
    this.nodeSelector.removeSelector();
  };
  setApiUrlRoot = (apiUrlRoot: string) => {
    this.apiUrl = apiUrlRoot;
  };
  getApiUrlRoot = () => {
    return this.apiUrl;
  };
}

// end Class

// export const _createFlowCanvas = <T>(
//   rootElement: HTMLElement,
//   disableInteraction?: boolean,
//   disableZoom?: boolean,
//   backgroundColor?: string,
//   interactionStateMachineInstance?: InteractionStateMachine<T>,
//   canvasId?: string,
//   customTheme?: Theme,
//   onEditCompositionName?: () => Promise<string | false>,
//   isNodeContainer?: boolean,
//   _appRootElement?: HTMLElement,
//   heightSpaceForHeaderFooterToolbars?: number,
//   widthSpaceForSideToobars?: number
// ) => {
//   const theme = customTheme ?? standardTheme;
//   const cssClasses = getCanvasAppCssClasses();
//   const interactionStateMachine =
//     interactionStateMachineInstance ?? createInteractionStateMachine<T>();
//   const elements = createElementMap<T>();
//   const rectInstanceList = {} as Record<string, Rect<T>>;

//   const CanvasClickEvent = new Event('canvas-click');

//   let animationFunctions: undefined | AnimatePathFunctions<T> = undefined;

//   let variables: Record<
//     string,
//     {
//       id: string;
//       getData: (parameter?: any, scopeId?: string) => any;
//       setData: (data: any, scopeId?: string) => void;
//       initializeDataStructure?: (structureInfo: any, scopeId?: string) => void;
//       removeScope: (scopeId: string) => void;
//     }
//   > = {};
//   const variableObservers: Map<
//     string,
//     Map<string, (data: any, runCounter?: any) => void>
//   > = new Map();

//   const commandHandlers: Record<string, ICommandHandler> = {};
//   const nodeSetStateHandlers: Record<string, SetNodeStatedHandler> = {};
//   const nodeGetStateHandlers: Record<string, GetNodeStatedHandler> = {};

//   const tempVariables: Record<string, any> = {};

//   const isMacOs =
//     typeof navigator !== 'undefined' &&
//     navigator?.userAgent?.indexOf('Mac') >= 0;

//   let scaleCamera = 1;
//   let xCamera = 0;
//   let yCamera = 0;
//   let isClicking = false;
//   let isMoving = false;
//   let wasMoved = false;
//   let startTime = 0;

//   let startDragX = 0;
//   let startDragY = 0;

//   let startClientDragX = 0;
//   let startClientDragY = 0;
//   let onClickCanvas: ((x: number, y: number) => void) | undefined = undefined;
//   let onCanvasUpdated:
//     | ((
//         shouldClearExecutionHistory?: boolean,
//         _isStoreOnly?: boolean,
//         _flowChangeType?: FlowChangeType
//       ) => void)
//     | undefined = undefined;
//   let setCanvasAction:
//     | ((canvasAction: CanvasAction, payload?: any) => void)
//     | undefined = undefined;
//   let onCameraChanged: ((camera: Camera) => void) | undefined = undefined;
//   let onWheelEvent:
//     | ((x: number, y: number, scale: number) => void)
//     | undefined = undefined;

//   let onDragCanvasEvent: ((x: number, y: number) => void) | undefined =
//     undefined;
//   let mediaLibraryInstance: MediaLibrary | undefined = undefined;

//   const canvas = createNodeElement<T>(
//     'div',
//     {
//       id: canvasId ?? 'canvas',
//       class: `${cssClasses.canvasAppClasses} ${
//         backgroundColor ?? theme.background ?? cssClasses.defaultBackgroundColor
//       } `,
//     },
//     rootElement
//   ) as unknown as IElementNode<T>;

//   const nodeTransformer = new NodeTransformer(
//     canvas as unknown as IElementNode<BaseNodeInfo>,
//     rootElement,
//     interactionStateMachine as unknown as InteractionStateMachine<BaseNodeInfo>
//   );

//   const compositons = new Compositions<T>();

//   const nodeSelector = new NodeSelector<T>(
//     canvas,
//     rootElement,
//     interactionStateMachine,
//     elements,
//     !isNodeContainer,
//     compositons,
//     onEditCompositionName ?? (() => Promise.resolve(false)),
//     isNodeContainer
//   );

//   const setCameraPosition = (x: number, y: number) => {
//     if (canvas.domElement) {
//       const diffX = x - startClientDragX;
//       const diffY = y - startClientDragY;

//       xCamera = startDragX + diffX;
//       yCamera = startDragY + diffY;

//       setCamera(xCamera, yCamera, scaleCamera);
//       nodeTransformer.updateCamera();
//       nodeSelector.updateCamera();
//       if (onCameraChanged) {
//         onCameraChanged({ x: xCamera, y: yCamera, scale: scaleCamera });
//       }

//       (canvas.domElement as unknown as HTMLElement).style.transform =
//         'translate(' +
//         xCamera +
//         'px,' +
//         yCamera +
//         'px) ' +
//         'scale(' +
//         scaleCamera +
//         ',' +
//         scaleCamera +
//         ') ';
//     }
//   };
//   const onContextMenu = (event: Event) => {
//     console.log('contextmenu canvas', event.target, canvas.domElement);
//     interactionStateMachine.reset();
//   };
//   rootElement.addEventListener('contextmenu', onContextMenu, false);
//   let skipFirstPointerMoveOnTouch = false;
//   const onPointerDown = (event: PointerEvent) => {
//     isZoomingViaTouch = false;
//     skipFirstPointerMoveOnTouch = false;
//     //console.log('pointerdown canvas', event.target, canvas.domElement);
//     if (disableInteraction) {
//       return;
//     }

//     if (
//       ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'CANVAS'].indexOf(
//         (event.target as HTMLElement)?.tagName
//       ) >= 0 ||
//       (event.target !== rootElement && event.target !== canvas.domElement)
//     ) {
//       if (
//         !(event.target as unknown as any).closest ||
//         !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
//       ) {
//         isClicking = false;
//         isMoving = false;
//         wasMoved = false;
//         return;
//       }
//     }
//     const eventTargetHelper = event.target as HTMLElement;
//     if (
//       event.target &&
//       eventTargetHelper.hasPointerCapture &&
//       eventTargetHelper.releasePointerCapture &&
//       eventTargetHelper.hasPointerCapture(event.pointerId)
//     ) {
//       eventTargetHelper.releasePointerCapture(event.pointerId);
//     }

//     if (event.pointerType === 'touch') {
//       skipFirstPointerMoveOnTouch = true;
//     }
//     if (event.shiftKey) {
//       nodeSelector.onPointerDown(event);
//       return;
//     }

//     isClicking = true;
//     isMoving = false;
//     wasMoved = false;
//     startTime = Date.now();
//   };
//   rootElement.addEventListener('pointerdown', onPointerDown);

//   //let wheelTime = -1;

//   const wheelEvent = (event: WheelEvent) => {
//     if (
//       event.target &&
//       (event.target as any).closest &&
//       ((event.target as any).closest('.menu') ||
//         (event.target as any).closest('.menu-container') ||
//         (event.target as any).closest('.toolbar-task-list'))
//     ) {
//       return;
//     }

//     if (disableInteraction) {
//       return;
//     }
//     if (isZoomingViaTouch && !(event as any).viaTouch) {
//       return;
//     }
//     if (!(event as any).viaTouch) {
//       event.preventDefault();
//     }
//     // if (wheelTime === -1) {
//     //   wheelTime = event.timeStamp;
//     // }
//     // let timeDiff = event.timeStamp - wheelTime;
//     // if (event.shiftKey) {
//     //   timeDiff = timeDiff * 16;
//     // }

//     const factor = event.ctrlKey ? (isMacOs ? 350 : 50) : isMacOs ? 150 : 20;

//     const delta =
//       -event.deltaY *
//       (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
//       factor;

//     // Determine the scale factor for the zoom
//     const scaleFactor = 1 + delta * 0.05;

//     const scaleBy = scaleFactor;
//     const boundingRect = rootElement.getBoundingClientRect();
//     const clientX = event.clientX - boundingRect.x;
//     const clientY = event.clientY - boundingRect.y;
//     console.log('wheel', boundingRect.y, event.clientY, event.pageY, clientY);

//     //console.log('wheel', clientY, clientX);
//     if (canvas.domElement) {
//       const mousePointTo = {
//         x: clientX / scaleCamera - xCamera / scaleCamera,
//         y: clientY / scaleCamera - yCamera / scaleCamera,
//       };

//       let newScale = scaleCamera * scaleBy;
//       //console.log('wheel', scaleBy, scaleCamera, newScale);
//       if (newScale < 0.05) {
//         newScale = 0.05;
//       } else if (newScale > 205) {
//         newScale = 205;
//       }

//       const newPos = {
//         x: -(mousePointTo.x - clientX / newScale) * newScale,
//         y: -(mousePointTo.y - clientY / newScale) * newScale,
//       };

//       if (onWheelEvent) {
//         onWheelEvent(newPos.x, newPos.y, newScale);
//       }
//     }
//     return false;
//   };

//   const onPointerMove = (event: PointerEvent) => {
//     if (disableInteraction) {
//       return;
//     }
//     if (isZoomingViaTouch) {
//       return;
//     }

//     // const boundingRect = (
//     //   canvas.domElement as HTMLElement
//     // ).getBoundingClientRect();
//     // const pointerXPos = event.pageX - boundingRect.x;
//     // const pointerYPos = event.pageY - boundingRect.y;

//     const { pointerXPos, pointerYPos } = getPointerPos(
//       canvas.domElement as HTMLElement,
//       rootElement,
//       event
//     );

//     //const canvasRect = canvas.domElement.getBoundingClientRect();
//     if (
//       ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'CANVAS'].indexOf(
//         (event.target as HTMLElement)?.tagName
//       ) >= 0 ||
//       (event.target !== rootElement && event.target !== canvas.domElement)
//     ) {
//       if ((event.target as HTMLElement)?.tagName === 'CANVAS') {
//         console.log(
//           'pointermove canvas',
//           (event.target as HTMLElement)?.tagName
//         );
//         return;
//       }

//       if (
//         !(event.target as unknown as any).closest ||
//         !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
//       ) {
//         return;
//       }
//     }

//     if (isClicking) {
//       isMoving = true;
//       wasMoved = true;
//     }
//     if (skipFirstPointerMoveOnTouch) {
//       skipFirstPointerMoveOnTouch = false;
//       console.log('skipFirstPointerMoveOnTouch');
//       return;
//     }
//     if (Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD) {
//       //return;
//     }
//     let currentState = interactionStateMachine.getCurrentInteractionState();

//     if (
//       currentState.state === InteractionState.Idle &&
//       isClicking &&
//       !disableZoom
//     ) {
//       startClientDragX = event.clientX;
//       startClientDragY = event.clientY;
//       startDragX = xCamera;
//       startDragY = yCamera;
//       console.log('dragging canvas', canvas.id, event.target);
//       interactionStateMachine.interactionEventState(
//         InteractionEvent.PointerDown,
//         {
//           id: canvas.id,
//           type: 'Canvas',
//           interactionInfo: {
//             xOffsetWithinElementOnFirstClick: 0,
//             yOffsetWithinElementOnFirstClick: 0,
//           },
//         },
//         canvas as unknown as INodeComponent<T>
//       );
//       currentState = interactionStateMachine.getCurrentInteractionState();
//     }
//     if (
//       currentState.state === InteractionState.Moving &&
//       currentState.element &&
//       currentState.target
//     ) {
//       const interactionState = interactionStateMachine.interactionEventState(
//         InteractionEvent.PointerMove,
//         currentState.target,
//         currentState.element
//       );

//       if (interactionState) {
//         //console.log('pointermove canvas', interactionState);
//         if (interactionState.target?.id === canvas.id) {
//           setCameraPosition(event.clientX, event.clientY);
//           if (onDragCanvasEvent) {
//             onDragCanvasEvent(xCamera, yCamera);
//           }
//         } else {
//           const { x, y } = transformCameraSpaceToWorldSpace(
//             pointerXPos,
//             pointerYPos
//           );

//           const rect = currentState?.element as IRectNodeComponent<T>;
//           // console.log(
//           //   'pointermove canvas',
//           //   canvas.id,
//           //   rect?.canvasAppInstance?.canvas?.id,
//           //   rect?.containerNode?.id,
//           //   rect?.canvasAppInstance?.canvas?.id !== canvas.id
//           // );
//           if (
//             rect?.containerNode?.id === canvas.id ||
//             rect?.canvasAppInstance?.canvas?.id !== canvas.id ||
//             !rect?.canvasAppInstance?.canvas?.id
//             //true
//           ) {
//             event.preventDefault();
//             event.stopPropagation();
//             currentState.target.pointerMove &&
//               currentState.target.pointerMove(
//                 x,
//                 y,
//                 currentState.element,
//                 canvas,
//                 currentState.target.interactionInfo,
//                 interactionStateMachine
//               );

//             if (onCameraChanged) {
//               onCameraChanged(getCamera());
//             }
//           }
//         }
//       }
//     }
//   };

//   const onPointerUp = (event: PointerEvent) => {
//     if (disableInteraction) {
//       return;
//     }
//     const { pointerXPos, pointerYPos } = getPointerPos(
//       canvas.domElement as HTMLElement,
//       rootElement,
//       event
//     );

//     const currentState = interactionStateMachine.getCurrentInteractionState();
//     if (
//       currentState.state === InteractionState.Moving &&
//       currentState.element &&
//       currentState.target &&
//       !isZoomingViaTouch
//     ) {
//       const interactionState = interactionStateMachine.interactionEventState(
//         InteractionEvent.PointerUp,
//         currentState.target,
//         currentState.element,
//         true
//       );
//       if (interactionState) {
//         if (currentState.target?.id === canvas.id) {
//           setCameraPosition(event.clientX, event.clientY);

//           interactionStateMachine.interactionEventState(
//             InteractionEvent.PointerUp,
//             currentState.target,
//             currentState.element
//           );
//           console.log('pointerup canvas', isMoving, wasMoved);
//           if (!wasMoved) {
//             setSelectNode(undefined);
//           }
//         } else {
//           const rect = currentState?.element as IRectNodeComponent<T>;
//           console.log(
//             'pointerup canvas',
//             canvas.id,
//             rect?.containerNode?.id,
//             rect?.canvasAppInstance?.canvas?.id,
//             rect?.canvasAppInstance?.canvas?.id !== canvas.id
//           );
//           if (
//             rect?.containerNode?.id === canvas.id ||
//             rect?.canvasAppInstance?.canvas?.id !== canvas.id ||
//             !rect?.canvasAppInstance?.canvas?.id
//           ) {
//             event.stopPropagation();
//             wasMoved = true; // HACK
//             const { x, y } = transformCameraSpaceToWorldSpace(
//               pointerXPos,
//               pointerYPos
//             );

//             currentState.target.pointerUp &&
//               currentState.target.pointerUp(
//                 x,
//                 y,
//                 currentState.element,
//                 canvas,
//                 currentState.target.interactionInfo,
//                 interactionStateMachine
//               );
//           }
//         }
//       }
//     } else {
//       if (
//         !isMoving &&
//         isClicking
//         // ||
//         // (isClicking &&
//         //   isMoving &&
//         //   Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD)
//       ) {
//         console.log(
//           'click canvas',
//           event.target,
//           isMoving,
//           Date.now() - startTime
//         );

//         // comment this to keep the selected id after clicking in the menu .. side effects?
//         //setSelectNode(undefined);

//         // if (onClickCanvas) {
//         //   const mousePointTo = {
//         //     x: event.clientX / scaleCamera - xCamera / scaleCamera,
//         //     y: event.clientY / scaleCamera - yCamera / scaleCamera,
//         //   };
//         //   onClickCanvas(mousePointTo.x, mousePointTo.y);
//         // }
//       }
//     }
//     isMoving = false;
//     isClicking = false;
//   };
//   const onPointerLeave = (event: PointerEvent) => {
//     if (disableInteraction) {
//       return;
//     }
//     if (isZoomingViaTouch) {
//       console.log('pointerleave isZoomingViaTouch', event);
//       return;
//     }
//     isMoving = false;
//     isClicking = false;
//     wasMoved = false;

//     const currentState = interactionStateMachine.getCurrentInteractionState();
//     console.log('pointerleave canvas', event, currentState, canvas.id);
//     if (currentState?.canvasNode?.id === undefined || !event.target) {
//       console.log('pointerleave reset');
//       interactionStateMachine.reset();
//       return;
//     } else if (currentState.canvasNode?.id !== canvas.id) {
//       return;
//     }
//     if (
//       currentState.state === InteractionState.Moving &&
//       currentState.element &&
//       currentState.target
//     ) {
//       const interactionState = interactionStateMachine.interactionEventState(
//         InteractionEvent.PointerLeave,
//         currentState.target,
//         currentState.element
//       );

//       if (interactionState) {
//         if (currentState.target?.id === canvas.id) {
//           //
//         } else if (
//           currentState.element?.parent?.containerNode?.domElement ===
//           event.target
//         ) {
//           //
//         } else {
//           const canvasRect = (
//             canvas.domElement as unknown as HTMLElement | SVGElement
//           ).getBoundingClientRect();
//           const { x, y } = transformCameraSpaceToWorldSpace(
//             event.clientX - canvasRect.x,
//             event.clientY - canvasRect.y
//           );
//           console.log(
//             'POINTER LEAVE CANVAS',
//             event,
//             currentState.target,
//             currentState.element,
//             'Ids',
//             currentState.element?.parent?.containerNode?.id,
//             currentState.target?.id
//           );

//           currentState.target.pointerUp &&
//             currentState.target.pointerUp(
//               x,
//               y,
//               currentState.element,
//               canvas,
//               currentState.target.interactionInfo,
//               interactionStateMachine
//             );
//         }
//       }
//     }
//   };

//   let isZoomingViaTouch = false;
//   let startDistance: null | number = null;
//   let startCenterX = 0;
//   let startCenterY = 0;
//   //let initialScale = -1;
//   const onTouchMove = (event: TouchEvent) => {
//     if (
//       event.target &&
//       (event.target as any).closest &&
//       ((event.target as any).closest('.menu') ||
//         (event.target as any).closest('.menu-container'))
//     ) {
//       return;
//     }

//     if (disableInteraction) {
//       return;
//     }

//     if (
//       ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
//         (event.target as HTMLElement)?.tagName
//       ) >= 0 ||
//       (event.target !== rootElement && event.target !== canvas.domElement)
//     ) {
//       if (
//         !(event.target as unknown as any).closest ||
//         !(event.target as unknown as any).closest(`#${canvasId ?? 'canvas'}`)
//       ) {
//         return;
//       }
//     }

//     event.preventDefault();
//     if (event.touches.length == 2) {
//       isZoomingViaTouch = true;
//       event.stopPropagation();
//       const touch1 = event.touches[0];
//       const touch2 = event.touches[1];
//       const distance = Math.sqrt(
//         Math.pow(touch2.clientX - touch1.clientX, 2) +
//           Math.pow(touch2.clientY - touch1.clientY, 2)
//       );

//       if (startDistance === null) {
//         startDistance = distance;
//         //initialScale = scaleCamera;
//         startCenterX = (touch1.clientX + touch2.clientX) / 2;
//         startCenterY = (touch1.clientY + touch2.clientY) / 2;
//       } else {
//         //const scaleBy = (distance / startDistance) * 0.05;

//         if (canvas.domElement) {
//           startCenterX = (touch1.clientX + touch2.clientX) / 2;
//           startCenterY = (touch1.clientY + touch2.clientY) / 2;

//           // console.log(
//           //   'touchmove',
//           //   // distance - startDistance,
//           //   // distance,
//           //   // startDistance,
//           //   startCenterX,
//           //   startCenterY,
//           //   touch1.clientX,
//           //   touch1.clientY,
//           //   touch2.clientX,
//           //   touch2.clientY
//           // );
//           wheelEvent({
//             deltaY: (distance - startDistance) * -0.085,
//             target: event.target,
//             viaTouch: true,
//             clientX: startCenterX,
//             clientY: startCenterY,
//           } as unknown as WheelEvent);
//           // const mousePointTo = {
//           //   x: centerX / scaleCamera - xCamera / scaleCamera,
//           //   y: centerY / scaleCamera - yCamera / scaleCamera,
//           // };

//           // const sign = distance > startDistance ? 1 : -1;
//           // let newScale = initialScale + scaleBy * sign; // * scaleCamera;
//           // if (newScale < 0.05) {
//           //   newScale = 0.05;
//           // } else if (newScale > 205) {
//           //   newScale = 205;
//           // }

//           // const newPos = {
//           //   x: -(mousePointTo.x - centerX / newScale) * newScale,
//           //   y: -(mousePointTo.y - centerY / newScale) * newScale,
//           // };
//           // console.log(
//           //   'touchzoom',
//           //   sign,
//           //   initialScale,
//           //   scaleBy,
//           //   //startDistance,
//           //   newScale,
//           //   newPos,
//           //   event.touches
//           // );
//           // if (onWheelEvent) {
//           //   onWheelEvent(newPos.x, newPos.y, newScale);
//           // }
//         }
//       }
//       return false;
//     }
//     return true;
//   };
//   const onTouchEnd = (event: TouchEvent) => {
//     if (isZoomingViaTouch) {
//       console.log('touchend isZoomingViaTouch', event);
//       isMoving = false;
//       isClicking = false;
//       wasMoved = false;
//       interactionStateMachine.reset();
//     }

//     startDistance = null;
//     isZoomingViaTouch = false;
//   };

//   const onClick = (event: MouseEvent) => {
//     const tagName = (event.target as HTMLElement)?.tagName;
//     console.log(
//       'click canvas (click event)',
//       wasMoved,
//       isMoving,
//       tagName,
//       disableInteraction,
//       event.target
//     );
//     if (disableInteraction) {
//       return false;
//     }

//     if (
//       !wasMoved &&
//       onClickCanvas &&
//       ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(tagName) < 0
//     ) {
//       if (
//         // isClicking
//         (!wasMoved && event.target === rootElement) ||
//         event.target === canvas.domElement
//       ) {
//         console.log('rootElement click', event.target, tagName);
//         event.preventDefault();
//         const mousePointTo = {
//           x: event.clientX / scaleCamera - xCamera / scaleCamera,
//           y: event.clientY / scaleCamera - yCamera / scaleCamera,
//         };
//         onClickCanvas(mousePointTo.x, mousePointTo.y);
//         nodeTransformer.detachNode();
//         nodeSelector.removeSelector();

//         document.body.dispatchEvent(CanvasClickEvent);

//         return false;
//       }
//     }

//     return true;
//   };

//   if (!disableInteraction) {
//     rootElement.addEventListener('pointermove', onPointerMove);
//     rootElement.addEventListener('pointerup', onPointerUp);
//     rootElement.addEventListener('pointerleave', onPointerLeave);
//     if (!disableZoom) {
//       rootElement.addEventListener('touchmove', onTouchMove, {
//         passive: false,
//       });
//       rootElement.addEventListener('touchend', onTouchEnd);
//       rootElement.addEventListener('touchcancel', onTouchEnd);
//       rootElement.addEventListener('wheel', wheelEvent);
//     }

//     rootElement.addEventListener('click', onClick);
//   }

//   const hiddenSVG = createNSElement(
//     'svg',
//     {
//       width: 0,
//       height: 0,
//       style: {
//         visibility: 'hidden',
//         position: 'absolute',
//       },
//     },
//     canvas.domElement
//   ) as unknown as IElementNode<T>;

//   const pathHiddenElement = createNSElement<T>(
//     'path',
//     {
//       class: cssClasses.autoPointerEvents,
//     },
//     hiddenSVG.domElement
//   ) as unknown as IElementNode<T>;

//   const removeEvents = () => {
//     rootElement.removeEventListener('wheel', wheelEvent);
//     rootElement.removeEventListener('pointerdown', onPointerDown);
//     rootElement.removeEventListener('pointermove', onPointerMove);
//     rootElement.removeEventListener('pointerup', onPointerUp);
//     rootElement.removeEventListener('pointerleave', onPointerLeave);
//     rootElement.removeEventListener('contextmenu', onContextMenu, false);
//     rootElement.removeEventListener('touchmove', onTouchMove);
//     rootElement.removeEventListener('touchend', onTouchEnd);
//     rootElement.removeEventListener('touchcancel', onTouchEnd);
//   };

//   // const getCurrentScope = () => {
//   //   return scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : '';
//   // };

//   let onNodeMessage: ((keyName: string, value: any) => void) | undefined =
//     undefined;
//   let listeners: {
//     key: string;
//     listener: (key: string, value: any) => void;
//   }[] = [];
//   let isCameraFollowingPaused = false;
//   let apiUrl = '';
//   return {
//     elements,
//     canvas,
//     rootElement,
//     interactionStateMachine,
//     nodeTransformer,
//     compositons,
//     isContextOnly: false,
//     isComposition: false,
//     theme: theme,
//     setOnAddcomposition: (
//       onAddComposition: (
//         composition: Composition<T>,
//         connections: {
//           thumbIdentifierWithinNode: string;
//           connection: IConnectionNodeComponent<T>;
//         }[]
//       ) => void
//     ) => {
//       nodeSelector.onAddComposition = onAddComposition;
//     },
//     addComposition: (composition: Composition<T>) => {
//       if (nodeSelector.onAddComposition) {
//         nodeSelector.onAddComposition(composition, []);
//       }
//     },
//     destoyCanvasApp: () => {
//       nodeTransformer.destroy();
//     },
//     getIsCameraFollowingPaused: () => {
//       return isCameraFollowingPaused;
//     },
//     setIsCameraFollowingPaused: (paused: boolean) => {
//       isCameraFollowingPaused = paused;
//     },
//     getOnCanvasUpdated: () => {
//       return onCanvasUpdated;
//     },
//     setOnCanvasUpdated: (onCanvasUpdatedHandler: () => void) => {
//       onCanvasUpdated = onCanvasUpdatedHandler;
//     },
//     setOnCanvasClick: (
//       onClickCanvasHandler: (x: number, y: number) => void
//     ) => {
//       onClickCanvas = onClickCanvasHandler;
//     },
//     setCanvasAction: (
//       setCanvasActionHandler: (
//         canvasAction: CanvasAction,
//         payload?: any
//       ) => void
//     ) => {
//       setCanvasAction = setCanvasActionHandler;
//     },
//     resetNodeTransform: () => {
//       nodeTransformer.detachNode();
//     },
//     setOnCameraChanged: (
//       onCameraChangedHandler: (camera: {
//         x: number;
//         y: number;
//         scale: number;
//       }) => void
//     ) => {
//       onCameraChanged = onCameraChangedHandler;
//     },
//     getCamera: () => {
//       return {
//         x: xCamera,
//         y: yCamera,
//         scale: scaleCamera,
//       };
//     },
//     setCamera: (x: number, y: number, scale: number) => {
//       xCamera = x;
//       yCamera = y;
//       scaleCamera = scale;

//       setCamera(xCamera, yCamera, scaleCamera);
//       nodeTransformer.updateCamera();
//       nodeSelector.updateCamera();

//       if (onCameraChanged) {
//         onCameraChanged({ x: xCamera, y: yCamera, scale: scaleCamera });
//       }

//       let boudingBoxCorrectionX = 0;
//       let boudingBoxCorrectionY = 0;
//       boudingBoxCorrectionX = 0; //boundingBox.x + scrollLeft;
//       boudingBoxCorrectionY = 0; //boundingRectHelper.y + scrollTopHelper;
//       (canvas.domElement as unknown as HTMLElement).style.transform =
//         'translate(' +
//         (xCamera - boudingBoxCorrectionX) +
//         'px,' +
//         (yCamera - boudingBoxCorrectionY) +
//         'px) ' +
//         'scale(' +
//         scaleCamera +
//         ',' +
//         scaleCamera +
//         ') ';
//     },
//     transformCameraSpaceToWorldSpace: (x: number, y: number) => {
//       return transformCameraSpaceToWorldSpace(x, y);
//     },
//     setDisableInteraction: (disable: boolean) => {
//       disableInteraction = disable;
//     },
//     removeEvents: () => {
//       removeEvents();
//     },
//     centerCamera: () => {
//       console.log('centerCamera');
//       let minX: number | undefined = undefined;
//       let minY: number | undefined = undefined;
//       let maxX: number | undefined = undefined;
//       let maxY: number | undefined = undefined;
//       elements.forEach((element) => {
//         const elementHelper = element as unknown as INodeComponent<T>;
//         if (
//           elementHelper.nodeType === NodeType.Shape &&
//           elementHelper.width !== undefined &&
//           elementHelper.height !== undefined
//         ) {
//           //console.log('element', element);
//           if (minX === undefined || elementHelper.x < minX) {
//             minX = elementHelper.x;
//           }
//           if (minY === undefined || elementHelper.y < minY) {
//             minY = elementHelper.y;
//           }
//           if (
//             maxX === undefined ||
//             elementHelper.x + elementHelper.width > maxX
//           ) {
//             maxX = elementHelper.x + elementHelper.width;
//           }
//           if (
//             maxY === undefined ||
//             elementHelper.y + elementHelper.height > maxY
//           ) {
//             maxY = elementHelper.y + elementHelper.height;
//           }
//         }
//       });

//       if (
//         minX !== undefined &&
//         minY !== undefined &&
//         maxX !== undefined &&
//         maxY !== undefined
//       ) {
//         const rootWidth = rootElement.clientWidth;
//         const rootHeight = rootElement.clientHeight;

//         const helperWidth = maxX - minX;
//         const helperScale = rootWidth / helperWidth;
//         const helperHeight = maxY - minY;
//         const helperScaleHeight = rootHeight / helperHeight;

//         const width = maxX - minX + 120 / helperScale;
//         const height = maxY - minY + 240 / helperScaleHeight;

//         let scale = rootWidth / width;
//         const scaleX = scale;
//         if (height * scale > rootHeight) {
//           scale = rootHeight / (height * scale);
//         }
//         scale = rootHeight / height;
//         if (scale > scaleX) {
//           scale = scaleX;
//         }
//         console.log(
//           'centerCamera x',
//           minX,
//           maxX,
//           'width',
//           width,
//           'rootWidth',
//           rootWidth,
//           scaleX,
//           scale
//         );

//         console.log(
//           'centerCamera y',
//           minY,
//           maxY,
//           'height',
//           height,
//           'rootHeight',
//           rootHeight
//         );

//         //const boundingRect = rootElement.getBoundingClientRect();

//         // const boudingBoxCorrectionX = -175 + boundingBox.x * 2; // 400; //;
//         // const boudingBoxCorrectionY = -180 + -boundingBox.y * 4; // -500; //boundingBox.y;
//         // const boudingBoxCorrectionX =
//         //   -boundingBox.x - (widthSpaceForSideToobars ?? 0); // 32; //-230; //-boundingBox.x; // 400; //;
//         // const boudingBoxCorrectionY =
//         //   -boundingBox.y - (heightSpaceForHeaderFooterToolbars ?? 0); // 100; //-150 //-boundingBox.y; // -500; //boundingBox.y;

//         const boudingBoxCorrectionX = -(widthSpaceForSideToobars ?? 0); // 32; //-230; //-boundingBox.x; // 400; //;
//         const boudingBoxCorrectionY = -(
//           heightSpaceForHeaderFooterToolbars ?? 0
//         ); // 100; //-150 //-boundingBox.y; // -500; //boundingBox.y;

//         xCamera =
//           rootWidth / 2 -
//           (scale * width) / 2 -
//           scale * (minX + (-60 + 60) / helperScale) -
//           boudingBoxCorrectionX;
//         yCamera =
//           rootHeight / 2 -
//           (scale * height) / 2 -
//           scale * (minY + (-120 + 120) / helperScaleHeight) -
//           boudingBoxCorrectionY;
//         scaleCamera = scale;

//         console.log('centerCamera', xCamera, yCamera, scaleCamera);
//       }

//       setCamera(xCamera, yCamera, scaleCamera);
//       nodeTransformer.updateCamera();
//       if (onCameraChanged) {
//         onCameraChanged({ x: xCamera, y: yCamera, scale: scaleCamera });
//       }

//       (canvas.domElement as unknown as HTMLElement).style.transform =
//         'translate(' +
//         xCamera +
//         'px,' +
//         yCamera +
//         'px) ' +
//         'scale(' +
//         scaleCamera +
//         ',' +
//         scaleCamera +
//         ') ';

//       if (onWheelEvent) {
//         onWheelEvent(xCamera, yCamera, scaleCamera);
//       }
//     },
//     selectNode: (nodeComponent: IRectNodeComponent<T>) => {
//       if (!nodeComponent) {
//         return;
//       }
//       setSelectNode({
//         id: nodeComponent.id,
//         containerNode:
//           nodeComponent.containerNode as unknown as IRectNodeComponent<unknown>,
//       });
//       nodeTransformer.attachNode(
//         nodeComponent as unknown as IRectNodeComponent<BaseNodeInfo>
//       );
//     },
//     deselectNode: () => {
//       setSelectNode(undefined);
//       nodeTransformer.detachNode();
//     },
//     createRect: (
//       x: number,
//       y: number,
//       width: number,
//       height: number,
//       text?: string,
//       thumbs?: IThumb[],
//       markup?: string | INodeComponent<T> | HTMLElement,
//       layoutProperties?: {
//         classNames?: string;
//       },
//       hasStaticWidthHeight?: boolean,
//       disableInteraction?: boolean,
//       disableManualResize?: boolean,
//       id?: string,
//       nodeInfo?: T,
//       containerNode?: IRectNodeComponent<T>,
//       isStaticPosition?: boolean,
//       parentNodeClassNames?: string
//     ) => {
//       const rectInstance = new Rect<T>(
//         canvas as unknown as INodeComponent<T>,
//         interactionStateMachine,
//         nodeTransformer as unknown as NodeTransformer<BaseNodeInfo>,
//         pathHiddenElement,
//         elements,
//         x,
//         y,
//         width,
//         height,
//         text,
//         thumbs,
//         markup,
//         layoutProperties,
//         hasStaticWidthHeight,
//         disableInteraction,
//         disableManualResize,
//         onCanvasUpdated,
//         id,
//         containerNode,
//         isStaticPosition,
//         parentNodeClassNames,
//         setCanvasAction,
//         rootElement
//       );
//       if (!rectInstance || !rectInstance.nodeComponent) {
//         throw new Error('rectInstance is undefined');
//       }
//       rectInstanceList[rectInstance.nodeComponent.id] = rectInstance;
//       rectInstance.nodeComponent.nodeInfo = nodeInfo;
//       if (onCanvasUpdated) {
//         onCanvasUpdated(undefined, undefined, FlowChangeType.AddNode);
//       }
//       return rectInstance;
//     },
//     createRectThumb: (
//       x: number,
//       y: number,
//       width: number,
//       height: number,
//       text?: string,
//       thumbs?: IThumb[],
//       markup?: string | INodeComponent<T>,
//       layoutProperties?: {
//         classNames?: string;
//       },
//       hasStaticWidthHeight?: boolean,
//       disableInteraction?: boolean,
//       disableManualResize?: boolean,
//       id?: string,
//       nodeInfo?: T,
//       containerNode?: IRectNodeComponent<T>,
//       isStaticPosition?: boolean,
//       isCircle?: boolean,
//       createStraightLineConnection?: boolean
//     ) => {
//       const rectInstance = new RectThumb<T>(
//         canvas as unknown as INodeComponent<T>,
//         interactionStateMachine,
//         nodeTransformer as unknown as NodeTransformer<BaseNodeInfo>,
//         pathHiddenElement,
//         elements,
//         x,
//         y,
//         width,
//         height,
//         text,
//         thumbs,
//         markup,
//         layoutProperties,
//         hasStaticWidthHeight,
//         disableInteraction,
//         disableManualResize,
//         onCanvasUpdated,
//         id,
//         containerNode,
//         isStaticPosition,
//         isCircle,
//         createStraightLineConnection,
//         setCanvasAction,
//         rootElement
//       );
//       if (!rectInstance || !rectInstance.nodeComponent) {
//         throw new Error('rectInstance is undefined');
//       }
//       rectInstance.nodeComponent.nodeInfo = nodeInfo;
//       if (onCanvasUpdated) {
//         onCanvasUpdated(undefined, undefined, FlowChangeType.AddNode);
//       }
//       return rectInstance;
//     },
//     createCubicBezier: (
//       startX?: number,
//       startY?: number,
//       endX?: number,
//       endY?: number,
//       controlPointX1?: number,
//       controlPointY1?: number,
//       controlPointX2?: number,
//       controlPointY2?: number,
//       isControlled?: boolean,
//       isDashed = false,
//       id?: string,
//       containerNode?: IRectNodeComponent<T>
//     ) => {
//       const curve = new CubicBezierConnection<T>(
//         canvas as unknown as INodeComponent<T>,
//         interactionStateMachine,
//         pathHiddenElement,
//         elements,
//         startX ?? 0,
//         startY ?? 0,
//         endX ?? 0,
//         endY ?? 0,
//         controlPointX1 ?? 0,
//         controlPointY1 ?? 0,
//         controlPointX2 ?? 0,
//         controlPointY2 ?? 0,
//         isControlled,
//         isDashed,
//         onCanvasUpdated,
//         id,
//         containerNode,
//         theme,
//         setCanvasAction,
//         rootElement
//       );
//       curve.connectionUpdateState = undefined;
//       if (onCanvasUpdated) {
//         onCanvasUpdated(undefined, undefined, FlowChangeType.AddConnection);
//       }
//       return curve;
//     },
//     createQuadraticBezier: (
//       startX?: number,
//       startY?: number,
//       endX?: number,
//       endY?: number,
//       controlPointX?: number,
//       controlPointY?: number,
//       isControlled?: boolean,
//       isDashed = false,
//       id?: string,
//       containerNode?: IRectNodeComponent<T>
//     ) => {
//       const curve = new QuadraticBezierConnection<T>(
//         canvas as unknown as INodeComponent<T>,
//         interactionStateMachine,
//         pathHiddenElement,
//         elements,
//         startX ?? 0,
//         startY ?? 0,
//         endX ?? 0,
//         endY ?? 0,
//         controlPointX ?? 0,
//         controlPointY ?? 0,
//         isControlled,
//         isDashed,
//         onCanvasUpdated,
//         id,
//         containerNode,
//         theme,
//         setCanvasAction,
//         rootElement
//       );
//       curve.connectionUpdateState = undefined;
//       if (onCanvasUpdated) {
//         onCanvasUpdated(undefined, undefined, FlowChangeType.AddConnection);
//       }
//       return curve;
//     },
//     createLine: (
//       startX?: number,
//       startY?: number,
//       endX?: number,
//       endY?: number,
//       isControlled?: boolean,
//       isDashed = false,
//       id?: string,
//       containerNode?: IRectNodeComponent<T>
//     ) => {
//       const line = new LineConnection<T>(
//         canvas as unknown as INodeComponent<T>,
//         interactionStateMachine,
//         pathHiddenElement,
//         elements,
//         startX ?? 0,
//         startY ?? 0,
//         endX ?? 0,
//         endY ?? 0,
//         0,
//         0,
//         isControlled,
//         isDashed,
//         onCanvasUpdated,
//         id,
//         containerNode,
//         theme,
//         setCanvasAction,
//         rootElement
//       );
//       line.connectionUpdateState = undefined;
//       if (onCanvasUpdated) {
//         onCanvasUpdated(undefined, undefined, FlowChangeType.AddConnection);
//       }
//       return line;
//     },
//     editThumbNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
//       if (!nodeComponent) {
//         return;
//       }
//       const rectInstance = rectInstanceList[nodeComponent.id];
//       if (!rectInstance) {
//         return;
//       }

//       if (rectInstance.nodeComponent?.thumbConnectors) {
//         const thumbIndex = rectInstance.nodeComponent.thumbConnectors.findIndex(
//           (t) =>
//             t.thumbIdentifierWithinNode === thumb.thumbIdentifierWithinNode &&
//             thumb.thumbIdentifierWithinNode
//         );
//         if (thumbIndex >= 0) {
//           const thumbNode =
//             rectInstance.nodeComponent.thumbConnectors[thumbIndex];

//           if (thumbNode) {
//             rectInstance.nodeComponent.connections.forEach((c) => {
//               if (c.startNodeThumb?.id === thumbNode.id) {
//                 c.startNodeThumb.thumbConstraint = thumb.thumbConstraint;
//                 c.startNodeThumb.prefixLabel = thumb.prefixLabel;

//                 updateThumbPrefixLabel(
//                   thumb.prefixLabel ?? '',
//                   c.startNodeThumb
//                 );

//                 if (c.endNodeThumb?.thumbConstraint !== thumb.thumbConstraint) {
//                   c.startNodeThumb = undefined;
//                   c.startNode = undefined;
//                 }
//               }
//               if (c.endNodeThumb?.id === thumbNode.id) {
//                 c.endNodeThumb.thumbConstraint = thumb.thumbConstraint;
//                 c.endNodeThumb.prefixLabel = thumb.prefixLabel;

//                 updateThumbPrefixLabel(thumb.prefixLabel ?? '', c.endNodeThumb);

//                 if (
//                   c.startNodeThumb?.thumbConstraint !== thumb.thumbConstraint
//                 ) {
//                   c.endNodeThumb = undefined;
//                   c.endNode = undefined;
//                 }
//               }
//             });
//             const nodeId = rectInstance.nodeComponent.id;

//             rectInstance.nodeComponent.connections =
//               rectInstance.nodeComponent.connections.filter(
//                 (c) => c.startNode?.id === nodeId || c.endNode?.id === nodeId
//               );
//           }
//         }
//       }

//       rectInstance.cachedHeight = -1;
//       rectInstance.cachedWidth = -1;

//       // ugly workaround for getting correct height because when calculating the above the thumb wasn't at the correct position

//       nodeComponent?.update?.(
//         nodeComponent,
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent
//       );

//       // now recalculate height of node

//       rectInstance.updateMinHeight();
//       rectInstance.updateNodeSize(
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent.width ?? 0,
//         nodeComponent.height ?? 0,
//         false
//       );
//       rectInstance.cachedHeight = -1;
//       rectInstance.cachedWidth = -1;

//       nodeComponent?.update?.(
//         nodeComponent,
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent
//       );
//     },
//     deleteThumbNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
//       if (!nodeComponent) {
//         return;
//       }
//       const rectInstance = rectInstanceList[nodeComponent.id];
//       if (!rectInstance) {
//         return;
//       }

//       if (rectInstance.nodeComponent?.thumbConnectors) {
//         const thumbIndex = rectInstance.nodeComponent.thumbConnectors.findIndex(
//           (t) =>
//             t.thumbIdentifierWithinNode === thumb.thumbIdentifierWithinNode &&
//             thumb.thumbIdentifierWithinNode
//         );
//         if (thumbIndex >= 0) {
//           const thumbNode =
//             rectInstance.nodeComponent.thumbConnectors[thumbIndex];

//           if (thumbNode) {
//             rectInstance.nodeComponent.elements?.delete(thumbNode.id);
//             rectInstance.nodeComponent.thumbConnectors.splice(thumbIndex, 1);

//             rectInstance.nodeComponent.connections.forEach((c) => {
//               if (c.startNodeThumb?.id === thumbNode.id) {
//                 c.startNodeThumb = undefined;
//                 c.startNode = undefined;
//               }
//               if (c.endNodeThumb?.id === thumbNode.id) {
//                 c.endNodeThumb = undefined;
//                 c.endNode = undefined;
//               }
//             });
//             const nodeId = rectInstance.nodeComponent.id;
//             rectInstance.nodeComponent.connections =
//               rectInstance.nodeComponent.connections.filter(
//                 (c) => c.startNode?.id === nodeId || c.endNode?.id === nodeId
//               );
//             thumbNode.domElement.remove();
//             thumbNode.delete?.();
//           }
//         }
//       }

//       console.log('deleteThumbNode', thumb, nodeComponent);

//       rectInstance.cachedHeight = -1;
//       rectInstance.cachedWidth = -1;

//       // ugly workaround for getting correct height because when calculating the above the thumb wasn't at the correct position

//       nodeComponent?.update?.(
//         nodeComponent,
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent
//       );

//       // now recalculate height of node

//       rectInstance.updateMinHeight();
//       rectInstance.updateNodeSize(
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent.width ?? 0,
//         nodeComponent.height ?? 0,
//         false
//       );
//       rectInstance.cachedHeight = -1;
//       rectInstance.cachedWidth = -1;

//       nodeComponent?.update?.(
//         nodeComponent,
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent
//       );
//       return undefined;
//     },
//     addThumbToNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => {
//       if (!nodeComponent) {
//         return;
//       }
//       const rectInstance = rectInstanceList[nodeComponent.id];
//       if (!rectInstance) {
//         return;
//       }
//       const { x, y } = thumbPosition(
//         nodeComponent,
//         thumb.thumbType,
//         thumb.thumbIndex ?? 0
//       );

//       const thumbNode = new ThumbNodeConnector<T>(
//         thumb,
//         nodeComponent.domElement,
//         canvas,
//         interactionStateMachine,
//         nodeComponent.elements,
//         thumb.name ??
//           (thumb.connectionType === ThumbConnectionType.start
//             ? 'output'
//             : 'input'),
//         thumb.thumbType,
//         thumb.connectionType,
//         thumb.color ?? '#008080',
//         x,
//         y,
//         undefined,
//         NodeType.Connector,
//         `${cssClasses.defaultNodePortClasses} ${thumb.class ?? ''} ${
//           thumb.hidden ? 'invisible pointer-events-none' : ''
//         }`,
//         undefined,
//         undefined,
//         undefined,
//         undefined,
//         undefined,
//         thumb.thumbIndex ?? 0,
//         true,

//         elements,
//         nodeComponent,
//         pathHiddenElement,
//         false,
//         thumb.label,
//         thumb.thumbShape ?? 'circle',
//         onCanvasUpdated,
//         rectInstance.containerNode,
//         undefined,
//         rootElement
//       );

//       if (!thumbNode.nodeComponent) {
//         throw new Error('ThumbNode.nodeComponent is undefined');
//       }
//       thumbNode.nodeComponent.pathName = thumb.pathName;
//       thumbNode.nodeComponent.isControlled = true;
//       thumbNode.nodeComponent.isConnectPoint = true;
//       thumbNode.nodeComponent.thumbConnectionType = thumb.connectionType;
//       thumbNode.nodeComponent.thumbControlPointDistance =
//         thumb.controlPointDistance;
//       thumbNode.nodeComponent.thumbLinkedToNode = nodeComponent;
//       thumbNode.nodeComponent.thumbConstraint = thumb.thumbConstraint;
//       thumbNode.nodeComponent.isDataPort = thumb.isDataPort;
//       thumbNode.nodeComponent.maxConnections = thumb.maxConnections;
//       thumbNode.nodeComponent.thumbFormId = thumb.formId;
//       thumbNode.nodeComponent.thumbFormFieldName = thumb.formFieldName;

//       thumbNode.nodeComponent.onCanReceiveDroppedComponent =
//         rectInstance.onCanReceiveDroppedComponent;
//       thumbNode.nodeComponent.onReceiveDraggedConnection =
//         rectInstance.onReceiveDraggedConnection(nodeComponent);
//       thumbNode.nodeComponent.update =
//         rectInstance.onEndThumbConnectorElementupdate;

//       if (nodeComponent.thumbConnectors) {
//         nodeComponent.thumbConnectors.push(thumbNode.nodeComponent);
//       }

//       rectInstance.cachedHeight = -1;
//       rectInstance.cachedWidth = -1;

//       // ugly workaround for getting correct height because when calculating the above the thumb wasn't at the correct position

//       nodeComponent?.update?.(
//         nodeComponent,
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent
//       );

//       // now recalculate height of node

//       rectInstance.updateMinHeight();
//       rectInstance.updateNodeSize(
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent.width ?? 0,
//         nodeComponent.height ?? 0,
//         false
//       );
//       rectInstance.cachedHeight = -1;
//       rectInstance.cachedWidth = -1;

//       nodeComponent?.update?.(
//         nodeComponent,
//         nodeComponent.x,
//         nodeComponent.y,
//         nodeComponent
//       );
//       return undefined;
//     },
//     deleteElement: (id: string) => {
//       const node = elements?.get(id);
//       if (node && node.nodeInfo) {
//         if ((node.nodeInfo as any).canvasAppInstance) {
//           (node.nodeInfo as any).canvasAppInstance.destoyCanvasApp();
//         }
//       }
//       elements?.delete(id);
//       if (rectInstanceList[id]) {
//         delete rectInstanceList[id];
//       }
//     },
//     deleteElementFromNode: (
//       element: INodeComponent<T>,
//       child: INodeComponent<T>,
//       noCanvasUpdated = false
//     ) => {
//       if (element && child) {
//         if (element.elements) {
//           element.elements.delete(child.id);
//         }
//         element.domElement.removeChild(child.domElement);

//         if (onCanvasUpdated && !noCanvasUpdated) {
//           onCanvasUpdated();
//         }
//       }
//     },
//     setOnWheelEvent: (
//       onWheelEventHandler: (x: number, y: number, scale: number) => void
//     ) => {
//       onWheelEvent = onWheelEventHandler;
//     },
//     setonDragCanvasEvent: (
//       onDragCanvasEventHandler: (x: number, y: number) => void
//     ) => {
//       onDragCanvasEvent = onDragCanvasEventHandler;
//     },
//     registerVariable: (
//       variableName: string,
//       variable: {
//         id: string;
//         getData: () => any;
//         setData: (data: any) => void;
//         initializeDataStructure?: (structureInfo: any) => void;
//         removeScope: (scopeId: string) => void;
//       }
//     ) => {
//       if (variableName && variable.id) {
//         variables[variableName] = variable;
//       }
//     },
//     registerTempVariable: (
//       variableName: string,
//       data: any,
//       scopeId: string
//     ) => {
//       if (!tempVariables[scopeId]) {
//         tempVariables[scopeId] = {};
//       }
//       tempVariables[scopeId][variableName] = data;
//     },
//     unregisterVariable: (variableName: string, id: string) => {
//       if (
//         id &&
//         variableName &&
//         variables[variableName] &&
//         variables[variableName].id === id
//       ) {
//         delete variables[variableName];
//       }
//     },
//     getVariable: (variableName: string, parameter?: any, scopeId?: string) => {
//       if (
//         variableName &&
//         scopeId &&
//         tempVariables[scopeId] &&
//         tempVariables[scopeId][variableName]
//       ) {
//         return tempVariables[scopeId][variableName];
//       }
//       if (variableName && variables[variableName]) {
//         return variables[variableName].getData(parameter, scopeId);
//       }
//       return false;
//     },
//     getVariableInfo: (variableName: string, scopeId?: string) => {
//       if (scopeId && tempVariables[scopeId][variableName]) {
//         return {
//           [variableName]: {
//             id: variableName,
//           },
//           data: tempVariables[scopeId][variableName],
//         };
//       }

//       if (variableName && variables[variableName]) {
//         return {
//           ...variables[variableName],
//           data: variables[variableName].getData(undefined, scopeId),
//         };
//       }
//       return false;
//     },
//     setVariable: (
//       variableName: string,
//       data: any,
//       scopeId?: string,
//       runCounter?: any,
//       isInitializing?: boolean
//     ) => {
//       if (scopeId && tempVariables[scopeId][variableName]) {
//         tempVariables[scopeId][variableName] = data;
//       } else if (variableName && variables[variableName]) {
//         variables[variableName].setData(data, scopeId);
//         if (isInitializing) {
//           // prevents infinite loop when "reset state" is pressed when observe-variable is used
//           // see celsius-fahrenheit converter
//           return;
//         }
//         const map = variableObservers.get(`${variableName}`);
//         if (map) {
//           map.forEach((observer) => {
//             observer(data, runCounter);
//           });
//         }
//       }
//     },
//     getVariables: (scopeId?: string) => {
//       const result: Record<string, any> = {};
//       Object.entries(variables).forEach(([key, value]) => {
//         if (key) {
//           result[key] = value.getData(undefined, scopeId);
//         }
//       });
//       return result;
//     },
//     deleteVariables: () => {
//       variables = {};
//       variableObservers.clear();
//     },
//     getVariableNames: (scopeId?: string) => {
//       if (scopeId) {
//         return [
//           ...Object.keys(variables),
//           ...Object.keys(tempVariables[scopeId] ?? {}),
//         ];
//       }
//       return Object.keys(variables);
//     },
//     initializeVariableDataStructure: (
//       variableName: string,
//       structureInfo: any,
//       scopeId?: string
//     ) => {
//       if (variableName && variables[variableName]) {
//         const variable = variables[variableName];
//         if (variable.initializeDataStructure) {
//           variable.initializeDataStructure(structureInfo, scopeId);
//         }
//       }
//     },
//     observeVariable: (
//       nodeId: string,
//       variableName: string,
//       updated: (data: any, runCounter?: any) => void
//     ) => {
//       let map = variableObservers.get(`${variableName}`);
//       if (!map) {
//         map = new Map();
//         variableObservers.set(`${variableName}`, map);
//       }
//       map.set(`${nodeId}`, updated);
//     },
//     removeObserveVariable: (nodeId: string, variableName: string) => {
//       const map = variableObservers.get(`${variableName}`);
//       if (map) {
//         map.delete(`${nodeId}`);
//       }
//     },
//     removeScope: (scopeId: string) => {
//       if (scopeId) {
//         const keys = Object.keys(variables);
//         keys.forEach((key) => {
//           const variable = variables[key];
//           variable.removeScope(scopeId);
//         });

//         if (tempVariables[scopeId]) {
//           delete tempVariables[scopeId];
//         }
//       }
//     },
//     registerCommandHandler: (name: string, handler: ICommandHandler) => {
//       commandHandlers[name] = handler;
//     },
//     unregisterCommandHandler: (name: string) => {
//       delete commandHandlers[name];
//     },
//     registeGetNodeStateHandler: (
//       name: string,
//       handler: GetNodeStatedHandler
//     ) => {
//       nodeGetStateHandlers[name] = handler;
//     },
//     unRegisteGetNodeStateHandler: (name: string) => {
//       delete nodeGetStateHandlers[name];
//     },
//     registeSetNodeStateHandler: (
//       name: string,
//       handler: SetNodeStatedHandler
//     ) => {
//       nodeSetStateHandlers[name] = handler;
//     },
//     unRegisteSetNodeStateHandler: (name: string) => {
//       delete nodeSetStateHandlers[name];
//     },
//     getNodeStates: () => {
//       const result: Map<string, any> = new Map();
//       Object.entries(nodeGetStateHandlers).forEach(([key, getHandler]) => {
//         if (key) {
//           const nodeState = getHandler();
//           result.set(nodeState.id, nodeState.data);
//         }
//       });
//       return result;
//     },
//     getNodeState: (id: string) => {
//       const getHandler = nodeGetStateHandlers[id];
//       if (getHandler) {
//         const nodeState = getHandler();
//         return nodeState.data;
//       }
//       return undefined;
//     },
//     setNodeStates: (nodeStates: Map<string, any>) => {
//       nodeStates.forEach((data, id) => {
//         const setHandler = nodeSetStateHandlers[id];
//         if (setHandler) {
//           setHandler(id, data);
//         }
//       });
//     },

//     executeCommandOnCommandHandler: (
//       name: string,
//       commandName: string,
//       data: any
//     ) => {
//       if (commandHandlers[name]) {
//         commandHandlers[name].execute(commandName, data);
//       }
//     },

//     setMediaLibrary: (mediaLibrary: MediaLibrary) => {
//       mediaLibraryInstance = mediaLibrary;
//     },
//     getMediaLibrary: () => {
//       return mediaLibraryInstance;
//     },
//     setAnimationFunctions: (newAnimationFunctions: AnimatePathFunctions<T>) => {
//       animationFunctions = newAnimationFunctions;
//     },
//     getAnimationFunctions: () => {
//       return animationFunctions;
//     },
//     getSelectedNodes: () => {
//       return nodeSelector.getSelectedNodes();
//     },
//     resetNodeSelector: () => {
//       nodeSelector.selectionWasPlacedOrMoved = false;
//       nodeSelector.removeSelector();
//     },
//     setOnNodeMessage: (event: (keyName: string, value: any) => void) => {
//       onNodeMessage = event;
//     },
//     sendMessageFromNode: (key: string, value: any) => {
//       if (onNodeMessage) {
//         onNodeMessage(key, value);
//       }
//     },
//     sendMessageToNode: (key: string, value: any) => {
//       listeners.forEach((l) => {
//         if (l.key === key) {
//           l.listener(key, value);
//         }
//       });
//     },
//     registerNodeKeyListener: (
//       key: string,
//       listener: (key: string, value: any) => void
//     ) => {
//       listeners.push({
//         key,
//         listener,
//       });
//     },
//     removeNodeKeyListener: (
//       key: string,
//       listener: (key: string, value: any) => void
//     ) => {
//       listeners = listeners.filter(
//         (l) => l.key !== key && l.listener !== listener
//       );
//     },
//     setApiUrlRoot: (apiUrlRoot: string) => {
//       apiUrl = apiUrlRoot;
//     },
//     getApiUrlRoot: () => {
//       return apiUrl;
//     },
//   };
// };
