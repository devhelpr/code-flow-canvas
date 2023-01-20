import { createElement } from '../utils/create-element';

export const createNodeElement = (
  canvasElement: HTMLElement,
  elements: Map<string, HTMLElement>
) => {
  const id = crypto.randomUUID();
  let element: HTMLElement | undefined = undefined;
  element = createElement(
    'button',
    {
      id,
      class: 'absolute translate-x-10 translate-y-50 bg-slate-300 p-10',
      style: {
        'background-color':
          '#' + Math.floor(Math.random() * 16777215).toString(16),
        transform: `translate(${Math.floor(
          Math.random() * 1024
        )}px, ${Math.floor(Math.random() * 500)}px)`,
      },
      click: () => {
        console.log(element);
        if (element) {
          element.style.backgroundColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
        }
      },
    },
    canvasElement,
    'Hello world'
  );
  if (element) {
    elements.set(id, element);
  }
};
