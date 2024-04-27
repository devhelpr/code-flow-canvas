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
  const items = [1, 2, 3, 4, 5];
  const list = items.map((item) => <li>{item}</li>);
  return (
    <div class="test hidden">
      Hello Test Component
      <SubComponent />
      <ul>{list}</ul>
      <my-element></my-element>
    </div>
  );
};
