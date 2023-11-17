import {
  Component,
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';

export interface SliderFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  isRow?: boolean;
  isLast?: boolean;
  settings?: {
    showLabel?: boolean;
  };
  onChange?: (value: string) => void;
}

// export interface InputFieldChildProps {
//   value: string;
//   formId: string;
//   fieldName: string;
//   onChange?: (value: string) => void;
// }

export class SliderFieldChildComponent extends Component<SliderFieldProps> {
  oldProps: SliderFieldProps | null = null;
  input: HTMLInputElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: SliderFieldProps) {
    super(parent, props);
    this.template = createTemplate(
      `<div class="w-full ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }">
        <label for="${props.fieldName}" class="block  mb-2 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
        text-white ${props.isRow ? 'mr-2' : ''}">${
        props.label ?? props.fieldName
      }</label>
        <input class="block w-full p-1 text-white accent-white"
          name="${props.fieldName}"      
          id="${props.formId}_${props.fieldName}"
          value="${props.value}"
          min="${props.min ?? 0.1}"
          max="${props.max ?? 100}"
          step="${props.step ?? 0.1}"
          type="range"></input>
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

export const SliderField = (props: SliderFieldProps) => {
  //let inputRef: HTMLInputElement | null = null;
  // trackNamedSignal(`${props.formId}_${props.fieldName}`, (value) => {
  //   console.log('trackNamedSignal', props.formId, props.fieldName, value);
  //   if (inputRef) {
  //     inputRef.value = value;
  //   }
  // });
  // return (
  //   <input
  //     reference={(reference: HTMLInputElement) => (inputRef = reference)}
  //     id={props.fieldName}
  //     type="text"
  //     class="block w-full p-1"
  //     name={props.fieldName}
  //     autocomplete="off"
  //     value={props.value}
  //     oninput={(event: InputEvent) => {
  //       const input = event.target as HTMLInputElement;
  //       console.log(input.value);
  //       if (props.onChange) {
  //         props.onChange(input.value);
  //       }
  //     }}
  //   ></input>
  // );
};