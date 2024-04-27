import { createElement } from '@devhelpr/visual-programming-system';
import { createJSXElement } from '../utils/create-jsx-element';

class MyElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', 'wrapper');
    wrapper.innerText = 'Hello, Shadow DOM';
    createElement('div', { class: 'test' }, wrapper, SubComponent());

    shadow.appendChild(wrapper);
  }
}

customElements.define('my-element', MyElement);

const ChildComponent = () => {
  return <div>ChildComponent</div>;
};

const SubComponent = () => {
  return (
    <div>
      SubComponent
      <ChildComponent />
    </div>
  );
};

export const TestComponent = () => {
  console.log('TestComponent constructor');

  return (
    <div class="test hidden">
      Hello Test Component
      <SubComponent />
      <my-element></my-element>
    </div>
  );
};
