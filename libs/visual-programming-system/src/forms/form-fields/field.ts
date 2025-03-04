import { Component } from '@devhelpr/dom-components';
import { IFormsComponent } from '../IFormsComponent';
import { FormField } from '../FormField';

export class FormFieldComponent<T> extends Component<T> {
  fieldName?: string;
  public setValue(_value: string): void {
    //
  }
  onAfterRender?: (
    formComponent: IFormsComponent,
    formElement: FormField
  ) => void;
}

export interface BaseFormFieldProps {
  settings?: {
    showLabel?: boolean;
    textLabelColor?: string;
  };
  setValue: (fieldName: string, value: string) => void;
  formsComponent: IFormsComponent;
}

export interface FormContext {
  setFormFieldValue: (fieldName: string, value: string) => void;
}
