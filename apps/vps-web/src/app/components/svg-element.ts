import { transformToCamera } from '../camera';
import {
  clearDropTarget,
  getCurrentDropTarget,
  getCurrentInteractionState,
  setCurrentDropTarget,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createNSElement } from '../utils/create-element';
import { createSVGNodeComponent } from '../utils/create-node-component';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

export const createSVGElement = <T>(
  canvasElement: DOMElementNode,
  elements: ElementNodeMap<T>,
  color?: string,
  xInitial?: number,
  yInitial?: number,
  specifier?: string
) => {
  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };

  const initialX =
    xInitial !== undefined ? xInitial : Math.floor(Math.random() * 1024);
  const initialY =
    yInitial !== undefined ? yInitial : Math.floor(Math.random() * 500);
  console.log('createSVGElement', initialX, initialY, specifier);
  const nodeComponent: INodeComponent<T> = createSVGNodeComponent(
    'svg',
    {
      class: `absolute cursor-pointer transition-none ease-in-out duration-[75ms] will-change-transform pointer-events-none`,
      style: {
        transform: `translate(${initialX}px, ${initialY}px)`,
      },
      width: 100,
      height: 100,
    },
    canvasElement
  );
  (nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
    nodeComponent.id;
  let circleElement: IElementNode<T> | undefined = undefined;
  circleElement = createNSElement(
    'circle',
    {
      class: 'pointer-events-auto',
      cx: 50,
      cy: 50,
      r: 10,
      stroke: 'black',
      'stroke-width': 3,
      fill: color ?? '#' + Math.floor(Math.random() * 16777215).toString(16),
      pointerover: (_e: PointerEvent) => {
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
            const state = getCurrentInteractionState();
            if (state && state.element) {
              const canReceiveDrop = nodeComponent.onCanReceiveDroppedComponent(
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
          setCurrentDropTarget(nodeComponent);
        }
      },
      pointerleave: (_e: PointerEvent) => {
        if (nodeComponent.isConnectPoint) {
          console.log('svg unregister drop target', nodeComponent.id);
          clearDropTarget(nodeComponent);
        }
      },
      pointerdown: (e: PointerEvent) => {
        if (nodeComponent) {
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
            canvasElement
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
        const canvasRect = (
          canvasElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            const { x, y } = transformToCamera(e.clientX, e.clientY);
            if (
              pointerMove(x, y, nodeComponent, canvasElement, interactionInfo)
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
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            //clearDropTarget(nodeComponent);

            const canvasRect = (
              canvasElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();

            const { x, y } = transformToCamera(e.clientX, e.clientY);
            pointerUp(x, y, nodeComponent, canvasElement, interactionInfo);
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
  nodeComponent.elements.push(circleElement);
  nodeComponent.specifier = specifier;
  nodeComponent.x = initialX;
  nodeComponent.y = initialY;
  nodeComponent.pointerUp = () => {
    const dropTarget = getCurrentDropTarget();
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
        dropTarget.onReceiveDroppedComponent(nodeComponent);
      }
    }
    console.log('svg pointerup nodecomponent', nodeComponent.id, dropTarget);
    clearDropTarget(nodeComponent);

    const circleDomElement = circleElement?.domElement as unknown as
      | HTMLElement
      | SVGElement;
    circleDomElement.classList.add('pointer-events-auto');
    circleDomElement.classList.remove('pointer-events-none');
  };
  return nodeComponent;
};
