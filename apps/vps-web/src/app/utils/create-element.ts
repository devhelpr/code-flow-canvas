type EventHandler = (event: Event) => void | boolean;

export const createElement = (
  elementName: string,
  attributes?: Record<string, string | object | EventHandler>,
  parent?: HTMLElement,
  content?: string
) => {
  const element = document.createElement(elementName);
  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      if (typeof attributes[key] === 'object') {
        Object.keys(attributes[key]).forEach((styleProperty: string) => {
          console.log(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
          element.style.setProperty(
            styleProperty,
            (attributes[key] as unknown as any)[styleProperty]
          );
        });
        //element.setAttribute(key, attributes[key] as object);
      } else if (typeof attributes[key] === 'function') {
        element.addEventListener(key, attributes[key] as EventHandler);
      } else if (typeof attributes[key] === 'string') {
        element.setAttribute(key, attributes[key] as string);
      }
    });
  }
  if (parent) {
    parent.appendChild(element);
  }
  if (content) {
    element.textContent = content;
  }
  return element;
};
