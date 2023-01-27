import './app.element.css';
import styles from '../styles.css?inline';
import { createElement } from './utils/create-element';
import { createNodeElement } from './components/node-element';
import { createSVGElement } from './components/svg-element';
import { ElementNodeMap } from './interfaces/element';
import { createMarkupElement } from './components/markup-element';
import { createEffect, createSignal, getCount, setCount } from './reactivity';
import {
  getCurrentInteractionState,
  InteractionEvent,
  interactionEventState,
  InteractionState,
} from './interaction-state-machine';
import { count } from 'console';

const template = document.createElement('template');
template.innerHTML = `
  <style>${styles}</style>
  <div class="h-screen w-100 bg-slate-100 flex flex-col" id="root" >
  </div>
`;

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  disconnectedCallback() {
    const button = document.querySelector('button');
    if (button) {
      button.removeEventListener('click', this.onclick);
    }
  }

  elements: ElementNodeMap = new Map();

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
    const rootElement = shadowRoot.querySelector('div#root') as HTMLElement;
    if (!rootElement) {
      return;
    }
    const newElement = createElement(
      'div',
      {
        class: 'relative z-20',
      },
      rootElement
    );
    createElement(
      'button',
      {
        class:
          'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600 select-none',
        click: () => {
          createNodeElement('div', canvas.domElement, this.elements);
        },
      },
      newElement.domElement,
      'Add element'
    );

    createElement(
      'button',
      {
        class:
          'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600 select-none',
        click: () => {
          createSVGElement(canvas.domElement, this.elements);
        },
      },
      newElement.domElement,
      'Add svg element'
    );

    createElement(
      'button',
      {
        class:
          'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600 select-none',
        click: () => {
          createMarkupElement(
            '<div><h2>TITLE</h2><p>subtitle</p></div>',
            canvas.domElement,
            this.elements
          );
        },
      },
      newElement.domElement,
      'Add markup element'
    );

    const canvas = createElement(
      'div',
      {
        id: 'canvas',
        class: 'w-100 bg-slate-800 flex-auto relative z-10 overflow-hidden',
        pointermove: (event: PointerEvent) => {
          //const canvasRect = canvas.domElement.getBoundingClientRect();
          const currentState = getCurrentInteractionState();
          if (
            currentState.state === InteractionState.Moving &&
            currentState.element &&
            currentState.target
          ) {
            if (
              interactionEventState(
                InteractionEvent.PointerMove,
                currentState.target,
                currentState.element
              )
            ) {
              const canvasRect = canvas.domElement.getBoundingClientRect();
              currentState.target.pointerMove(
                event.clientX - canvasRect.x,
                event.clientY - canvasRect.y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
            }
          }
        },
        pointerup: (event: PointerEvent) => {
          const currentState = getCurrentInteractionState();
          if (
            currentState.state === InteractionState.Moving &&
            currentState.element &&
            currentState.target
          ) {
            if (
              interactionEventState(
                InteractionEvent.PointerUp,
                currentState.target,
                currentState.element
              )
            ) {
              const canvasRect = canvas.domElement.getBoundingClientRect();
              currentState.target.pointerUp(
                event.clientX - canvasRect.x,
                event.clientY - canvasRect.y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
            }
          }
        },
        pointerleave: (event: PointerEvent) => {
          console.log('pointerleave canvas', event);
          const currentState = getCurrentInteractionState();
          if (
            currentState.state === InteractionState.Moving &&
            currentState.element &&
            currentState.target
          ) {
            if (
              interactionEventState(
                InteractionEvent.PointerLeave,
                currentState.target,
                currentState.element
              )
            ) {
              const canvasRect = canvas.domElement.getBoundingClientRect();
              currentState.target.pointerUp(
                event.clientX - canvasRect.x,
                event.clientY - canvasRect.y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
            }
          }
        },
      },
      rootElement
    );

    createMarkupElement(
      '<div><h2>TITLE</h2><p>subtitle</p></div>',
      canvas.domElement,
      this.elements
    );
  }
}
customElements.define('vps-web-root', AppElement);

/*const [getCount, setCount] = createSignal(0);
const [getValue, setValue] = createSignal('test');
createEffect(() => console.log('effect', getCount(), getValue()));
setCount(1);
setCount(2);
setValue('test2');
setCount(3);
*/
setInterval(() => {
  setCount(getCount() + 1);
}, 1000);
