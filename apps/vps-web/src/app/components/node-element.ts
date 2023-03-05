import {
  DOMElementNode,
  ElementNodeMap,
  INodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createEffect, getCount, setCount, setSelectNode } from '../reactivity';
import { createElement } from '../utils/create-element';
import { createNodeComponent } from '../utils/create-node-component';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';

export const createNodeElement = (
  tagName: string,
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  let interactionInfo: IPointerDownResult = {
    xOffsetWithinElementOnFirstClick: 0,
    yOffsetWithinElementOnFirstClick: 0,
  };

  function setPosition(element: INodeComponent, x: number, y: number) {
    (
      element.domElement as unknown as HTMLElement | SVGElement
    ).style.transform = `translate(${x}px, ${y}px)`;
  }

  let isClicking = false;
  let isMoving = false;
  const x = Math.floor(Math.random() * 1024);
  const y = Math.floor(Math.random() * 500);
  const nodeComponent: INodeComponent | undefined = createNodeComponent(
    tagName,
    {
      class: `
        absolute
        select-none cursor-pointer
        transition-transform
        ease-in-out duration-[75ms]
        `,
      style: {
        transform: `translate(${x}px, ${y}px)`,
      },
      click: () => {
        console.log('click', nodeComponent);
        /*if (element) {
          element.domElement.style.backgroundColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
          element.domElement.textContent = `Hello world ${Math.floor(
            Math.random() * 100
          )}`;
        }*/
      },
      pointerdown: (e: PointerEvent) => {
        isClicking = true;
        isMoving = false;
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
          isMoving = true;
          if (nodeComponent && nodeComponent.domElement) {
            pointerMove(
              e.clientX - canvasRect.x,
              e.clientY - canvasRect.y,
              nodeComponent,
              canvasElement,
              interactionInfo
            );
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

            if (isClicking && !isMoving) {
              console.log('CLICK', nodeComponent);
              setCount(getCount() + 1);
              setSelectNode(nodeComponent);
            }
          }
        }
        e.preventDefault();
        e.stopPropagation();

        isMoving = false;
        isClicking = false;

        return false;
      },
      pointerleave: (e: PointerEvent) => {
        isClicking = false;
      },
    },
    canvasElement
  );
  (nodeComponent.domElement as unknown as HTMLElement | SVGElement).id =
    nodeComponent.id;
  elements.set(nodeComponent.id, nodeComponent);

  const childElement = createElement(
    'div',
    {
      class: 'translate-x-[-50%]  p-10',
      style: {
        'background-color':
          '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
    },
    nodeComponent.domElement,
    'Hello world'
  );

  createEffect(() => {
    const counter = getCount();
    // if (element) {
    //   element.domElement.textContent = `Hello world ${counter}`;
    // }
    if (childElement) {
      childElement.domElement.textContent = `Hello world ${counter}`;
    }
  });
  nodeComponent.x = x;
  nodeComponent.y = y;

  nodeComponent.update = (
    component: INodeComponent,
    x: number,
    y: number,
    _actionComponent: INodeComponent
  ) => {
    setPosition(component, x, y);
  };
  return nodeComponent;
};
