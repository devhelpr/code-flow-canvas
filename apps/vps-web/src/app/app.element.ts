import './app.element.css';
import styles from '../styles.css?inline';
import { createElement } from './utils/create-element';
import { createNodeElement } from './components/node-element';
import { createSVGElement } from './components/svg-element';
import { ElementNodeMap } from './interfaces/element';

const template = document.createElement('template');
template.innerHTML = `
  <style>${styles}</style>
  <svg width="100" height="100">
  <circle cx="50" cy="50" r="40"
  stroke="green" stroke-width="4" fill="yellow" />
Sorry, your browser does not support inline SVG.
</svg>
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
    const newElement = createElement('div', undefined, rootElement);
    createElement(
      'button',
      {
        class: 'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600',
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
        class: 'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600',
        click: () => {
          createSVGElement(canvas.domElement, this.elements);
        },
      },
      newElement.domElement,
      'Add svg element'
    );
    const canvas = createElement(
      'div',
      { id: 'canvas', class: 'w-100 bg-slate-800 flex-auto relative' },
      rootElement
    );
  }
}
customElements.define('vps-web-root', AppElement);
