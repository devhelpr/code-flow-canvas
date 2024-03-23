import { IFormsComponent } from './IFormsComponent';

export const FormFieldType = {
  Text: 'Text',
  TextArea: 'TextArea',
  Select: 'Select',
  Slider: 'Slider',
  Color: 'Color',
  Button: 'Button',
  Array: 'Array',
  File: 'File',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export type FormField = (
  | {
      fieldType: 'Select';
      options: { value: string; label: string }[];
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Text';
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'File';
      onChange?: (
        value: FileFieldValue,
        formComponent: IFormsComponent
      ) => void;
    }
  | {
      fieldType: 'Button';
      caption: string;
      onButtonClick?: () => Promise<void> | void;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'TextArea';
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Slider';
      min?: number;
      max?: number;
      step?: number;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Color';
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Array';
      formElements: FormField[];
      values: unknown[];
      onChange?: (value: unknown[], formComponent: IFormsComponent) => void;
    }
) & {
  fieldName: string;
  label?: string;
  value: string;
  isRow?: boolean;

  settings?: {
    showLabel?: boolean;
  };
};

export interface FileFieldValue {
  fileName: string;
  data: string;
}
