import { createElement } from '@devhelpr/visual-programming-system';

export const createJSXElement = (
  tag: any,
  properties: any,
  ...children: any[]
) => {
  if (typeof tag === 'function') {
    return tag(properties ?? {}, children);
  }
  const element = createElement(tag, properties, undefined, undefined)
    .domElement as unknown as HTMLElement;
  for (const child of children) {
    if (typeof child === 'string') {
      element.innerText += child;
      continue;
    }
    if (Array.isArray(child)) {
      element.append(...child);
      continue;
    }
    element.append(child);
  }

  return element;
};
