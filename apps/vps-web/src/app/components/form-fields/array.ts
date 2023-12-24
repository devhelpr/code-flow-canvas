import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
  Component,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { FormField } from '../FormField';
import { primaryButton } from '../../consts/classes';

export interface ArrayFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  label?: string;
  isLast?: boolean;
  values: Record<string, string>[];
  formElements: FormField[];
  onChange?: (value: string) => void;
}

export class ArrayFieldChildComponent extends FormFieldComponent<ArrayFieldProps> {
  oldProps: ArrayFieldProps | null = null;
  addButton: HTMLInputElement | null = null;
  array: HTMLDivElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;

  values: Record<string, string>[] = [];
  components: Component<FormFieldComponent<FormField>>[] = [];

  constructor(parent: BaseComponent | null, props: ArrayFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full ${props.isLast ? '' : 'mb-2'}">
        <label for="${props.fieldName}" class="block  mb-2 text-white">${
        props.label ?? props.fieldName
      }</label>
        <div class="flex flex-col"></div>
        <button class="${primaryButton}"
          type="button"
          id="${props.formId}_${props.fieldName}"          
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
        this.addButton = this.array.nextSibling as HTMLInputElement;
        this.renderList.push(this.label, this.array, this.addButton);
        this.addButton.addEventListener('click', this.onAddButtonClick);

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

  onAddButtonClick = (event: Event) => {
    //
  };
  render() {
    super.render();
    if (!this.element) return;
    if (!this.addButton) return;

    this.oldProps = this.props;

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.label, this.array, this.addButton]);
    }
  }
}
