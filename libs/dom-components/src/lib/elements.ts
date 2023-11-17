export const createElement = (
  tag: string,
  className: string,
  id?: string,
  text?: string
): HTMLElement => {
  const element = document.createElement(tag);
  if (id) {
    element.id = id;
  }
  element.classList.add(className);
  if (text) {
    element.textContent = text;
  }
  return element;
};

export const deleteElement = (element: HTMLElement) => {
  element.remove();
};

export const updateElementContent = (element: HTMLElement, content: string) => {
  element.textContent = content;
};

export const updateElementClass = (element: HTMLElement, className: string) => {
  element.classList.add(className);
};

export const removeElementClass = (element: HTMLElement, className: string) => {
  element.classList.remove(className);
};

export const addElementAfterElement = (
  element: HTMLElement,
  afterElement: HTMLElement
) => {
  afterElement.after(element);
};

export const addElementToParent = (
  element: HTMLElement,
  parent: HTMLElement
) => {
  parent.appendChild(element);
};

export const createTemplate = (template: string): HTMLTemplateElement => {
  const templateElement = document.createElement('template');
  templateElement.innerHTML = template.replace(/\n[ \t]+/g, '');
  return templateElement;
};

export const createElementFromTemplate = (
  template: HTMLTemplateElement
): HTMLElement => {
  // the element is a document fragment here
  const element = template.content.cloneNode(true) as HTMLElement;

  Array.prototype.forEach.call(element.children, (node) => {
    if (node.nodeName.toString() === '' && node.textContent.trim() === '')
      node.remove();
  });

  // to get the first real element grab the first child (otherwise it's the document fragment)
  return element.firstChild as HTMLElement;
};
