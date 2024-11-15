import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { IFormsComponent } from '../IFormsComponent';
import { trackNamedSignal } from '../../reactivity';

export interface InputFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isRow?: boolean;
  isLast?: boolean;

  onChange?: (value: string, formComponent: IFormsComponent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
}

export class InputFieldChildComponent extends FormFieldComponent<InputFieldProps> {
  oldProps: InputFieldProps | null = null;
  input: HTMLInputElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: InputFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full form-component__input ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }">
        <label for="${props.formId}_${props.fieldName}" class="block  mb-2 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
      ${props.settings?.textLabelColor ?? 'text-white'} ${
        props.isRow ? 'mr-2' : ''
      }">${props.label ?? props.fieldName}</label>
        <input class="block w-full p-1"
          name="${props.fieldName}"
          autocomplete="off"
          id="${props.formId}_${props.fieldName}"
          value="${props.value ?? ''}"
          type="text"></input>
        </div>`
    );

    this.mount();
  }

  override mount() {
    super.mount();

    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.renderList = [];
      this.element = createElementFromTemplate(this.template);
      if (this.element) {
        this.element.remove();
        this.label = this.element.firstChild as HTMLLabelElement;
        this.input = this.label.nextSibling as HTMLInputElement;
        this.input.value = this.props.value;

        this.renderList.push(this.label, this.input);
        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('keydown', this.onKeyDown);
        this.input.addEventListener('keyup', this.onKeyUp);

        trackNamedSignal(
          `${this.props.formId}_${this.props.fieldName}`,
          (value) => {
            console.log(
              'trackNamedSignal',
              this.props.formId,
              this.props.fieldName,
              value
            );
            if (this.input) {
              this.input.value = value;
            }
          }
        );
      }
    }
    this.isMounted = true;
  }
  override unmount() {
    super.unmount();
    if (this.element && this.element.remove) {
      // remove only removes the connection between parent and node
      this.element.remove();
    }
    this.isMounted = false;
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (this.props.onKeyDown) {
      return this.props.onKeyDown(event);
    }
  };

  onKeyUp = (event: KeyboardEvent) => {
    if (this.props.onKeyUp) {
      return this.props.onKeyUp(event);
    }
  };
  onInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    console.log(input.value);
    if (this.props.onChange) {
      this.props.onChange(input.value, this.props.formsComponent);
    }
  };

  override setValue(value: string) {
    super.setValue(value);
    if (this.input) {
      this.input.value = value;
    }
  }

  override render() {
    super.render();
    if (!this.element) return;
    if (!this.input) return;

    this.oldProps = this.props;

    if (this.input) {
      //this.h1.textContent = atom1.getValue() || this.props.value;
    }

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.input]);
    }
  }
}
