import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import { FormSchema, Component, Action, Page } from './types';
import { IFlowCanvasBase } from '@devhelpr/visual-programming-system';
import {
  getVariablePayloadInputUtils,
  NodeInfo,
} from '@devhelpr/web-flow-executor';

interface FormPage extends Page {
  id: string;
  title: string;
  route: string;
  components: Component[];
  isEndPage?: boolean;
  branches?: Array<{
    condition: {
      field: string;
      operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
      value: string;
    };
    nextPage: string;
  }>;
  nextPage?: string;
}

export interface ExtendedFormSchema extends FormSchema {
  pages: Page[];
}

export class VanillaFormCore {
  private _schema: ExtendedFormSchema;
  private container: HTMLElement;
  public currentPage: FormPage | null = null;
  private formData: Record<string, unknown> = {};
  private pageHistory: string[] = [];
  private branchHistory: Array<{ pageId: string; branchIndex: number | null }> =
    [];
  private touchedFields: Set<string> = new Set();
  private validationErrors: Record<string, string> = {};
  private payload: any = {};
  private scopeId: string | undefined;
  private canvasAppInstance: IFlowCanvasBase<NodeInfo>;
  constructor(
    schema: ExtendedFormSchema,
    containerElement: HTMLElement,
    payload: any,
    canvasAppInstance: IFlowCanvasBase<NodeInfo>,
    scopeId?: string | undefined
  ) {
    this.payload = payload;
    this._schema = schema;
    this.container = containerElement;
    this.canvasAppInstance = canvasAppInstance;
    this.scopeId = scopeId;
  }

  private onSubmitEvent: ((data: any) => void) | undefined;
  public init(onSubmit: ((data: any) => void) | undefined): void {
    this.onSubmitEvent = onSubmit;
    this.renderTitle();
    this.navigateToPage(this._schema.app.pages[0].id);
  }

  private renderTitle(): void {
    const title = document.createElement('h1');
    title.className = 'text-2xl font-semibold text-gray-900 mb-6';
    title.textContent = this._schema.app.title;
    this.container.appendChild(title);
  }

  public navigateToPage(
    pageId: string,
    branchIndex: number | null = null
  ): void {
    const page = this._schema.app.pages.find((p) => p.id === pageId);
    if (!page) {
      throw new Error(`Page with id "${pageId}" not found`);
    }

    // Validate current page before navigation
    if (this.currentPage) {
      const isValid = this.validateForm();
      if (!isValid) {
        return; // Don't navigate if validation fails
      }
    }

    this.currentPage = page;
    this.pageHistory.push(pageId);
    this.branchHistory.push({ pageId, branchIndex });
    this.container.innerHTML = '';
    this.renderTitle();
    this.renderPage(page);
  }

  private renderPage(page: Page): void {
    const form = document.createElement('form');
    form.className = 'space-y-6 max-w-md mx-auto';

    page.components.forEach((component) => {
      if (this.isComponentVisible(component)) {
        const element = this.renderComponent(component);
        if (element) {
          form.appendChild(element);
        }
      }
    });

    this.container.appendChild(form);
  }

  private isComponentVisible(component: Component): boolean {
    if (!component.visibilityConditions) return true;

    return component.visibilityConditions.every((condition) => {
      const fieldValue = this.formData[condition.field];
      if (fieldValue === undefined) return false;

      switch (condition.operator) {
        case '==':
          return String(fieldValue) === String(condition.value);
        case '!=':
          return String(fieldValue) !== String(condition.value);
        case '>':
          return Number(fieldValue) > Number(condition.value);
        case '<':
          return Number(fieldValue) < Number(condition.value);
        case '>=':
          return Number(fieldValue) >= Number(condition.value);
        case '<=':
          return Number(fieldValue) <= Number(condition.value);
        default:
          return true;
      }
    });
  }

  public renderComponent(component: Component): HTMLElement | null {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-2';
    wrapper.id = `component-${component.id}`;
    wrapper.setAttribute('data-disable-interaction', 'true');
    if (component.label) {
      const label = document.createElement('label');
      label.htmlFor = component.id;
      label.className = 'block text-sm font-medium text-gray-700';
      label.textContent = component.label;
      if (component.validation?.required) {
        const requiredMarker = document.createElement('span');
        requiredMarker.textContent = ' *';
        requiredMarker.className = 'text-red-500';
        label.appendChild(requiredMarker);
      }
      wrapper.appendChild(label);
    }

    let element: HTMLElement | null = null;

    switch (component.type) {
      case 'input':
        element = this.createTextInput(component);
        break;
      case 'text':
        element = this.createText(component);
        break;
      case 'textarea':
        element = this.createTextarea(component);
        break;
      case 'select':
        element = this.createSelect(component);
        break;
      case 'radio':
        element = this.createRadioGroup(component);
        break;
      case 'checkbox':
        element = this.createCheckbox(component);
        break;
      case 'array':
        element = this.createArrayField(component);
        break;
      default:
        element = document.createElement('div');
        element.textContent = `Unsupported component type: ${component.type}`;
    }

    if (element) {
      // Only restore form data and setup validation for input elements
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        if (this.formData[component.id]) {
          element.value = this.formData[component.id] as string;
        }
        this.setupValidation(component, element);
      }
      this.setupEventHandlers(component, element);
      wrapper.appendChild(element);
    }

    return wrapper;
  }

  private createTextInput(component: Component): HTMLInputElement {
    const input = document.createElement('input');
    input.type = component.props?.type || 'text';
    input.id = component.id;
    input.name = component.id;
    input.className = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
      this.validationErrors[component.id] ? 'border-red-500' : ''
    }`;

    if (component.props) {
      Object.entries(component.props).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          input.setAttribute(key, String(value));
        }
      });
    }

    return input;
  }

  private createTextarea(component: Component): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.id = component.id;
    textarea.name = component.id;
    textarea.className = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
      this.validationErrors[component.id] ? 'border-red-500' : ''
    }`;

    if (component.props) {
      Object.entries(component.props).forEach(([key, value]) => {
        textarea.setAttribute(key, value.toString());
      });
    }

    return textarea;
  }

  private createSelect(component: Component): HTMLSelectElement {
    const select = document.createElement('select');
    select.id = component.id;
    select.name = component.id;
    select.className = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
      this.validationErrors[component.id] ? 'border-red-500' : ''
    }`;
    const options = component.props?.optionsExpression
      ? this.getOptonsViaExpression(component.props.optionsExpression)
      : component.props?.options ?? [];

    options.forEach((option: { value: string; label: string }) => {
      const optionElement = document.createElement('option');
      if (typeof option === 'string') {
        optionElement.value = option;
        optionElement.textContent = option;
      } else {
        optionElement.value = option.value;
        optionElement.textContent = option.label;
      }
      select.appendChild(optionElement);
    });

    return select;
  }

  private createText(component: Component): HTMLElement {
    const text = document.createElement('p');
    text.id = component.id;
    text.className = 'text-gray-600';
    text.textContent = component.props?.textExpression
      ? this.getTextViaExpression(component.props?.textExpression)
      : component.props?.text || '';
    return text;
  }
  private getTextViaExpression(expression: string) {
    const payloadForExpression = getVariablePayloadInputUtils(
      this.payload,
      this.payload,
      'string',
      0,
      0,
      this.scopeId,
      this.canvasAppInstance
    );
    const compiledExpression = compileExpressionAsInfo(expression);
    const expressionFunction = (
      new Function('payload', `${compiledExpression.script}`) as unknown as (
        payload?: any
      ) => any
    ).bind(compiledExpression.bindings);
    return (
      runExpression(
        expressionFunction,
        payloadForExpression,
        false,
        compiledExpression.payloadProperties
      ) ?? ''
    ).toString();
  }
  private getOptonsViaExpression(expression: string) {
    const compiledExpression = compileExpressionAsInfo(expression);
    const expressionFunction = (
      new Function('payload', `${compiledExpression.script}`) as unknown as (
        payload?: any
      ) => any
    ).bind(compiledExpression.bindings);
    return (
      runExpression(
        expressionFunction,
        this.payload,
        false,
        compiledExpression.payloadProperties
      ) ?? []
    );
  }
  private createRadioGroup(component: Component): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'space-y-2';
    const options = component.props?.optionsExpression
      ? this.getOptonsViaExpression(component.props.optionsExpression)
      : component.props?.options ?? [];
    options.forEach((option: { value: string; label: string }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center';

      const input = document.createElement('input');
      input.type = 'radio';
      input.id = `${component.id}-${
        typeof option === 'string' ? option : option.value
      }`;
      input.name = component.id;
      if (typeof option === 'string') {
        input.value = option;
      } else {
        input.value = option.value;
      }
      input.className =
        'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300';

      // Set initial value if it exists in formData
      if (
        this.formData[component.id] ===
        (typeof option === 'string' ? option : option.value)
      ) {
        input.checked = true;
      }

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.className = 'ml-3 block text-sm font-medium text-gray-700';
      label.textContent = typeof option === 'string' ? option : option.label;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      container.appendChild(wrapper);

      this.setupValidation(component, input);
    });

    return container;
  }

  private createCheckbox(component: Component): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = component.id;
    input.name = component.id;
    input.className =
      'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded';

    // Set initial value if it exists in formData
    if (this.formData[component.id] !== undefined) {
      input.checked = Boolean(this.formData[component.id]);
    }

    const label = document.createElement('label');
    label.htmlFor = component.id;
    label.className = 'ml-3 block text-sm font-medium text-gray-700';
    label.textContent = component.label || '';

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    return wrapper;
  }

  private createArrayField(component: Component): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'space-y-4';
    container.id = component.id;

    // Initialize array data if not exists
    if (!this.formData[component.id]) {
      this.formData[component.id] = [];
    }

    const items = this.formData[component.id] as Record<string, unknown>[];
    const arrayItems = component.arrayItems || [];

    // Render existing items
    items.forEach((item, index) => {
      const itemContainer = this.renderArrayItem(component, item, index);
      container.appendChild(itemContainer);
    });

    // Add "Add Item" button
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Add Item';
    addButton.className =
      'mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
    addButton.addEventListener('click', () => {
      const newItem: Record<string, unknown> = {};
      arrayItems.forEach((arrayItem) => {
        arrayItem.components.forEach((comp) => {
          newItem[comp.id] = '';
        });
      });
      items.push(newItem);
      this.formData[component.id] = items;
      this.updateArrayField(component);
    });

    container.appendChild(addButton);
    return container;
  }

  private renderArrayItem(
    component: Component,
    item: Record<string, unknown>,
    index: number
  ): HTMLElement {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'p-4 border border-gray-200 rounded-lg space-y-4';

    component.arrayItems?.forEach((arrayItem) => {
      const itemContent = document.createElement('div');
      itemContent.className = 'space-y-4';

      arrayItem.components.forEach((comp) => {
        const itemId = `${component.id}[${index}].${comp.id}`;
        const hasError = !!this.validationErrors[itemId];

        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'space-y-2';

        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-gray-700';
        label.htmlFor = itemId;
        label.textContent = comp.label || '';
        if (comp.validation?.required) {
          const requiredSpan = document.createElement('span');
          requiredSpan.className = 'text-red-500 ml-1';
          requiredSpan.textContent = '*';
          label.appendChild(requiredSpan);
        }
        fieldContainer.appendChild(label);

        // Create input field directly instead of using renderComponent
        let field: HTMLElement;
        if (comp.type === 'input') {
          const input = document.createElement('input');
          input.type = comp.props?.type || 'text';
          input.id = itemId;
          input.name = itemId;
          input.value = (item[comp.id] as string) || '';
          input.className = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            hasError ? 'border-red-500' : ''
          }`;

          if (comp.props) {
            Object.entries(comp.props).forEach(([key, value]) => {
              if (value !== undefined && value !== null && key !== 'type') {
                input.setAttribute(key, String(value));
              }
            });
          }

          // Add change listener to update formData
          input.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            item[comp.id] = target.value;
            // Validate on change
            if (comp.validation) {
              this.validateField(input, comp.validation, true);
            }
          });

          // Add blur listener for validation
          input.addEventListener('blur', (e) => {
            const target = e.target as HTMLInputElement;
            if (comp.validation) {
              this.validateField(target, comp.validation, true);
            }
          });

          field = input;
        } else {
          // Handle other field types if needed
          field = document.createElement('div');
          field.textContent = `Unsupported field type: ${comp.type}`;
        }

        fieldContainer.appendChild(field);

        // Add error message container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-error-container';
        fieldContainer.appendChild(errorContainer);

        // Show existing error if any
        if (hasError) {
          const errorMessage = document.createElement('p');
          errorMessage.className = 'mt-1 text-sm text-red-600';
          errorMessage.textContent = this.validationErrors[itemId];
          errorContainer.appendChild(errorMessage);
        }

        itemContent.appendChild(fieldContainer);
      });

      itemContainer.appendChild(itemContent);
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className =
      'mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500';
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => {
      const items = this.formData[component.id] as Record<string, unknown>[];
      items.splice(index, 1);
      this.updateArrayField(component);
      // Revalidate after removal
      this.validateForm();
    };
    itemContainer.appendChild(removeButton);

    return itemContainer;
  }

  private updateArrayField(component: Component): void {
    const container = document.getElementById(component.id);
    if (!container) return;

    container.innerHTML = '';
    const items = this.formData[component.id] as Record<string, unknown>[];

    items.forEach((item, index) => {
      const itemContainer = this.renderArrayItem(component, item, index);
      container.appendChild(itemContainer);
    });

    // Add "Add Item" button
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Item';
    addButton.className =
      'mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
    addButton.addEventListener('click', () => {
      const newItem: Record<string, unknown> = {};
      component.arrayItems?.forEach((arrayItem) => {
        arrayItem.components.forEach((comp) => {
          newItem[comp.id] = '';
        });
      });
      items.push(newItem);
      this.formData[component.id] = items;
      this.updateArrayField(component);
    });

    container.appendChild(addButton);
  }

  private setupValidation(component: Component, element: HTMLElement): void {
    if (!component.validation) return;

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      // Initialize form data with any existing values
      if (element.value) {
        this.formData[element.name] = element.value;
      }

      // Add blur event to track touched state and validate
      element.addEventListener('blur', () => {
        this.touchedFields.add(element.name);
        this.validateField(element, component.validation);
      });

      // Add change event to update form data
      element.addEventListener('change', () => {
        this.formData[element.name] = element.value;
        // Only validate if the field has been touched
        if (this.touchedFields.has(element.name)) {
          this.validateField(element, component.validation);
        }
      });

      // Add input event to update form data in real-time
      element.addEventListener('input', () => {
        this.formData[element.name] = element.value;
        // Only validate if the field has been touched
        if (this.touchedFields.has(element.name)) {
          this.validateField(element, component.validation);
        }
      });

      // Only set required attribute as it's common to all elements
      if (component.validation.required) {
        element.required = true;
      }

      // Set pattern only for input elements
      if (component.validation.pattern && element instanceof HTMLInputElement) {
        element.pattern = component.validation.pattern;
      }

      // Clear any initial validation state
      this.clearValidationError(element);
    }
  }

  private validateField(
    element:
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | HTMLElement,
    validation?: Component['validation'],
    force = false
  ): boolean {
    // Don't validate if the field hasn't been touched and we're not forcing validation
    if (!force && !this.touchedFields.has(element.getAttribute('name') || '')) {
      return true;
    }

    let isValid = true;

    // Handle input elements
    if (element instanceof HTMLInputElement) {
      if (element.type === 'button') return true;

      if (validation?.required && !element.value) {
        isValid = false;
        this.showValidationError(element, 'This field is required');
      } else {
        this.clearValidationError(element);
      }

      if (validation?.pattern) {
        try {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(element.value)) {
            isValid = false;
            this.showValidationError(element, 'Invalid format');
          }
        } catch {
          console.error('Invalid pattern:', validation.pattern);
          // Skip pattern validation if pattern is invalid
        }
      }

      if (
        validation?.minLength &&
        element.value.length < validation.minLength
      ) {
        isValid = false;
        this.showValidationError(
          element,
          `Minimum length is ${validation.minLength}`
        );
      }
      if (
        validation?.maxLength &&
        element.value.length > validation.maxLength
      ) {
        isValid = false;
        this.showValidationError(
          element,
          `Maximum length is ${validation.maxLength}`
        );
      }
    }
    // Handle textarea elements
    else if (element instanceof HTMLTextAreaElement) {
      if (validation?.required && !element.value) {
        isValid = false;
        this.showValidationError(element, 'This field is required');
      } else {
        this.clearValidationError(element);
      }

      if (
        validation?.minLength &&
        element.value.length < validation.minLength
      ) {
        isValid = false;
        this.showValidationError(
          element,
          `Minimum length is ${validation.minLength}`
        );
      }
      if (
        validation?.maxLength &&
        element.value.length > validation.maxLength
      ) {
        isValid = false;
        this.showValidationError(
          element,
          `Maximum length is ${validation.maxLength}`
        );
      }
    }
    // Handle select elements
    else if (element instanceof HTMLSelectElement) {
      if (validation?.required && !element.value) {
        isValid = false;
        this.showValidationError(element, 'This field is required');
      } else {
        this.clearValidationError(element);
      }
    }

    return isValid;
  }

  public validateForm(): boolean {
    if (!this.currentPage) return true;

    let isValid = true;
    this.validationErrors = {}; // Clear previous errors

    // Validate all components on the current page
    this.currentPage.components.forEach((component) => {
      if (component.type === 'array') {
        // Validate array field
        const items =
          (this.formData[component.id] as Record<string, unknown>[]) || [];

        // Validate minItems and maxItems
        if (
          component.validation?.minItems &&
          items.length < component.validation.minItems
        ) {
          isValid = false;
          this.validationErrors[
            component.id
          ] = `Minimum ${component.validation.minItems} items required`;
        }
        if (
          component.validation?.maxItems &&
          items.length > component.validation.maxItems
        ) {
          isValid = false;
          this.validationErrors[
            component.id
          ] = `Maximum ${component.validation.maxItems} items allowed`;
        }

        // Validate each array item's components
        items.forEach((item, index) => {
          component.arrayItems?.forEach((arrayItem) => {
            arrayItem.components.forEach((comp) => {
              const itemId = `${component.id}[${index}].${comp.id}`;
              const value = item[comp.id];

              // Required validation
              if (comp.validation?.required && !value) {
                isValid = false;
                this.validationErrors[itemId] = 'This field is required';
              }

              // Pattern validation for email and other patterns
              if (comp.validation?.pattern && value) {
                try {
                  const regex = new RegExp(comp.validation.pattern);
                  if (!regex.test(String(value))) {
                    isValid = false;
                    this.validationErrors[itemId] =
                      comp.props?.type === 'email'
                        ? 'Please enter a valid email address'
                        : 'Invalid format';
                  }
                } catch {
                  console.error('Invalid pattern:', comp.validation.pattern);
                }
              }

              // MinLength validation
              if (
                comp.validation?.minLength &&
                value &&
                String(value).length < comp.validation.minLength
              ) {
                isValid = false;
                this.validationErrors[
                  itemId
                ] = `Minimum length is ${comp.validation.minLength}`;
              }

              // MaxLength validation
              if (
                comp.validation?.maxLength &&
                value &&
                String(value).length > comp.validation.maxLength
              ) {
                isValid = false;
                this.validationErrors[
                  itemId
                ] = `Maximum length is ${comp.validation.maxLength}`;
              }
            });
          });
        });
      } else {
        // Validate regular fields
        const value = this.formData[component.id];
        if (component.validation?.required && !value) {
          isValid = false;
          this.validationErrors[component.id] = 'This field is required';
        }

        // Pattern validation for regular fields
        if (component.validation?.pattern && value) {
          try {
            const regex = new RegExp(component.validation.pattern);
            if (!regex.test(String(value))) {
              isValid = false;
              this.validationErrors[component.id] = 'Invalid format';
            }
          } catch {
            console.error('Invalid pattern:', component.validation.pattern);
          }
        }

        // MinLength validation for regular fields
        if (
          component.validation?.minLength &&
          value &&
          String(value).length < component.validation.minLength
        ) {
          isValid = false;
          this.validationErrors[
            component.id
          ] = `Minimum length is ${component.validation.minLength}`;
        }

        // MaxLength validation for regular fields
        if (
          component.validation?.maxLength &&
          value &&
          String(value).length > component.validation.maxLength
        ) {
          isValid = false;
          this.validationErrors[
            component.id
          ] = `Maximum length is ${component.validation.maxLength}`;
        }
      }
    });

    // Update UI to show validation errors
    this.updateValidationErrors();
    return isValid;
  }

  private updateValidationErrors(): void {
    // Clear all existing error messages
    const errorMessages = this.container.querySelectorAll('.validation-error');
    errorMessages.forEach((msg) => msg.remove());

    // Add new error messages
    Object.entries(this.validationErrors).forEach(([fieldId, message]) => {
      // Handle array field IDs by escaping special characters
      const escapedFieldId = fieldId.replace(/[[\].]/g, '\\$&');
      const field = this.container.querySelector(`#${escapedFieldId}`);
      if (field) {
        // Add invalid class to the field
        field.classList.add('invalid');

        // Find or create error container
        let errorContainer = field.parentElement?.querySelector(
          '.validation-error-container'
        );
        if (!errorContainer) {
          errorContainer = document.createElement('div');
          errorContainer.className = 'validation-error-container';
          field.parentElement?.appendChild(errorContainer);
        }

        // Add error message
        const errorMessage = document.createElement('p');
        errorMessage.className = 'validation-error text-red-500 text-sm mt-1';
        errorMessage.textContent = message;
        errorContainer.appendChild(errorMessage);
      }
    });
  }

  private showValidationError(element: HTMLElement, message: string): void {
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error';
    errorElement.textContent = message;
    element.parentElement?.appendChild(errorElement);
    element.classList.add('invalid');
  }

  private clearValidationError(element: HTMLElement): void {
    const existingError =
      element.parentElement?.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }
    element.classList.remove('invalid');
  }

  private setupEventHandlers(component: Component, element: HTMLElement): void {
    if (!component.eventHandlers) return;

    if (component.eventHandlers.onChange) {
      element.addEventListener('change', () =>
        this.handleEvent(component.eventHandlers!.onChange!)
      );
    }

    if (component.eventHandlers.onClick) {
      element.addEventListener('click', () =>
        this.handleEvent(component.eventHandlers!.onClick!)
      );
    }
  }

  private async handleEvent(action: Action): Promise<void> {
    switch (action.type) {
      case 'navigate':
        if (action.targetPage) {
          // Clear previous errors
          this.clearValidationErrors();

          // Validate before navigation
          const isValid = this.validateForm();
          if (!isValid) {
            // Show validation errors
            this.updateValidationErrors();
            // Scroll to first error
            const firstError =
              this.container.querySelector('.validation-error');
            if (firstError) {
              firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
            return;
          }
          this.navigateToPage(action.targetPage);
        }
        break;
      case 'submit':
        // Clear previous errors
        this.clearValidationErrors();

        if (this.validateForm()) {
          this.handleSubmit(action);
        } else {
          // Show validation errors
          this.updateValidationErrors();
          // Scroll to first error
          const firstError = this.container.querySelector('.validation-error');
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        break;
      case 'apiRequest':
        await this.handleApiRequest(action);
        break;
      case 'showMessage':
        if (action.message) {
          alert(action.message);
        }
        break;
    }
  }

  private handleSubmit(action: Action): void {
    const form = this.container.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formDataObj: Record<string, unknown> = {};

    // Handle radio buttons and checkboxes
    form.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
      const radio = input as HTMLInputElement;
      formDataObj[radio.name] = radio.value;
    });

    form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const checkbox = input as HTMLInputElement;
      formDataObj[checkbox.name] = checkbox.checked;
    });

    // Handle other form elements
    form
      .querySelectorAll(
        'input:not([type="radio"]):not([type="checkbox"]), select, textarea'
      )
      .forEach((element) => {
        const input = element as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;
        formDataObj[input.name] = input.value;
      });

    this.formData = formDataObj;

    if (this.onSubmitEvent) {
      this.onSubmitEvent(this.formData);
    }
    if (action.params?.url) {
      fetch(action.params.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.formData),
      });
    }
  }

  private async handleApiRequest(action: Action): Promise<void> {
    if (!action.dataSource) return;

    const dataSource = this._schema.app.dataSources?.find(
      (ds) => ds.id === action.dataSource
    );
    if (!dataSource) return;

    try {
      const response = await fetch(dataSource.url, {
        method: dataSource.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body:
          dataSource.method !== 'GET'
            ? JSON.stringify(action.params)
            : undefined,
      });

      const data = await response.json();
      if (dataSource.responseMapping) {
        // Implement response mapping logic
        console.log('API Response:', data);
      }
    } catch (error) {
      console.error('API request failed:', error);
    }
  }

  private clearValidationErrors(): void {
    // Clear validation errors object
    this.validationErrors = {};

    // Clear all error messages from the DOM
    const errorMessages = this.container.querySelectorAll('.validation-error');
    errorMessages.forEach((msg) => msg.remove());

    // Clear invalid class from all fields
    const invalidFields = this.container.querySelectorAll('.invalid');
    invalidFields.forEach((field) => field.classList.remove('invalid'));
  }

  private getNextPage(): string | null {
    if (!this.currentPage) return null;

    // Check for conditional branches first
    if (this.currentPage.branches) {
      for (const branch of this.currentPage.branches) {
        const fieldValue = this.formData[branch.condition.field];
        const conditionValue = branch.condition.value;
        let conditionMet = false;

        switch (branch.condition.operator) {
          case '==':
            conditionMet = String(fieldValue) === String(conditionValue);
            break;
          case '!=':
            conditionMet = String(fieldValue) !== String(conditionValue);
            break;
          case '>':
            conditionMet = Number(fieldValue) > Number(conditionValue);
            break;
          case '<':
            conditionMet = Number(fieldValue) < Number(conditionValue);
            break;
          case '>=':
            conditionMet = Number(fieldValue) >= Number(conditionValue);
            break;
          case '<=':
            conditionMet = Number(fieldValue) <= Number(conditionValue);
            break;
        }

        if (conditionMet) {
          return branch.nextPage;
        }
      }
    }

    // If no branch conditions are met, use the nextPage field
    return this.currentPage.nextPage || null;
  }

  public handleNext(): void {
    if (!this.currentPage) return;

    // Validate current page before navigation
    if (!this.validateForm()) {
      return;
    }

    const nextPageId = this.getNextPage();
    if (nextPageId) {
      this.navigateToPage(nextPageId);
    } else if (this.currentPage.isEndPage) {
      this.handleFormSubmit();
    }
  }

  public handlePrevious(): void {
    if (this.pageHistory.length > 1) {
      this.pageHistory.pop(); // Remove current page
      const previousPageId = this.pageHistory.pop(); // Get previous page
      if (previousPageId) {
        this.navigateToPage(previousPageId);
      }
    }
  }

  public handleFormSubmit(): void {
    // Get the form element
    const form = this.container.querySelector('form');
    if (!form) return;

    // Create a FormData object
    const formData = new FormData(form as HTMLFormElement);
    const formDataObj: Record<string, unknown> = {};

    // Convert FormData to a plain object
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value;
    }

    // Emit a custom event with the form data
    const submitEvent = new CustomEvent('formSubmit', {
      detail: formDataObj,
      bubbles: true,
    });
    this.container.dispatchEvent(submitEvent);

    if (this.onSubmitEvent) {
      this.onSubmitEvent(formDataObj);
    }
    // If this is the last page, clear the form
    if (this.currentPage?.isEndPage) {
      form.reset();
      this.formData = {};
      this.validationErrors = {};
      this.touchedFields.clear();
    }
  }

  public get schema(): ExtendedFormSchema {
    return this._schema;
  }
}
