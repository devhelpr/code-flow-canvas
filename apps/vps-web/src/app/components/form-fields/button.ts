import {
  Component,
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { BaseFormFieldProps, FormContext, FormFieldComponent } from './field';

export interface ButtonFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  caption?: string;
  isRow?: boolean;
  isLast?: boolean;
  settings?: {
    showLabel?: boolean;
  };
  onButtonClick?: (formContext: FormContext) => Promise<void> | void;
}

export class ButtonFieldChildComponent extends FormFieldComponent<ButtonFieldProps> {
  oldProps: ButtonFieldProps | null = null;
  button: HTMLButtonElement | null = null;
  simpleLoader: HTMLSpanElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: ButtonFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }"><button class="block w-full flex gap-[4px] items-center justify-center p-1 
          bg-orange-500 hover:bg-orange-700 
          disabled:bg-orange-400 disabled:hover:bg-orange-400 disabled:cursor-default 
          text-white font-bold py-2 px-4 mt-4 rounded"
          name="${props.fieldName}"
          id="${props.formId}_${props.fieldName}"         
          type="button">${
            props.caption
          }<span class="hidden simple-loader"></span></button>
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
        this.button = this.element.firstChild as HTMLButtonElement;
        this.simpleLoader = this.button.querySelector(
          '.simple-loader'
        ) as HTMLSpanElement;
        this.renderList.push(this.button);
        this.button.addEventListener('click', this.onButtonClick);
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

  onButtonClick = async (_event: Event) => {
    if (this.props.onButtonClick) {
      if (!this.button) return;
      this.button.disabled = true;
      this.simpleLoader?.classList.remove('hidden');
      try {
        await this.props.onButtonClick({
          setFormFieldValue: this.props.setValue,
        });
      } catch (error) {
        console.error(error);
      }
      this.simpleLoader?.classList.add('hidden');
      this.button.disabled = false;
    }
  };
  render() {
    super.render();
    if (!this.element) return;
    if (!this.button) return;

    this.oldProps = this.props;

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.button]);
    }
  }
}
