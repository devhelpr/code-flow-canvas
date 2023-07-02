import { transformToCamera } from '../camera';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
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
  thumbName: string,
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
  disableInteraction?: boolean,
  label?: string,
  thumbShape?: 'circle' | 'diamond'
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
  const nodeComponent: IThumbNodeComponent<T> = createElement(
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
  ) as IThumbNodeComponent<T>;

  nodeComponent.thumbName = thumbName;
  nodeComponent.x = 0;
  nodeComponent.y = 0;

  (nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
    nodeComponent.id;
  const circleElement: IElementNode<T> | undefined = createElement(
    'div',
    {
      class: `${
        disableInteraction ? 'pointer-events-none' : 'pointer-events-auto'
      }  origin-center`, // rounded-full border-[3px]
      style: {
        width: `${(radius ?? 10) * 2}px`,
        height: `${(radius ?? 10) * 2}px`,
        transform: `translate(${-(radius ?? 10) + (width ?? 100) / 2}px, ${
          -(radius ?? 10) + (height ?? 100) / 2
        }px)`,
        'clip-path':
          thumbShape === 'diamond'
            ? 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%'
            : 'circle(50%)',
        'background-color': isTransparent
          ? 'transparent'
          : borderColor
          ? borderColor
          : 'black',
        // 'background-color': isTransparent
        //   ? 'transparent'
        //   : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
      // cx: (width ?? 100) / 2,
      // cy: (height ?? 100) / 2,
      // r: radius ?? 10,
      // stroke: isTransparent
      //   ? 'transparent'
      //   : borderColor
      //   ? borderColor
      //   : 'black',
      // 'stroke-width': 3,
      // fill: isTransparent
      //   ? 'transparent'
      //   : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
      pointerover: (_e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }
        console.log('svg pointerover', nodeComponent.id, nodeComponent);
        (nodeComponent.domElement as unknown as SVGElement).classList.remove(
          'cursor-pointer'
        );
        (nodeComponent.domElement as unknown as SVGElement).classList.add(
          'cursor-pointer'
        );
        (nodeComponent.domElement as unknown as SVGElement).classList.remove(
          'cursor-not-allowed'
        );
        if (nodeComponent.isConnectPoint) {
          let canReceiveDrop = false;
          if (nodeComponent.onCanReceiveDroppedComponent) {
            //TODO : get the current interactive element and check if it can be dropped here
            const state = interactionStateMachine.getCurrentInteractionState();
            if (state && state.element) {
              canReceiveDrop = nodeComponent.onCanReceiveDroppedComponent(
                nodeComponent,
                state.element as unknown as IConnectionNodeComponent<T>,
                nodeComponent
              );

              if (!canReceiveDrop) {
                (
                  nodeComponent.domElement as unknown as SVGElement
                ).style.filter = 'none';

                (
                  nodeComponent.domElement as unknown as SVGElement
                ).classList.remove('cursor-pointer');
                (
                  nodeComponent.domElement as unknown as SVGElement
                ).classList.add('cursor-not-allowed');
                console.log(
                  'svg cant register drop target for current dragging element'
                );
                return;
              } else {
                (
                  nodeComponent.domElement as unknown as SVGElement
                ).style.filter = 'invert(1)';
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

          (nodeComponent.domElement as unknown as SVGElement).style.filter =
            'none';

          (nodeComponent.domElement as unknown as SVGElement).classList.remove(
            'cursor-not-allowed'
          );
          (nodeComponent.domElement as unknown as SVGElement).classList.remove(
            'cursor-pointer'
          );
        }
      },
      pointerdown: (e: PointerEvent) => {
        if (disableInteraction) {
          return;
        }
        if (nodeComponent) {
          if (
            nodeComponent.parent &&
            (nodeComponent.parent as unknown as IConnectionNodeComponent<T>)
              .startNode
          ) {
            //return;
          }
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
          console.log(
            'thumb pointerdown before check',
            nodeComponent.id,
            nodeComponent
          );
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
              true
            );

            if (curve && canvas) {
              console.log(
                'new curve created',
                curve.nodeComponent.id,
                curve.endPointElement.id
              );
              curve.nodeComponent.isControlled = true;

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
              // (
              //   nodeComponent.parent?.domElement as unknown as HTMLElement
              // ).append(nodeComponent.domElement);

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

            (nodeComponent.domElement as unknown as SVGElement).style.filter =
              'none';

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
  const innerCircle = createElement(
    'div',
    {
      class: `absolute top-[3px] left-[3px]`,
      style: {
        width: `${(radius ?? 10) * 2 - 6}px`,
        height: `${(radius ?? 10) * 2 - 6}px`,
        'clip-path':
          thumbShape === 'diamond'
            ? 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%'
            : 'circle(50%)',
        'background-color': isTransparent
          ? 'transparent'
          : color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
    },
    circleElement.domElement
  );
  if (label) {
    // const isLeftSideThumb =
    //   thumbType === ThumbType.End ||
    //   thumbType === ThumbType.EndConnectorBottom ||
    //   thumbType === ThumbType.EndConnectorCenter ||
    //   thumbType === ThumbType.EndConnectorLeft ||
    //   thumbType === ThumbType.EndConnectorRight ||
    //   thumbType === ThumbType.EndConnectorTop;

    // ${isLeftSideThumb ? 'right-[24px]' : 'left-[24px]'}

    createElement(
      'div', //'circle',
      {
        class: `pointer-events-none absolute text-[11px] flex items-center justify-center
        w-[14px] h-[14px] text-base-[14px]
        text-center
        top-[-1px] text-black `,
      },
      innerCircle.domElement,
      label
    );
  }
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

    if (visible && !disableInteraction) {
      (circleElement.domElement as unknown as SVGElement).classList.remove(
        'pointer-events-none'
      );
      (circleElement.domElement as unknown as SVGElement).classList.add(
        'pointer-events-auto'
      );
    } else {
      (circleElement.domElement as unknown as SVGElement).classList.remove(
        'pointer-events-auto'
      );
      (circleElement.domElement as unknown as SVGElement).classList.add(
        'pointer-events-none'
      );
    }
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

    // TODO : check if droptarget is the correct type BEFOFE casting
    const dropTarget =
      interactionStateMachine.getCurrentDropTarget() as unknown as IThumbNodeComponent<T>;
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
