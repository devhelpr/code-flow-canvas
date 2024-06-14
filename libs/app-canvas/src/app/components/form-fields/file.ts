import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { trackNamedSignal } from '@devhelpr/visual-programming-system';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { IFormsComponent } from '../IFormsComponent';
import { FileFieldValue } from '../FormField';
import { primaryButton } from '../../consts/classes';

export interface FileFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isRow?: boolean;
  isLast?: boolean;

  onChange?: (value: FileFieldValue, formComponent: IFormsComponent) => void;
}

export class FileFieldChildComponent extends FormFieldComponent<FileFieldProps> {
  oldProps: FileFieldProps | null = null;
  input:
    | (HTMLInputElement & {
        files: FileList;
      })
    | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  constructor(parent: BaseComponent | null, props: FileFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;
    this.template = createTemplate(
      `<div class="w-full form-component__input ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }">
        <label for="${props.formId}_${
        props.fieldName
      }" class="${primaryButton}  mb-2 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
      ${props.settings?.textLabelColor ?? 'text-white'} ${
        props.isRow ? 'mr-2' : ''
      }">${props.label ?? props.fieldName}</label>
        <input class="block w-full p-1 hidden"
          name="${props.fieldName}"
          id="${props.formId}_${props.fieldName}"          
          type="file"></input>
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
        this.input = this.label.nextSibling as HTMLInputElement & {
          files: FileList;
        };
        //this.input.value = this.props.value;
        this.label.textContent = `media: ${
          (this.props.value as unknown as FileFieldValue).fileName ??
          'geen file'
        }`;
        this.renderList.push(this.label, this.input);
        this.input.addEventListener('change', () => {
          if (!this.input) return;
          const files = Array.from(this.input.files);
          if (files && files.length > 0) {
            // const file = URL.createObjectURL(files[0]);
            // console.log(file);

            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
              if (event && event.target && event.target.result) {
                if (this.label) {
                  this.label.textContent = `media: ${
                    (this.props.value as unknown as FileFieldValue).fileName ??
                    'geen file'
                  }`;
                }
                const data = btoa(event.target.result.toString());
                if (this.props.onChange) {
                  this.props.onChange(
                    {
                      fileName: files[0].name,
                      data,
                    },
                    this.props.formsComponent
                  );
                }
              }
            });
            reader.readAsBinaryString(files[0]);
          }
        });

        trackNamedSignal(
          `${this.props.formId}_${this.props.fieldName}`,
          (_value) => {
            // console.log(
            //   'trackNamedSignal',
            //   this.props.formId,
            //   this.props.fieldName,
            //   value
            // );
            // if (this.input) {
            //   this.input.value = value;
            // }
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

  setValue(value: string) {
    super.setValue(value);
    // if (this.input) {
    //   this.input.value = value;
    // }
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
