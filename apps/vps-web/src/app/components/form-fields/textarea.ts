import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';
import { BaseFormFieldProps, FormFieldComponent } from './field';

export interface TextAreaFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isLast?: boolean;
  onChange?: (value: string) => void;
}

export class TextAreaFieldComponent extends FormFieldComponent<TextAreaFieldProps> {
  oldProps: TextAreaFieldProps | null = null;
  textarea: HTMLTextAreaElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: TextAreaFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full mb-2">
        <label for="${props.formId}_${
        props.fieldName
      }" class="block mb-2 text-white">${props.label || props.fieldName}</label>
        <textarea class="block w-full p-1" 
          rows="10"
          name="${props.fieldName}"
          autocomplete="off"
          id="${props.formId}_${props.fieldName}"
          type="text"></textarea>
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
        this.textarea = this.label.nextSibling as HTMLTextAreaElement;
        this.renderList.push(this.label, this.textarea);
        this.textarea.addEventListener('input', this.onInput);
        this.textarea.value = this.props.value;
        trackNamedSignal(
          `${this.props.formId}_${this.props.fieldName}`,
          (value) => {
            console.log(
              'trackNamedSignal',
              this.props.formId,
              this.props.fieldName,
              value
            );
            if (this.textarea) {
              this.textarea.value = value;
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

  public setValue(value: string): void {
    console.log('setValue textarea', value, this.textarea);
    if (!this.textarea) return;
    this.textarea.value = value;
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
    if (!this.textarea) return;

    this.oldProps = this.props;

    if (this.textarea) {
      //this.h1.textContent = atom1.getValue() || this.props.value;
    }

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.textarea]);
    }
  }
}
