import { transformToCamera } from '../camera';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  IRectNodeComponent,
  NodeComponentRelationType,
  ThumbConnectionType,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { ThumbType } from '../types';
import { createElement, createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { createCubicBezier, createQuadraticBezier } from './bezier';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

export const createThumbSVGElement = <T>(
  canvasElement: DOMElementNode,
  interactionStateMachine: InteractionStateMachine<T>,
  elements: ElementNodeMap<T>,
  thumbType: ThumbType,
  color?: string,
  xInitial?: string | number,
  yInitial?: string | number,
  specifier?: string,
  nodeType?: string,
  additionalClasses?: string,
  width?: number,
  height?: number,
  radius?: number,
  isTransparent?: boolean,
  borderColor?: string,
  index?: number,
  relativePositioned?: boolean,
  canvas?: INodeComponent<T>,
  canvasElements?: ElementNodeMap<T>,
  parentRectNode?: IRectNodeComponent<T>,
  pathHiddenElement?: IElementNode<T>,
  disableInteraction?: boolean
) => {
  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };

  const initialX =
    xInitial !== undefined ? xInitial : Math.floor(Math.random() * 1024);
  const initialY =
    yInitial !== undefined ? yInitial : Math.floor(Math.random() * 500);
  //console.log('createSVGElement', initialX, initialY, specifier);
  // const nodeComponent: INodeComponent<T> = createSVGNodeComponent(
  //   'svg',
  const nodeComponent: INodeComponent<T> = createElement(
    'div',
    {
      // will-change-transform
      class: `absolute cursor-pointer transition-none   pointer-events-none ${
        additionalClasses || ''
      }`,
      style: {
        transform: relativePositioned
          ? ''
          : `translate(${initialX}px, ${initialY}px)`,
        width: `${width ?? 100}px`,
        height: `${height ?? 100}px`,
        top: relativePositioned
          ? `calc(${initialY} - ${(height ?? 100) / 2}px)`
          : '0px',
        left: relativePositioned
          ? `calc(${initialX} - ${(width ?? 100) / 2}px)`
          : '0px',
      },
      width: width ?? 100,
      height: height ?? 100,
    },
    canvasElement
  ) as INodeComponent<T>;

  nodeComponent.x = 0;
  nodeComponent.y = 0;
  nodeComponent.components = [];

  (nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
    nodeComponent.id;
  let circleElement: IElementNode<T> | undefined = undefined;
  //circleElement = createNSElement(
  circleElement = createElement(
    'div', //'circle',
    {
      class: `${
        disableInteraction ? 'pointer-events-none' : 'pointer-events-auto'
      } rounded-full origin-center border-[3px]`,
      style: {
        width: `${(radius ?? 10) * 2}px`,
        height: `${(radius ?? 10) * 2}px`,
        transform: `translate(${-(radius ?? 10) + (width ?? 100) / 2}px, ${
          -(radius ?? 10) + (height ?? 100) / 2
        }px)`,
        'border-color': isTransparent
          ? 'transparent'
          : borderColor
          ? borderColor
          : 'black',
        'background-color': isTransparent
          ? 'transparent'
          : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
      cx: (width ?? 100) / 2,
      cy: (height ?? 100) / 2,
      r: radius ?? 10,
      stroke: isTransparent
        ? 'transparent'
        : borderColor
        ? borderColor
        : 'black',
      'stroke-width': 3,
      fill: isTransparent
        ? 'transparent'
        : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
      pointerover: (_e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }
        console.log('svg pointerover', nodeComponent.id);
        (nodeComponent.domElement as unknown as SVGElement).classList.remove(
          'cursor-pointer'
        );
        (nodeComponent.domElement as unknown as SVGElement).classList.add(
          'cursor-pointer'
        );
        if (nodeComponent.isConnectPoint) {
          if (nodeComponent.onCanReceiveDroppedComponent) {
            //TODO : get the current interactive element and check if it can be dropped here
            const state = interactionStateMachine.getCurrentInteractionState();
            if (state && state.element) {
              const canReceiveDrop = nodeComponent.onCanReceiveDroppedComponent(
                nodeComponent,
                state.element
              );
              if (!canReceiveDrop) {
                (
                  nodeComponent.domElement as unknown as SVGElement
                ).classList.remove('cursor-pointer');
                console.log(
                  'svg cant register drop target for current dragging element',
                  state.element.id
                );
                return;
              }
            }
          }
          console.log('svg register drop target', nodeComponent.id);
          interactionStateMachine.setCurrentDropTarget(nodeComponent);
        }
      },
      pointerleave: (_e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }
        if (nodeComponent.isConnectPoint) {
          console.log('svg unregister drop target', nodeComponent.id);
          interactionStateMachine.clearDropTarget(nodeComponent);
        }
      },
      pointerdown: (e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }
        if (nodeComponent) {
          /* 
          TODO:
          if:
          - no interaction is in progress
          - thumb is node thumb connector
          - thumbConnectionType is start
          - node is not connected
          then:
          - create a connection starting from this node and thumb
          - initialize the interaction state machine with the new connection
          */

          if (
            nodeComponent.thumbConnectionType === ThumbConnectionType.start &&
            nodeComponent.isConnectPoint &&
            parentRectNode &&
            canvasElements
          ) {
            console.log('thumb pointerdown', nodeComponent.id, nodeComponent);
            //e.preventDefault();

            // const elementRect = (
            //   nodeComponent.domElement as unknown as HTMLElement | SVGElement
            // ).getBoundingClientRect();
            const { x, y } = transformToCamera(e.clientX, e.clientY);
            //const rectCamera = transformToCamera(elementRect.x, elementRect.y);
            const curve = createCubicBezier<T>(
              canvas as unknown as INodeComponent<T>,
              interactionStateMachine,
              pathHiddenElement as unknown as IElementNode<T>,
              canvasElements,
              x - 50,
              y - 50,
              x - 50,
              y - 50,
              x - 50,
              y - 50,
              x - 50,
              y - 50,
              false
            );

            if (curve && canvas) {
              console.log(
                'new curve created',
                curve.nodeComponent.id,
                curve.endPointElement.id
              );
              curve.nodeComponent.isControlled = true;
              curve.nodeComponent.components.push({
                type: NodeComponentRelationType.start,
                component: parentRectNode,
              } as unknown as INodeComponentRelation<T>);

              curve.nodeComponent.startNode = parentRectNode;
              curve.nodeComponent.startNodeThumb = nodeComponent;
              parentRectNode.connections?.push(curve.nodeComponent);

              if (curve.nodeComponent.update) {
                curve.nodeComponent.update();
              }

              const elementRect = (
                curve.endPointElement.domElement as unknown as
                  | HTMLElement
                  | SVGElement
              ).getBoundingClientRect();

              const rectCamera = transformToCamera(
                elementRect.x,
                elementRect.y
              );

              const interactionInfoResult = pointerDown(
                x - rectCamera.x,
                y - rectCamera.y,
                curve.endPointElement,
                canvas.domElement,
                interactionStateMachine
              );
              if (
                interactionInfoResult &&
                curve.endPointElement.initPointerDown
              ) {
                curve.endPointElement.initPointerDown(
                  interactionInfoResult.xOffsetWithinElementOnFirstClick,
                  interactionInfoResult.yOffsetWithinElementOnFirstClick
                );
              }

              if (curve.endPointElement.getThumbCircleElement) {
                const circleDomElement =
                  curve.endPointElement.getThumbCircleElement();
                console.log('circleDomElement', circleDomElement);
                circleDomElement.classList.remove('pointer-events-auto');
                circleDomElement.classList.add('pointer-events-none');
              }

              console.log(
                'new curve interactionInfoResult',
                interactionInfoResult
              );
            }

            return;
          }

          if (nodeComponent.isControlled) {
            return;
          }
          const elementRect = (
            nodeComponent.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();

          const { x, y } = transformToCamera(e.clientX, e.clientY);
          const rectCamera = transformToCamera(elementRect.x, elementRect.y);

          const interactionInfoResult = pointerDown(
            x - rectCamera.x,
            y - rectCamera.y,
            nodeComponent,
            canvasElement,
            interactionStateMachine
          );

          if (interactionInfoResult) {
            interactionInfo = interactionInfoResult;
            const circleDomElement = circleElement?.domElement as unknown as
              | HTMLElement
              | SVGElement;
            circleDomElement.classList.remove('pointer-events-auto');
            circleDomElement.classList.add('pointer-events-none');
          }
        }
      },
      pointermove: (e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }

        const canvasRect = (
          canvasElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            const { x, y } = transformToCamera(e.clientX, e.clientY);
            if (
              pointerMove(
                x,
                y,
                nodeComponent,
                canvasElement,
                interactionInfo,
                interactionStateMachine
              )
            ) {
              // console.log(
              //   'svg pointermove',
              //   nodeComponent.id,
              //   nodeComponent.domElement,
              //   e.clientX - canvasRect.x,
              //   e.clientY - canvasRect.y
              // );
            }
          }
        }
      },
      pointerup: (e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            //clearDropTarget(nodeComponent);

            const canvasRect = (
              canvasElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();

            const { x, y } = transformToCamera(e.clientX, e.clientY);
            pointerUp(
              x,
              y,
              nodeComponent,
              canvasElement,
              interactionInfo,
              interactionStateMachine
            );
            const circleDomElement = circleElement?.domElement as unknown as
              | HTMLElement
              | SVGElement;
            circleDomElement.classList.add('pointer-events-auto');
            circleDomElement.classList.remove('pointer-events-none');
          }
        }
      },
    },
    nodeComponent.domElement
  );

  if (!circleElement) throw new Error('circleElement is undefined');

  elements.set(nodeComponent.id, nodeComponent);
  nodeComponent.elements.set(circleElement.id, circleElement);
  nodeComponent.specifier = specifier;
  nodeComponent.x = parseInt(initialX.toString()) | 0;
  nodeComponent.y = parseInt(initialY.toString()) | 0;
  nodeComponent.nodeType = nodeType;
  nodeComponent.width = 100;
  nodeComponent.height = 100;
  nodeComponent.offsetX = 50;
  nodeComponent.offsetY = 50;
  nodeComponent.radius = 10;
  nodeComponent.thumbIndex = index ?? 0;
  nodeComponent.thumbType = thumbType;

  nodeComponent.setVisibility = (visible: boolean) => {
    (nodeComponent.domElement as unknown as SVGElement).style.display = `${
      visible ? 'block' : 'none'
    }`;
  };

  nodeComponent.initPointerDown = (
    initialXOffset: number,
    initialYOffset: number
  ) => {
    interactionInfo.xOffsetWithinElementOnFirstClick = initialXOffset;
    interactionInfo.yOffsetWithinElementOnFirstClick = initialYOffset;
  };

  nodeComponent.pointerUp = () => {
    if (disableInteraction) {
      return;
    }

    const dropTarget = interactionStateMachine.getCurrentDropTarget();
    if (dropTarget) {
      console.log(
        'DROPPED ON TARGET',
        dropTarget.id,
        nodeComponent.id,
        nodeComponent.specifier,
        nodeComponent.onReceiveDroppedComponent
      );
      if (
        dropTarget.onReceiveDroppedComponent &&
        dropTarget.id !== nodeComponent.id
      ) {
        dropTarget.onReceiveDroppedComponent(dropTarget, nodeComponent);
      }
    }

    console.log(
      'svg pointerup nodecomponent',
      nodeComponent.id,
      nodeComponent,
      dropTarget
    );
    interactionStateMachine.clearDropTarget(nodeComponent);

    const circleDomElement = circleElement?.domElement as unknown as
      | HTMLElement
      | SVGElement;
    circleDomElement.classList.add('pointer-events-auto');
    circleDomElement.classList.remove('pointer-events-none');
  };

  const circleDomElement = circleElement?.domElement as unknown as
    | HTMLElement
    | SVGElement;
  nodeComponent.getThumbCircleElement = () => circleDomElement;

  return nodeComponent;
};
