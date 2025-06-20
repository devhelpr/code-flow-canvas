import {
  FormFieldType,
  NodeDefinition,
} from '@devhelpr/visual-programming-system';

export const formDefinition: NodeDefinition = {
  nodeTypeName: 'form',
  description:
    'A form component that shows a form with fields and buttons, allowing users to input data and submit it.',
  settingsFormFields: [
    {
      name: 'formJson',
      fieldType: FormFieldType.TextArea,
    },
  ],
};
