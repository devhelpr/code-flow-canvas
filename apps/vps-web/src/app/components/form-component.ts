// import { InputField } from './form-fields/input';
// import { SelectField } from './form-fields/select';
// import { TextAreaField } from './form-fields/textarea';

import {
  BaseComponent,
  Component,
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
import { FormField, FormFieldType } from './FormField';
import { ArrayFieldChildComponent } from './form-fields/array';
import { IFormsComponent } from './IFormsComponent';

export interface FormComponentProps {
  rootElement: HTMLElement;
  onSave: (values: any) => void;
  formElements: FormField[];
  hasSubmitButton?: boolean;
  id: string;
  canvasUpdated?: () => void;
  setDataOnNode?: (formValues: FormValues) => void;
  getDataFromNode?: () => FormValues;
  settings?: {
    textLabelColor: string;
  };
}

export type FormValues = {
  [key: string]: string;
};

export interface Props {
  rootElement: HTMLElement;
  onSave: (values: any) => void;
  formElements: FormField[];
  hasSubmitButton?: boolean;
  id: string;
  canvasUpdated?: () => void;
  setDataOnNode?: (formValues: FormValues) => void;
  getDataFromNode?: () => FormValues;
  settings?: {
    textLabelColor: string;
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

  formComponentId: string;

  constructor(parent: BaseComponent | null, props: Props) {
    super(parent, props);
    this.formComponentId = crypto.randomUUID();

    // WARNING ! Don't make the parents positioned relative or absolute... this will break the positioning of the thumbs when connected to form elements!!!
    // offsetTop is used.. and that is relative to the first positioned parent.. which is the node, not the form...
    this.template = createTemplate(
      `<div class="w-full p-2">
        <form>
          <children></children>
          ${
            props.hasSubmitButton === true
              ? ` <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 rounded">Save</button>`
              : ''
          }
        </form>
      </div>`
    );
    this.rootElement = props.rootElement;
    this.values = props.getDataFromNode ? props.getDataFromNode() : {};
    this.mount();
  }
  mount() {
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
          this.buttonElement = this.form.lastChild as HTMLElement;
        }
        this.renderList.push(this.childRoot);
        if (this.buttonElement) {
          this.renderList.push(this.buttonElement);
        }
        this.createFormElements();
        this.rootElement.append(this.element);
        this.form.addEventListener('submit', this.onSubmit);
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

  onSubmit = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const form = event.target as HTMLFormElement;
    const values = Object.fromEntries(new FormData(form));
    console.log(values);
    this.props.onSave({ ...values });
    return false;
  };

  onChange = (item: FormField, value: string) => {
    item.value = value;
    this.values[item.fieldName] = value;
    if (item.onChange) {
      item.onChange(value, this);
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
    let loop = 0;
    this.props.formElements.forEach((formControl, index) => {
      const settings = { ...this.props.settings, ...formControl.settings };
      if (formControl.fieldType === FormFieldType.Text) {
        const formControlComponent = new InputFieldChildComponent(this, {
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value: formControl.value,
          isRow: formControl.isRow,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          formsComponent: this,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.Select) {
        const formControlComponent = new SelectFieldChildComponent(this, {
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value: formControl.value,
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
        const formControlComponent = new SliderFieldChildComponent(this, {
          formId: this.props.id,
          formsComponent: this,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value: formControl.value,
          isRow: formControl.isRow,
          min: formControl.min,
          max: formControl.max,
          step: formControl.step,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
          onGetSettings: () => {
            return this.values[`${formControl.fieldName}SliderSettings`]
              ? JSON.parse(
                  this.values[`${formControl.fieldName}SliderSettings`]
                )
              : {
                  min: formControl.min,
                  max: formControl.max,
                  step: formControl.step,
                };
          },
          onStoreSettings: (formValues) => {
            console.log('onSave', formValues);
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
        const formControlComponent = new ColorFieldChildComponent(this, {
          formsComponent: this,
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value: formControl.value,
          isRow: formControl.isRow,
          settings,
          setValue: this.setValue,
          onChange: (value) => this.onChange(formControl, value),
          isLast: index === this.props.formElements.length - 1,
        });
        this.components.push(formControlComponent);
      } else if (formControl.fieldType === FormFieldType.TextArea) {
        const formControlComponent = new TextAreaFieldComponent(this, {
          formsComponent: this,
          formId: this.props.id,
          fieldName: formControl.fieldName,
          label: formControl.label,
          value: formControl.value,
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
          formElements: formControl.formElements,
          values: formControl.values,
          settings,
          isLast: index === this.props.formElements.length - 1,
          setValue: this.setValue,
        });
        this.components.push(formControlComponent);
      }
      loop++;
      //listItemComponent.props.listItem = "updated via props";
    });
  }

  render() {
    super.render();

    if (!this.element) return;

    if (
      !this.oldProps ||
      this.oldProps.formElements.length !== this.props.formElements.length
    ) {
      console.log('list items changed');
      this.createFormElements();
      this.previousDoRenderChildren = null;
    }
    this.oldProps = {
      ...this.props,
      formElements: [...this.props.formElements],
    };

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
      this.renderElements(childElements);
    }
  }
}

export const FormComponent = (props: FormComponentProps) => {
  const formComponent = new FormsComponent(null, {
    rootElement: props.rootElement,
    onSave: props.onSave,
    formElements: props.formElements,
    hasSubmitButton: props.hasSubmitButton,
    id: props.id,
    canvasUpdated: props.canvasUpdated,
    setDataOnNode: props.setDataOnNode,
    getDataFromNode: props.getDataFromNode,
    settings: props.settings,
  });
  formComponent.render();
  return formComponent;
};
