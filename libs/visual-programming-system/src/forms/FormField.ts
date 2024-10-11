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
  Checkbox: 'Checkbox',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export type FormField = (
  | {
      fieldType: 'Select';
      value: string;
      options: { value: string; label: string }[];
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Text';
      value: string;
      onKeyDown?: (event: KeyboardEvent) => void;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Checkbox';
      value: string;
      onChange?: (value: boolean, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'File';
      value: string;
      onChange?: (
        value: FileFieldValue,
        formComponent: IFormsComponent
      ) => void;
      isImage?: boolean;
    }
  | {
      fieldType: 'Button';
      value: string;
      caption: string;
      onButtonClick?: () => Promise<void> | void;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'TextArea';
      value: string;
      isCodeEditor?: boolean;
      editorLanguage?: string;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Slider';
      value: string;
      min?: number;
      max?: number;
      step?: number;
      throtleTime?: number;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Color';
      value: string;
      onChange?: (value: string, formComponent: IFormsComponent) => void;
    }
  | {
      fieldType: 'Array';
      formElements: FormField[];
      hideDeleteButton?: boolean;
      //values: unknown[];
      value: unknown[];
      onChange?: (value: unknown[], formComponent: IFormsComponent) => void;
    }
) & {
  fieldName: string;
  label?: string;

  isRow?: boolean;

  settings?: {
    showLabel?: boolean;
  };

  conditions?: {
    visibility?: (values: unknown) => boolean;
  };
};

export interface FileFieldValue {
  fileName: string;
  data: string;
}
