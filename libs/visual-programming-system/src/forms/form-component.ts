// import { InputField } from './form-fields/input';
// import { SelectField } from './form-fields/select';
// import { TextAreaField } from './form-fields/textarea';

import {
  BaseComponent,
  Component,
  createElement,
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { InputFieldChildComponent } from './form-fields/input';
import { TextAreaFieldComponent } from './form-fields/textarea';
import { SliderFieldChildComponent } from './form-fields/slider';
import { ColorFieldChildComponent } from './form-fields/color';
import { ButtonFieldChildComponent } from './form-fields/button';
import { FormFieldComponent } from './form-fields/field';
import { SelectFieldChildComponent } from './form-fields/select';
import { FileFieldValue, FormField, FormFieldType } from './FormField';
import { ArrayFieldChildComponent } from './form-fields/array';
import { IFormsComponent } from './IFormsComponent';
import { FileFieldChildComponent } from './form-fields/file';
import { CheckboxFieldChildComponent } from './form-fields/checkbox';
import { createFormDialog } from '../utils/create-form-dialog';

export interface FormComponentProps {
  rootElement: HTMLElement | undefined;
  onSave: (values: any) => void;
  onCancel?: () => void;
  formElements: FormField[];
  hasSubmitButton?: boolean;
  hasCancelButton?: boolean;
  id: string;
  canvasUpdated?: () => void;
  setDataOnNode?: (formValues: FormValues) => void;
  getDataFromNode?: () => FormValues;
  settings?: {
    minWidthContent?: boolean;
    textLabelColor: string;
  };
}

export type FormValues = {
  [key: string]: unknown;
};

export interface Props {
  rootElement: HTMLElement | undefined;
  onSave: (values: any) => void;
  onCancel?: () => void;
  formElements: FormField[];
  hasSubmitButton?: boolean;
  hasCancelButton?: boolean;
  id: string;
  canvasUpdated?: () => void;
  setDataOnNode?: (formValues: FormValues) => void;
  getDataFromNode?: () => FormValues;
  settings?: {
    textLabelColor: string;
    minWidthContent?: boolean;
  };
}

export class FormsComponent
  extends Component<Props>
  implements IFormsComponent
{
  oldProps: Props | null = null;
  values: FormValues = {};
  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  div: HTMLDivElement | null = null;
  form: HTMLFormElement | null = null;
  buttonElement: HTMLElement | null = null;
  cancelButtonElement: HTMLElement | null = null;

  formComponentId: string;

  constructor(parent: BaseComponent | null, props: Props) {
    super(parent, props);
    this.formComponentId = crypto.randomUUID();

    // WARNING ! Don't make the parents positioned relative or absolute... this will break the positioning of the thumbs when connected to form elements!!!
    // offsetTop is used.. and that is relative to the first positioned parent.. which is the node, not the form...
    this.template = createTemplate(
      `<div class="${props.settings?.minWidthContent ? 'w-min' : 'w-full'} p-2">
        <form autocomplete="off" role="search">
          <children></children>
          ${
            props.hasSubmitButton === true
              ? ` <button type="submit" class="border-transparent border bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 rounded">Save</button>`
              : ''
          }
        ${
          props.hasCancelButton === true
            ? `<button type="button" class="${
                props.hasSubmitButton ? 'ml-2' : ''
              } border border-blue-500 bg-transparent hover:bg-blue-500 text-white font-bold py-2 px-4 mt-4 rounded">Cancel</button>`
            : ''
        }
        </form>
      </div>`
    );
    this.rootElement = props.rootElement;
    this.values = props.getDataFromNode ? props.getDataFromNode() : {};
    this.mount();
  }
  override mount() {
    super.mount();
    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.element = createElementFromTemplate(this.template);

      if (this.element) {
        this.element.remove();
        this.div = this.element as HTMLDivElement;
        this.form = this.div.firstChild as HTMLFormElement;
        this.form.setAttribute('id', this.props.id);
        this.childContainerElement = this.form;
        // this.renderList.push(
        // );
        this.childRoot = this.form.firstChild as HTMLElement;
        if (this.props.hasSubmitButton === true) {
          if (!this.props.hasCancelButton) {
            this.buttonElement = this.form.lastChild as HTMLElement;
          } else {
            this.buttonElement = (this.form.lastChild as HTMLElement)
              .previousSibling as HTMLElement;
          }
        }
        if (this.props.hasCancelButton === true) {
          this.cancelButtonElement = this.form.lastChild as HTMLElement;
          this.cancelButtonElement.addEventListener('click', () => {
            this.unmount();
            this.props.onCancel?.();
          });
        }
        this.renderList.push(this.childRoot);
        if (this.buttonElement) {
          this.renderList.push(this.buttonElement);
        }
        if (this.cancelButtonElement) {
          this.renderList.push(this.cancelButtonElement);
        }
        this.createFormElements();
        this.rootElement.append(this.element);
        this.form.addEventListener('submit', this.onSubmit);
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

  onSubmit = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    // the commented code below is tricky.. FormData doesn't contain the proper field names
    //const form = event.target as HTMLFormElement;
    //const values = Object.fromEntries(new FormData(form));
    console.log('onSubmit form', this.values);
    //this.props.onSave({ ...values });
    this.props.onSave({ ...this.values });
    return false;
  };

  handleVisibility = (isFromRender?: boolean) => {
    let triggerRender = false;
    this.props.formElements.forEach((formElement) => {
      if (formElement.conditions?.visibility) {
        const formFieldComponent = this.components.find(
          (component) =>
            (component as unknown as FormField).fieldName ===
            formElement.fieldName
        );
        if (formFieldComponent) {
          const oldRender = formFieldComponent.doRender;
          if (formElement.conditions.visibility(this.values)) {
            formFieldComponent.doRender = true;
          } else {
            formFieldComponent.doRender = false;
          }
          if (oldRender !== formFieldComponent.doRender) {
            triggerRender = true;
          }
        }
      }
    });
    if (triggerRender && !isFromRender) {
      this.previousDoRenderChildren = null;
      this.render();
    }
  };

  onChange = (item: FormField, value: unknown) => {
    if (item.fieldType === FormFieldType.Array) {
      // hacky until I improved typescript typing
      item.value = value as unknown as unknown[];
      this.values[item.fieldName] = value as unknown as string;
    } else if (item.fieldType === FormFieldType.File) {
      item.value = value as unknown as string;
      this.values[item.fieldName] = value as unknown as string;
    } else {
      item.value = value as unknown as string;
      this.values[item.fieldName] = value as unknown as string;
    }

    this.handleVisibility();

    if (item.onChange) {
      if (item.fieldType === FormFieldType.Array) {
        item.onChange(value as unknown as unknown[], this);
      } else if (item.fieldType === FormFieldType.File) {
        item.onChange(value as unknown as FileFieldValue, this);
      } else if (item.fieldType === FormFieldType.Checkbox) {
        item.onChange(value as unknown as boolean, this);
      } else {
        item.onChange(value as unknown as string, this);
      }
    }
  };

  onChangeSettings = (fieldName: string, settings: string) => {
    this.values[fieldName] = settings;
    if (this.props.setDataOnNode) {
      this.props.setDataOnNode(this.values);
    }
    // todo : ... call item.onChange()... ???
  };

  setValue = (fieldName: string, value: string) => {
    if (!this.values) {
      this.values = {};
    }
    this.values[fieldName] = value;
    const formElement = this.components.find(
      (component) =>
        (component as FormFieldComponent<any>).fieldName === fieldName
    );
    if (formElement) {
      (formElement as FormFieldComponent<any>).setValue(value);
    }
  };

  createFormElements() {
    this.components = [];
    if (!this.values) {
      this.values = {};
    }
    //let loop = 0;
    this.props.formElements.forEach((formControl, index) => {
      const settings = { ...this.props.settings, ...formControl.settings };
      if (formControl.fieldType === FormFieldType.Text) {
        if (!this.values?.[formControl.fieldName]) {
          this.values[formControl.fieldName] = formControl.value || '';
        }
        const formControlComponent = new InputFieldChildComponent(this, {
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value:
            (this.values?.[formControl.fieldName] as string) ||
            formControl.value ||
            '',
          isRow: formControl.isRow,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          formsComponent: this,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Checkbox) {
        if (!this.values?.[formControl.fieldName]) {
          this.values[formControl.fieldName] = formControl.value || '';
        }
        const formControlComponent = new CheckboxFieldChildComponent(this, {
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value:
            (this.values?.[formControl.fieldName] as unknown as boolean) ||
            false,
          isRow: formControl.isRow,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          formsComponent: this,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.File) {
        const formControlComponent = new FileFieldChildComponent(this, {
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value:
            (this.values?.[formControl.fieldName] as string) ||
            formControl.value ||
            '',
          isRow: formControl.isRow,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          formsComponent: this,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Select) {
        if (!this.values?.[formControl.fieldName]) {
          this.values[formControl.fieldName] = formControl.value || '';
        }
        const formControlComponent = new SelectFieldChildComponent(this, {
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value:
            (this.values?.[formControl.fieldName] as string) ||
            formControl.value ||
            '',
          isRow: formControl.isRow,
          settings,
          options: formControl.options,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          formsComponent: this,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Slider) {
        if (!this.values?.[formControl.fieldName]) {
          this.values[formControl.fieldName] = formControl.value || '0.0';
        }
        const formControlComponent = new SliderFieldChildComponent(this, {
          formId: this.props.id,
          formsComponent: this,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value:
            (this.values?.[formControl.fieldName] as string) ||
            formControl.value ||
            '0.0',
          isRow: formControl.isRow,
          min: formControl.min,
          max: formControl.max,
          step: formControl.step,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          onGetSettings: () => {
            return this.values?.[`${formControl.fieldName}SliderSettings`]
              ? JSON.parse(
                  this.values[
                    `${formControl.fieldName}SliderSettings`
                  ] as string
                )
              : {
                  min: formControl.min,
                  max: formControl.max,
                  step: formControl.step,
                };
          },
          onStoreSettings: (formValues) => {
            console.log('onStoreSettings', formControl.fieldName, formValues);
            if (!this.values) {
              this.values = {};
            }
            this.values[`${formControl.fieldName}SliderSettings`] =
              JSON.stringify(formValues);

            // this should store the settings in the form values..
            this.onChangeSettings(
              `${formControl.fieldName}SliderSettings`,
              JSON.stringify(formValues)
            );
            if (this.props.canvasUpdated) {
              this.props.canvasUpdated();
            }
            // TODO : call canvasudated !??
          },
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Color) {
        if (!this.values?.[formControl.fieldName]) {
          this.values[formControl.fieldName] = formControl.value || '#000000';
        }
        const formControlComponent = new ColorFieldChildComponent(this, {
          formsComponent: this,
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value:
            (this.values?.[formControl.fieldName] as string) ||
            formControl.value ||
            '#000000',
          isRow: formControl.isRow,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.TextArea) {
        if (!this.values?.[formControl.fieldName]) {
          this.values[formControl.fieldName] = formControl.value || '';
        }
        const formControlComponent = new TextAreaFieldComponent(this, {
          formsComponent: this,
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          isCodeEditor: formControl.isCodeEditor,
          value:
            (this.values?.[formControl.fieldName] as string) ||
            formControl.value ||
            '',
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Button) {
        const formControlComponent = new ButtonFieldChildComponent(this, {
          formsComponent: this,
          formId: this.props.id,
          fieldName: formControl.fieldName,
          caption: formControl.caption,
          settings,
          setValue: this.setValue,
          onButtonClick: formControl.onButtonClick,
          isLast: index === this.props.formElements.length - 1,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Array) {
        const formControlComponent = new ArrayFieldChildComponent(this, {
          formsComponent: this,
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          hideDeleteButton: formControl.hideDeleteButton,
          formElements: formControl.formElements,
          values: formControl.value as unknown as unknown[],
          settings,
          isLast: index === this.props.formElements.length - 1,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          createDataReadElement: (formElement, data) => {
            if (
              formElement.fieldType === FormFieldType.File &&
              formElement.isImage
            ) {
              const element = createElement(
                'img',
                'form-field__read-image',
                undefined,
                undefined
              );
              element?.classList.add(
                'w-[48px]',
                'h-[48px]',
                'max-w-[48px]',
                'object-cover'
              );
              console.log('createDataReadElement', data, formElement.fieldName);
              if (data && (data as any).data) {
                try {
                  (element as HTMLImageElement).src = `data:image/png;base64,${
                    (data as any).data
                  }`;
                } catch (e) {
                  console.error('Error when assigning file/media to image', e);
                }
              }
              //
              return element;
            } else if (formElement.fieldType === FormFieldType.Color) {
              const element = createElement(
                'div',
                'form-field__read-color',
                undefined,
                undefined
              );
              if (element) {
                element.style.backgroundColor =
                  data?.toString() ??
                  (this.values[formElement.fieldName] as string) ??
                  '';
              }
              return element;
            }
            const element = createElement(
              'div',
              'whitespace-nowrap',
              undefined,
              data?.toString() ??
                (this.values[formElement.fieldName] as string) ??
                ''
            );

            return element;
          },
          createFormDialog: async (
            formElements: FormField[],
            values?: unknown
          ) => {
            return new Promise((resolve, reject) => {
              createFormDialog(formElements, undefined, values)
                .then((result) => {
                  if (result !== false) {
                    resolve(result);
                  } else {
                    reject();
                  }
                })
                .catch((error) => {
                  console.log('createFormDialog', error);
                });
            });
          },
        });
        this.components.push(formControlComponent);
      }
      //loop++;
      //listItemComponent.props.listItem = "updated via props";
    });
  }

  override render() {
    super.render();

    if (!this.element) return;

    if (
      !this.oldProps ||
      this.oldProps.formElements.length !== this.props.formElements.length
    ) {
      console.log('list items changed');
      this.createFormElements();
      this.handleVisibility(true);
      this.previousDoRenderChildren = null;
    }
    this.oldProps = {
      ...this.props,
      formElements: [...this.props.formElements],
    };

    const oldActiveElement =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement)
        : null;
    // Make this smarter .. do only when needed!!?
    // an approach: only perform when doRenderChildren changes or has its initial value set
    // .. however.. the children's render method isn't called when no change is detected.. but is this a problem?
    // ... the children themselves should be responsible for this
    if (
      this.previousDoRenderChildren === null ||
      this.previousDoRenderChildren !== this.doRenderChildren
    ) {
      this.previousDoRenderChildren = this.doRenderChildren;
      this.renderList = [];
      const childElements = this.doRenderChildren
        ? this.getRenderableChildren()
        : [];
      if (this.buttonElement) {
        childElements.push(this.buttonElement);
      }
      if (this.cancelButtonElement) {
        childElements.push(this.cancelButtonElement);
      }
      this.renderElements(childElements);
      if (oldActiveElement) {
        // hack to keep focus on the same element after re-render
        oldActiveElement?.focus();
      }
    }
    this.props.formElements.forEach((formElement) => {
      const formFieldComponent = this.components.find(
        (component) =>
          (component as unknown as FormField).fieldName ===
          formElement.fieldName
      ) as FormFieldComponent<any> | undefined;
      if (formFieldComponent && formFieldComponent.onAfterRender) {
        formFieldComponent && formFieldComponent.onAfterRender(this);
      }
    });
  }
}

export const FormComponent = (props: FormComponentProps) => {
  const formComponent = new FormsComponent(null, {
    rootElement: props.rootElement,
    onSave: props.onSave,
    onCancel: props.onCancel,
    formElements: props.formElements,
    hasSubmitButton: props.hasSubmitButton,
    hasCancelButton: props.hasCancelButton,
    id: props.id,
    canvasUpdated: props.canvasUpdated,
    setDataOnNode: props.setDataOnNode,
    getDataFromNode: props.getDataFromNode,
    settings: props.settings,
  });
  formComponent.render();
  return formComponent;
};
