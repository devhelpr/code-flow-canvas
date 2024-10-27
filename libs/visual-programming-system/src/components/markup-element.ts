import { compileMarkup } from '@devhelpr/markup-compiler';
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { createNodeComponent } from '../utils/create-node-component';
import { createASTNodeElement } from '../utils/create-ast-markup-node';
import { InteractionStateMachine } from '../interaction-state-machine';
import { BaseNodeInfo } from '../types/base-node-info';

export const createMarkupElement = <T extends BaseNodeInfo>(
  markup: string,
  canvasElement: IElementNode<T>,
  elements: ElementNodeMap<T>,
  _interactionStateMachine: InteractionStateMachine<T>
) => {
  const compiledMarkup = compileMarkup(markup);
  if (!compiledMarkup) {
    throw new Error('Invalid markup');
  }
  function setPosition(element: INodeComponent<T>, x: number, y: number) {
    (
      element.domElement as unknown as HTMLElement | SVGElement
    ).style.transform = `translate(${x}px, ${y}px)`;
  }

  const nodeComponent = createNodeComponent<T>(
    compiledMarkup.body.tagName || 'div',
    {
      class:
        'absolute p-10 select-none text-center transition-transform ease-in-out duration-[75ms]',
      style: {
        'background-color':
          '#' + Math.floor(Math.random() * 16777215).toString(16),
        transform: `translate(${Math.floor(
          Math.random() * 1024
        )}px, ${Math.floor(Math.random() * 500)}px)`,
      },
      pointerdown: (_e: PointerEvent) => {
        //
      },
      /*pointermove: (e: PointerEvent) => {
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
              console.log('pointermove element', event);
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
      },*/
      pointerleave: (_e: PointerEvent) => {
        console.log('pointerleave element', _e);
      },
    },
    canvasElement.domElement as unknown as HTMLElement | SVGElement,
    ''
  );
  if (nodeComponent && nodeComponent.domElement) {
    console.log('compiledMarkup', compiledMarkup);

    nodeComponent.update = (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ): boolean => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }

      setPosition(component, x, y);
      return true;
    };

    if (compiledMarkup && nodeComponent && nodeComponent.domElement) {
      createASTNodeElement(
        compiledMarkup.body,
        nodeComponent.domElement,
        nodeComponent.elements
      );
    }
    const domElement = nodeComponent.domElement as unknown as
      | HTMLElement
      | SVGElement;
    domElement.id = nodeComponent.id;
    elements.set(nodeComponent.id, nodeComponent);
  }
  return nodeComponent;
};
