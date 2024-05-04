import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { IFormsComponent } from '../IFormsComponent';

export interface CheckboxFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: boolean;
  label?: string;
  isRow?: boolean;
  isLast?: boolean;

  onChange?: (value: boolean, formComponent: IFormsComponent) => void;
}

export class CheckboxFieldChildComponent extends FormFieldComponent<CheckboxFieldProps> {
  oldProps: CheckboxFieldProps | null = null;
  input: HTMLInputElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: CheckboxFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    console.log('CheckboxFieldChildComponent', props.value);
    this.template = createTemplate(
      `<div class="w-full form-component__input flex items-center accent-white ${
        props.isLast ? '' : 'mb-2'
      } ${props.isRow ? 'flex' : ''}">
      <input class="block w-full mr-2"
        name="${props.fieldName}"
        id="${props.formId}_${props.fieldName}"
        value="${props.value ?? ''}"
        ${props.value === true ? 'checked="checked"' : ''}
        type="checkbox"></input>
        <label for="${props.formId}_${props.fieldName}" class="block  ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
      ${props.settings?.textLabelColor ?? 'text-white'} ${
        props.isRow ? 'mr-2' : ''
      }">${props.label ?? props.fieldName}</label>
       
        </div>`
    );

    this.mount();
  }

  mount() {
    super.mount();

    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.renderList = [];
      this.element = createElementFromTemplate(this.template);
      if (this.element) {
        this.element.remove();
        this.input = this.element.firstChild as HTMLInputElement;
        this.label = this.input.nextSibling as HTMLLabelElement;
        //this.input.value = this.props.value;

        this.renderList.push(this.label, this.input);
        this.input.addEventListener('input', this.onInput);

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
  unmount() {
    super.unmount();
    if (this.element && this.element.remove) {
      // remove only removes the connection between parent and node
      this.element.remove();
    }
    this.isMounted = false;
  }

  onInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    console.log('checkbox', input.checked);
    if (this.props.onChange) {
      this.props.onChange(input.checked, this.props.formsComponent);
    }
  };

  setValue(value: string) {
    super.setValue(value);
    if (this.input) {
      this.input.value = value;
    }
  }

  render() {
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
