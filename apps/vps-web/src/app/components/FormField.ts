export const FormFieldType = {
  Text: 'Text',
  TextArea: 'TextArea',
  Select: 'Select',
  Slider: 'Slider',
  Color: 'Color',
  Button: 'Button',
  Array: 'Array',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export type FormField = (
  | {
      fieldType: 'Select';
      options: { value: string; label: string }[];
    }
  | {
      fieldType: 'Text';
    }
  | {
      fieldType: 'Button';
      caption: string;
      onButtonClick?: () => Promise<void> | void;
    }
  | {
      fieldType: 'TextArea';
    }
  | {
      fieldType: 'Slider';
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      fieldType: 'Color';
    }
  | {
      fieldType: 'Array';
      formElements: FormField[];
      values: Record<string, string>[];
    }
) & {
  fieldName: string;
  label?: string;
  value: string;
  isRow?: boolean;
  onChange?: (value: string) => void;
  settings?: {
    showLabel?: boolean;
  };
};
