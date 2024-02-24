import { createElement } from '@devhelpr/visual-programming-system';
import { createElementFromHtml } from './createElementFromHtml';
import { navbarButtonWithoutMargin } from '../consts/classes';
import { closeDialog, removeDialog } from './dialog-element';

export const createInputDialog = (
  rootElement: HTMLElement,
  nameLabel: string,
  defaultValue?: string
) => {
  return new Promise<string | false>((resolve, reject) => {
    const nameId = crypto.randomUUID();
    const formElement = createElementFromHtml(
      `<div class="input-dialog-form flex flex-col">
			<form cmethod="dialog" class="form row-1">
				<div class="flex flex-col w-full my-2">
					<label for="${nameId}__input">${nameLabel}</label>
					<input id="${nameId}__input" class="form-input w-full" name="${nameId}" value="${
        defaultValue ?? ''
      }"></input>
			  	</div>	
				<div class="flex w-full flex-row justify-end gap-2">
			  		<button type="submit" class="${navbarButtonWithoutMargin} m-0 form-ok">OK</button>
			  		<button type="button" class="${navbarButtonWithoutMargin} m-0 form-cancel mr-0">Cancel</button>
				</div>
		  	</form>
	  	</div>`
    );
    const dialogElement = createElement(
      'dialog',
      { class: 'input-dialog' },
      rootElement,
      formElement
    );
    const inputElement = (
      dialogElement.domElement as HTMLElement
    ).querySelector(`[id="${nameId}__input"]`) as HTMLSelectElement;
    const form = (dialogElement.domElement as HTMLElement).querySelector(
      'form'
    );
    if (!inputElement || !form) {
      reject('input element not found');
    }
    (dialogElement.domElement as HTMLDialogElement).showModal();

    const okButton = form?.querySelector('.form-ok');
    okButton?.addEventListener('click', (event) => {
      event.preventDefault();

      closeDialog(dialogElement);
      removeDialog(dialogElement);
      resolve(inputElement.value);
    });
    const cancelButton = form?.querySelector('.form-cancel');
    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      closeDialog(dialogElement);
      removeDialog(dialogElement);
      resolve(false);
    });
  });
};
