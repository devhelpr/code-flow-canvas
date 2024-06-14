import { IDOMElement } from '@devhelpr/visual-programming-system';

export const closeDialog = (element?: IDOMElement) => {
  if (element && element.domElement) {
    (element?.domElement as HTMLDialogElement).close();
  }
};

export const removeDialog = (element?: IDOMElement) => {
  if (element && element.domElement) {
    (element?.domElement as HTMLDialogElement).remove();
  }
};
