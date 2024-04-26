import { IDOMElement } from '@devhelpr/visual-programming-system';

// TODO : builder pattern for classlist opererations :
// element(this.canvas).hide().noPointerEvents()
// element(this.canvas).show().pointerEvents()
// .. etc

export const hideElement = (element?: IDOMElement) => {
  if (element && element.domElement) {
    (element.domElement as HTMLElement).classList.add('hidden');
  }
};

export const showElement = (element?: IDOMElement) => {
  if (element && element.domElement) {
    (element.domElement as HTMLElement).classList.remove('hidden');
  }
};

export const hideHTMLElement = (element?: HTMLElement) => {
  if (element) {
    element.classList.add('hidden');
  }
};

export const showHTMLElement = (element?: HTMLElement) => {
  if (element && element) {
    element.classList.remove('hidden');
  }
};
