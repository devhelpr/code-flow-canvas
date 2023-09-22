// export interface TextAreaFieldProps {
//   fieldName: string;
//   value: string;
//   onChange?: (value: string) => void;
// }

// export const TextAreaField = (props: TextAreaFieldProps) => (
//   <textarea
//     id={props.fieldName}
//     type="text"
//     class="block w-full h-[200px] p-1"
//     name={props.fieldName}
//     oninput={(event: InputEvent) => {
//       const input = event.target as HTMLInputElement;
//       if (props.onChange) {
//         props.onChange(input.value);
//       }
//     }}
//   >
//     {props.value}
//   </textarea>
// );

import {
  Component,
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';

export interface TextAreaFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  onChange?: (value: string) => void;
}

export class TextAreaFieldComponent extends Component<TextAreaFieldProps> {
  oldProps: TextAreaFieldProps | null = null;
  textarea: HTMLTextAreaElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: TextAreaFieldProps) {
    super(parent, props);
    this.template = createTemplate(
      `<div class="w-full mb-2">
        <label for="${props.fieldName}" class="block mb-2">${props.fieldName}</label>
        <textarea class="block w-full p-1" 
          rows="10"
          name="${props.fieldName}"
          autocomplete="off"
          id="${props.formId}_${props.fieldName}"
          type="text">${props.value}</textarea>
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

export const InputField = (props: TextAreaFieldProps) => {
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
