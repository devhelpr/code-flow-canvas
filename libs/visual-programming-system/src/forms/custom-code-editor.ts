import { createTemplate } from '@devhelpr/dom-components';
import { IFormsComponent } from './IFormsComponent';
import { FormField } from './FormField';

let isCustomEditorEnabled = false;

export const getCustomEditorTemplate = (
  fieldName: string,
  formId: string,
  label?: string,
  settings?: {
    showLabel?: boolean;
    textLabelColor?: string;
  }
): HTMLTemplateElement | undefined => {
  return createTemplate(
    `<div class="w-full mb-2 code-editor" id="${formId}_${fieldName}">
          <label for="${formId}_${fieldName}" class="block mb-2 ${
      settings?.textLabelColor ?? 'text-white'
    }">${label || fieldName}</label>
          <div id="${formId}_${fieldName}__html" class="editor-instance w-full"></div>
          </div>`
  );
};

export interface ICustomEditor {
  unmount: () => void;
  onAfterRender: (
    formComponent: IFormsComponent,
    formField: FormField,
    formId: string,
    editorLanguage?: string
  ) => void;
}

let createCustomEditorInstanceFunc: (() => ICustomEditor) | undefined =
  undefined;
export const getCreateCustomEditorInstanceFunc = () => {
  if (createCustomEditorInstanceFunc) {
    return createCustomEditorInstanceFunc();
  }
  return undefined;
};

export const setupCustomEditor = (
  createCustomEditorInstance: () => ICustomEditor
) => {
  isCustomEditorEnabled = true;

  createCustomEditorInstanceFunc = createCustomEditorInstance;
};

export const getIsCustomEditorEnabled = () => {
  return isCustomEditorEnabled;
};
