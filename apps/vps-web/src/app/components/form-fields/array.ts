import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { FormField } from '../FormField';

export interface ArrayFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isLast?: boolean;
  settings?: {
    showLabel?: boolean;
  };
  values: Record<string, string>[];
  formElements: FormField[];
  onChange?: (value: string) => void;
}

export class ArrayFieldChildComponent extends FormFieldComponent<ArrayFieldProps> {
  oldProps: ArrayFieldProps | null = null;
  button: HTMLInputElement | null = null;
  array: HTMLDivElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: ArrayFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full ${props.isLast ? '' : 'mb-2'}">
        <label for="${props.fieldName}" class="block  mb-2 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
        text-white">${props.label ?? props.fieldName}</label>
        <div class="flex flex-col"></div>
        <button class="block p-1"
          type="button"
          id="${props.formId}_${props.fieldName}"
          value="${props.value ?? ''}"
          type="text">Add</button>
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
        this.label = this.element.firstChild as HTMLLabelElement;
        this.array = this.label.nextSibling as HTMLDivElement;
        this.button = this.array.nextSibling as HTMLInputElement;
        this.renderList.push(this.label, this.array, this.button);
        this.button.addEventListener('input', this.onInput);

        trackNamedSignal(
          `${this.props.formId}_${this.props.fieldName}`,
          (value) => {
            console.log(
              'trackNamedSignal',
              this.props.formId,
              this.props.fieldName,
              value
            );
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
    if (!this.button) return;

    this.oldProps = this.props;

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.label, this.array, this.button]);
    }
  }
}
