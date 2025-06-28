import {
  FormFieldType,
  NodeDefinition,
} from '@devhelpr/visual-programming-system';

export const dummyDefinition: NodeDefinition = {
  nodeTypeName: 'dummy',
  description: 'A dummy coponent.',
  settingsFormFields: [
    {
      name: 'test',
      fieldType: FormFieldType.Text,
    },
  ],
  nodeTheme: {
    backgroundColorClass: 'bg-teal-400',
    //textColorClass: 'text-white',
  },
};

export const dummy2Definition: NodeDefinition = {
  nodeTypeName: 'dummy2',
  description: 'A dummy coponent.',
  settingsFormFields: [
    {
      name: 'test',
      fieldType: FormFieldType.Text,
    },
  ],
  nodeTheme: {
    backgroundColorClass: 'bg-purple-400',
    textColorClass: 'text-white',
  },
};

export const dummy3Definition: NodeDefinition = {
  nodeTypeName: 'dummy3',
  description: 'A dummy coponent.',
  settingsFormFields: [
    {
      name: 'test',
      fieldType: FormFieldType.Text,
    },
  ],
  nodeTheme: {
    backgroundColorClass: 'bg-orange-400',
    //textColorClass: 'text-white',
  },
};
