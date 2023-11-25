import { Component } from '@devhelpr/dom-components';

export class FormFieldComponent<T> extends Component<T> {
  fieldName?: string;
  public setValue(value: string): void {
    //
  }
}

export interface BaseFormFieldProps {
  setValue: (fieldName: string, value: string) => void;
}

export interface FormContext {
  setFormFieldValue: (fieldName: string, value: string) => void;
}
