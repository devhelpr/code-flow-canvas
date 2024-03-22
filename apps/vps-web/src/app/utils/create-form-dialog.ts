import { createElement } from '@devhelpr/visual-programming-system';
import { createElementFromHtml } from './createElementFromHtml';
import { closeDialog, removeDialog } from './dialog-element';
import { FormField } from '../components/FormField';
import { FormComponent, FormValues } from '../components/form-component';

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
      { class: 'input-dialog modal-dialog-form bg-slate-600' },
      rootElement || document.body,
      formWrapperElement
    );
    if (dialogElement?.domElement instanceof HTMLDialogElement) {
      dialogElement.domElement.showModal();
    }
  });
};
