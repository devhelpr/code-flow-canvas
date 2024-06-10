import { EventHandler, createElement } from './create-element';

export const createJSXElement = (
  tag: any,
  properties: any,
  ...children: any[]
): HTMLElement => {
  if (typeof tag === 'function') {
    return tag(properties ?? {}, children) as HTMLElement;
  }
  const element = createElement(tag, properties, undefined, undefined)
    .domElement as unknown as HTMLElement;

  if (properties) {
    Object.entries(properties).forEach(([key, val]) => {
      if (key === 'getElement' && typeof val === 'function') {
        val(element);
      } else if (key === 'class') {
        element.setAttribute('class', (val as string) || '');
        //element.classList.add(...((val as string) || '').trim().split(' '));
        return;
      } else if (typeof val === 'function') {
        (element as unknown as HTMLElement).addEventListener(
          key,
          val as EventHandler
        );
      } else {
        element.setAttribute(key, (val as any).toString());
      }
    });
  }
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
