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

export const createSVGElement = (
  canvasElement: DOMElementNode,
  elements: ElementNodeMap,
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
  const nodeComponent: INodeComponent = createSVGNodeComponent(
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
  let circleElement: IElementNode | undefined = undefined;
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
      pointerdown: (e: PointerEvent) => {
        if (nodeComponent) {
          const elementRect = (
            nodeComponent.domElement as unknown as HTMLElement | SVGElement
          ).getBoundingClientRect();
          interactionInfo = pointerDown(
            e.clientX - elementRect.x,
            e.clientY - elementRect.y,
            nodeComponent,
            canvasElement
          );
        }
      },
      pointermove: (e: PointerEvent) => {
        const canvasRect = (
          canvasElement as unknown as HTMLElement | SVGElement
        ).getBoundingClientRect();
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            if (
              pointerMove(
                e.clientX - canvasRect.x,
                e.clientY - canvasRect.y,
                nodeComponent,
                canvasElement,
                interactionInfo
              )
            ) {
              console.log(
                'svg pointermove',
                nodeComponent.id,
                nodeComponent.domElement
              );
            }
          }
        }
      },
      pointerup: (e: PointerEvent) => {
        if (nodeComponent) {
          if (nodeComponent && nodeComponent.domElement) {
            const canvasRect = (
              canvasElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();
            pointerUp(
              e.clientX - canvasRect.x,
              e.clientY - canvasRect.y,
              nodeComponent,
              canvasElement,
              interactionInfo
            );
          }
        }
      },
    },
    nodeComponent.domElement
  );
  elements.set(nodeComponent.id, nodeComponent);
  nodeComponent.elements.push(circleElement);
  nodeComponent.specifier = specifier;
  nodeComponent.x = initialX;
  nodeComponent.y = initialY;
  return nodeComponent;
};
