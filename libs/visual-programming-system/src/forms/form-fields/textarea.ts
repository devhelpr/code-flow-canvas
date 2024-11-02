import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { trackNamedSignal } from '../../reactivity';
import {
  getCreateCustomEditorInstanceFunc,
  getCustomEditorTemplate,
  getIsCustomEditorEnabled,
  ICustomEditor,
} from '../custom-code-editor';
import { IFormsComponent } from '../IFormsComponent';
import { FormField } from '../FormField';
//import * as monaco from 'monaco-editor';
//import { IFormsComponent } from '../IFormsComponent';

export interface TextAreaFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  isLast?: boolean;
  isCodeEditor?: boolean;
  editorLanguage?: string;
  onChange?: (value: string) => void;
}

export class TextAreaFieldComponent extends FormFieldComponent<TextAreaFieldProps> {
  oldProps: TextAreaFieldProps | null = null;
  textarea: HTMLTextAreaElement | null = null;
  label: HTMLLabelElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  isCustomEditor = false;
  customEditor: ICustomEditor | undefined = undefined;
  constructor(parent: BaseComponent | null, props: TextAreaFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;

    // temp disabled code editor
    this.isCustomEditor = getIsCustomEditorEnabled();
    if (this.isCustomEditor) {
      this.customEditor = getCreateCustomEditorInstanceFunc();
    }

    // if (props.isCodeEditor) {
    //   this.template = createTemplate(
    //     `<div class="w-full mb-2 code-editor" id="${props.formId}_${
    //       props.fieldName
    //     }">
    //       <label for="${props.formId}_${props.fieldName}" class="block mb-2 ${
    //       props.settings?.textLabelColor ?? 'text-white'
    //     }">${props.label || props.fieldName}</label>
    //       <div id="${props.formId}_${
    //       props.fieldName
    //     }__" class="w-full h-64"></div>
    //       </div>`
    //   );
    // } else

    if (this.isCustomEditor) {
      this.template = getCustomEditorTemplate(
        props.fieldName,
        props.formId,
        props.label,
        props.settings
      );
    } else {
      this.template = createTemplate(
        `<div class="w-full mb-2">
        <label for="${props.formId}_${props.fieldName}" class="block mb-2 ${
          props.settings?.textLabelColor ?? 'text-white'
        }">${props.label || props.fieldName}</label>
        <textarea class="block w-full p-1" 
          rows="10"
          name="${props.fieldName}"
          autocomplete="off"
          id="${props.formId}_${props.fieldName}"
          type="text"></textarea>
        </div>`
      );
    }

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
        // if (this.props.isCodeEditor) {
        //   this.initialRender = true;
        //   this.renderList.push(this.label);

        // } else
        if (this.isCustomEditor) {
          this.initialRender = true;
          this.renderList.push(this.label);
        } else {
          this.textarea = this.label.nextSibling as HTMLTextAreaElement;
          this.renderList.push(this.label, this.textarea);
          this.textarea.addEventListener('input', this.onInput);
          this.textarea.value = this.props.value;
          trackNamedSignal(
            `${this.props.formId}_${this.props.fieldName}`,
            (value) => {
              if (this.textarea) {
                this.textarea.value = value;
              }
            }
          );
        }
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
    if (this.isCustomEditor && this.customEditor) {
      this.customEditor.unmount();
    }
    // if (this.editorInstance) {
    //   this.editorInstance.dispose();
    // }

    this.isMounted = false;
  }

  public override setValue(value: string): void {
    if (!this.textarea) return;
    this.textarea.value = value;
  }

  onInput = (event: Event) => {
    const input = event.target as HTMLInputElement;

    if (this.props.onChange) {
      this.props.onChange(input.value);
    }
  };
  override render() {
    super.render();
    if (!this.element) return;
    if (!this.textarea && !this.props.isCodeEditor) return;

    // REMOVE THIS when isCodeEditor is working
    //if (!this.textarea) return;

    this.oldProps = this.props;

    if (this.textarea) {
      //this.h1.textContent = atom1.getValue() || this.props.value;
    }

    if (this.initialRender) {
      this.initialRender = false;
      // if (this.props.isCodeEditor) {
      //   this.renderElements([this.label]);
      // } else
      if (this.isCustomEditor) {
        this.renderElements([this.label]);
      } else {
        this.renderElements([this.textarea]);
      }
    }
  }
  override onAfterRender = (
    formComponent: IFormsComponent,
    formField: FormField
  ) => {
    if (this.isCustomEditor && this.customEditor) {
      this.customEditor.onAfterRender(
        formComponent,
        formField,
        this.props.formId,
        this.props.editorLanguage
      );
    }
  };
  // editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
  // onAfterRender = (_formComponent: IFormsComponent) => {
  //   if (this.props.isCodeEditor) {
  //     setTimeout(() => {
  //       try {
  //         const container = document.getElementById(
  //           `${this.props.formId}_${this.props.fieldName}`
  //         )!;
  //         console.log('monaco.editor.create', container);
  //         const editor = monaco.editor.create(container, {
  //           fixedOverflowWidgets: true,
  //           value: this.props.value, //"function hello() {\n\talert('Hello world!');\n}",
  //           language: 'html',
  //         });
  //         if (editor) {
  //           this.editorInstance = editor;
  //           editor.getModel()?.onDidChangeContent((_event) => {
  //             console.log('editor onDidChangeContent', editor.getValue());

  //             if (this.props.onChange) {
  //               this.props.onChange(editor.getValue());
  //             }
  //           });
  //         }
  //       } catch (e) {
  //         console.error('monaco.editor.create', e);
  //       }
  //     }, 0);
  //   }
  // };
}
