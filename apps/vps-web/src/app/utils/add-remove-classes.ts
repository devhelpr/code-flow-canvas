import { IDOMElement } from '@devhelpr/visual-programming-system';

export const addClasses = (element?: IDOMElement, classes?: string[]) => {
  if (element && element.domElement) {
    classes?.forEach((className) => {
      (element.domElement as HTMLElement).classList.add(className);
    });
  }
};

export const removeClasses = (element?: IDOMElement, classes?: string[]) => {
  if (element && element.domElement) {
    classes?.forEach((className) => {
      (element.domElement as HTMLElement).classList.remove(className);
    });
  }
};

export const addClassesHTMLElement = (
  element?: HTMLElement | null,
  classes?: string[]
) => {
  if (element) {
    classes?.forEach((className) => {
      element.classList.add(className);
    });
  }
};

export const removeClassesHTMLElement = (
  element?: HTMLElement | null,
  classes?: string[]
) => {
  if (element) {
    classes?.forEach((className) => {
      element.classList.remove(className);
    });
  }
};
