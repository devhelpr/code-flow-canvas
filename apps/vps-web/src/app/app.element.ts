import './app.element.css';
import styles from '../styles.css?inline';
import { createElement } from './utils/create-element';
import { createNodeElement } from './components/node-element';

interface IElementNode {
  id: string;
  element: HTMLElement;
}

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

  elements: Map<string, HTMLElement> = new Map();

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
    const rootElement = shadowRoot.querySelector('div#root') as HTMLElement;
    if (!rootElement) {
      return;
    }
    const newElement = createElement('div', undefined, rootElement);
    createElement(
      'button',
      {
        class: 'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600',
        click: () => {
          createNodeElement(canvas, this.elements);
        },
      },
      newElement,
      'Add element'
    );
    const canvas = createElement(
      'div',
      { id: 'canvas', class: 'w-100 bg-slate-800 flex-auto relative' },
      rootElement
    );
  }
}
customElements.define('vps-web-root', AppElement);
