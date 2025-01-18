import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { FormField } from '../forms/FormField';
import { FormComponent, FormValues } from '../forms/form-component';
import { IDOMElement } from '../interfaces';
import { createElement } from './create-element';

const createElementFromHtml = (html: string) => {
  const template = createTemplate(`${html}`);
  return createElementFromTemplate(template);
};

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

export const createFormDialog = (
  formElements: FormField[],
  rootElement?: HTMLElement,
  values?: unknown
) => {
  return new Promise<any>((resolve, _reject) => {
    const formWrapperElement = createElementFromHtml(
      `<div class="input-dialog-form flex flex-col w-full">
			
	  	</div>`
    );
    //formWrapperElement.remove();
    FormComponent({
      formElements,
      hasSubmitButton: true,
      hasCancelButton: true,
      id: crypto.randomUUID(),
      rootElement: formWrapperElement,

      onSave: (values: any) => {
        closeDialog(dialogElement);
        removeDialog(dialogElement);
        resolve(values);
      },
      onCancel: () => {
        closeDialog(dialogElement);
        removeDialog(dialogElement);
        resolve(false);
      },
      getDataFromNode: () => {
        return values as unknown as FormValues;
      },
    });
    const dialogElement = createElement(
      'dialog',
      { class: 'input-dialog modal-dialog-form bg-slate-600 p-4' },
      rootElement || document.body,
      formWrapperElement
    );
    if (dialogElement?.domElement instanceof HTMLDialogElement) {
      dialogElement.domElement.showModal();
    }
  });
};
