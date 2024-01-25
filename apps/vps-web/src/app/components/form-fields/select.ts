import { trackNamedSignal } from '@devhelpr/visual-programming-system';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isRow?: boolean;
  isLast?: boolean;
  settings?: {
    showLabel?: boolean;
  };
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export class SelectFieldChildComponent extends FormFieldComponent<SelectFieldProps> {
  oldProps: SelectFieldProps | null = null;
  select: HTMLSelectElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: SelectFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }">
        <label for="${props.formId}_${props.fieldName}" class="block  mb-2 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
        text-white ${props.isRow ? 'mr-2' : ''}">${
        props.label ?? props.fieldName
      }</label><select class="block w-full p-1"
          name="${props.fieldName}"
          autocomplete="off"
          id="${props.formId}_${props.fieldName}"
          value="${props.value}"
          type="text">${props.options.map((option) => {
            return `<option value="${option.value}"
             ${option.value === props.value ? 'selected' : ''}
            >${option.label}</option>`;
          })}</select>
        </select>`
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
        this.label = this.element.firstChild as HTMLLabelElement;
        this.select = this.label.nextSibling as HTMLSelectElement;
        this.renderList.push(this.label, this.select);
        this.select.addEventListener('input', this.onInput);

        trackNamedSignal(
          `${this.props.formId}_${this.props.fieldName}`,
          (value) => {
            console.log(
              'trackNamedSignal',
              this.props.formId,
              this.props.fieldName,
              value
            );
            if (this.select) {
              this.select.value = value;
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
    console.log(input.value);
    if (this.props.onChange) {
      this.props.onChange(input.value);
    }
  };
  render() {
    super.render();
    if (!this.element) return;
    if (!this.select) return;

    this.oldProps = this.props;

    if (this.select) {
      //this.h1.textContent = atom1.getValue() || this.props.value;
    }

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.select]);
    }
  }
}
