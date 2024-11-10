import { createElement } from '@devhelpr/visual-programming-system';
import { createElementFromHtml } from './createElementFromHtml';
import { navbarButtonWithoutMargin } from '../consts/classes';
import { closeDialog, removeDialog } from './dialog-element';

export const createInputDialog = (
  rootElement: HTMLElement,
  nameLabel: string,
  defaultValue?: string,
  onValidate?: (value: string) => { valid: boolean; message?: string },
  settings?: {
    isPassword?: boolean;
  }
) => {
  return new Promise<string | false>((resolve, reject) => {
    //let wasTouched = false;
    let submitWasClicked = false;
    const nameId = crypto.randomUUID();
    const formElement = createElementFromHtml(
      `<div class="input-dialog-form flex flex-col p-8">
			<form cmethod="dialog" class="form row-1">
				<div class="flex flex-col w-full my-2">
					<label for="${nameId}__input">${nameLabel} *</label>
					<input id="${nameId}__input" class="form-input w-full" name="${nameId}" type="${
        settings?.isPassword ? 'password' : 'text'
      }" required value="${defaultValue ?? ''}"></input>
          <div class="form-error"></div>
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
    if (!dialogElement) {
      reject('dialog element not created');
      return;
    }
    const inputElement = (
      dialogElement.domElement as HTMLElement
    ).querySelector(`[id="${nameId}__input"]`) as HTMLSelectElement;
    const form = (dialogElement.domElement as HTMLElement).querySelector(
      'form'
    );
    const errorElement = form?.querySelector('.form-error');
    if (!inputElement || !form || !errorElement) {
      reject('input element not found');
    }
    (dialogElement.domElement as HTMLDialogElement).showModal();

    const okButton = form?.querySelector('.form-ok');
    okButton?.addEventListener('click', (event) => {
      event.preventDefault();
      submitWasClicked = true;
      validateForm();
      if (!inputElement.validity.valid) {
        return false;
      }
      closeDialog(dialogElement);
      removeDialog(dialogElement);
      resolve(inputElement.value);
      return true;
    });
    const cancelButton = form?.querySelector('.form-cancel');
    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();

      closeDialog(dialogElement);
      removeDialog(dialogElement);
      resolve(false);
    });
    const validateForm = () => {
      if (onValidate && errorElement) {
        const result = onValidate(inputElement.value);
        if (result && !result.valid) {
          const errorMessage =
            result.message || `Field "${nameLabel}" is invalid`;
          inputElement.setCustomValidity(errorMessage);
          errorElement.textContent = errorMessage;
        } else if (!inputElement.value) {
          const errorMessage = `Field "${nameLabel}" is required`;
          inputElement.setCustomValidity(errorMessage);
          errorElement.textContent = errorMessage;
        } else {
          inputElement.setCustomValidity('');
          errorElement.textContent = '';
        }
      }
    };

    inputElement.addEventListener('input', () => {
      //wasTouched = true;
      if (!submitWasClicked) {
        return;
      }
      validateForm();
    });
  });
};
