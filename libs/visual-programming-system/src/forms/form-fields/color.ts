import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { trackNamedSignal } from '../../reactivity';

export interface ColorFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isRow?: boolean;
  isLast?: boolean;
  onChange?: (value: string) => void;
}

export class ColorFieldChildComponent extends FormFieldComponent<ColorFieldProps> {
  oldProps: ColorFieldProps | null = null;
  input: HTMLInputElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: ColorFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }">
        <label for="${props.formId}_${props.fieldName}" class="block  mb-2 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
      ${props.settings?.textLabelColor ?? 'text-white'} ${
        props.isRow ? 'mr-2' : ''
      }">${props.label ?? props.fieldName}</label>
        <input class="block w-full p-1 text-white accent-white"
          name="${props.fieldName}"      
          id="${props.formId}_${props.fieldName}"
          value="${props.value}"
          type="color"></input>
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
        this.renderList.push(this.label, this.input);
        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('pointerdown', (event: PointerEvent) => {
          event.stopPropagation();
        });
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

  onInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    console.log(input.value);
    if (this.props.onChange) {
      this.props.onChange(input.value);
    }
  };
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
