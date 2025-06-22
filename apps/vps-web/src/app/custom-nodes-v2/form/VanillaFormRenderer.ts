import { IFlowCanvasBase } from '@devhelpr/visual-programming-system';
import { VanillaFormCore } from './VanillaFormCore';
import { ExtendedFormSchema } from './VanillaFormCore';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export function initFormGenerator(
  schema: ExtendedFormSchema,
  container: HTMLElement,
  onSubmit: ((data: any) => void) | undefined = undefined,
  payload: any = {},
  canvasAppInstance: IFlowCanvasBase<NodeInfo>,
  scopeId?: string | undefined
): void {
  const formRenderer = new VanillaFormRenderer(
    schema,
    container,
    payload,
    canvasAppInstance,
    scopeId
  );
  formRenderer.init(onSubmit);
}

export class VanillaFormRenderer {
  private formCore: VanillaFormCore;
  private container: HTMLElement;
  private currentStep = 0;
  private totalSteps: number;
  // private canvasAppInstance: IFlowCanvasBase<NodeInfo>;
  // private scopeId: string | undefined;
  // @ts-expect-error payload is written but not read.. this will be used later
  private payload: any;
  constructor(
    schema: ExtendedFormSchema,
    containerElement: HTMLElement,
    payload: any = {},
    canvasAppInstance: IFlowCanvasBase<NodeInfo>,
    scopeId?: string | undefined
  ) {
    this.payload = payload;
    this.formCore = new VanillaFormCore(
      schema,
      containerElement,
      payload,
      canvasAppInstance,
      scopeId
    );
    this.container = containerElement;
    this.totalSteps = schema.app.pages.length;
    // this.canvasAppInstance = canvasAppInstance;
    // this.scopeId = scopeId;
  }

  onSubmit: ((data: any) => void) | undefined;
  public init(onSubmit: ((data: any) => void) | undefined): void {
    this.onSubmit = onSubmit;
    this.formCore.init(onSubmit);
    this.renderFormControls();
  }

  private renderFormControls(): void {
    this.renderStepIndicator();
    this.renderNavigationControls();
    this.setupEventListeners();
  }

  private renderStepIndicator(): void {
    if (
      this.formCore.currentPage?.hasStepIndicator !== undefined &&
      !this.formCore.currentPage?.hasStepIndicator
    ) {
      return;
    }
    const indicator = document.createElement('div');
    indicator.className = 'flex justify-center items-center space-x-2 mb-6';

    for (let i = 0; i < this.totalSteps; i++) {
      const step = document.createElement('div');
      step.className = `flex items-center ${
        i === this.currentStep ? 'text-blue-600' : 'text-gray-400'
      }`;

      // Step number
      const number = document.createElement('div');
      number.className = `w-6 h-6 rounded-full flex items-center justify-center text-sm ${
        i === this.currentStep
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-600'
      }`;
      number.textContent = (i + 1).toString();
      step.appendChild(number);

      // Step connector (except for last step)
      if (i < this.totalSteps - 1) {
        const connector = document.createElement('div');
        connector.className = `w-8 h-0.5 ${
          i === this.currentStep ? 'bg-blue-600' : 'bg-gray-200'
        }`;
        step.appendChild(connector);
      }

      indicator.appendChild(step);
    }

    this.container.insertBefore(indicator, this.container.firstChild);
  }

  private renderNavigationControls(): void {
    if (
      this.formCore.currentPage?.hasSubmitButtons !== undefined &&
      !this.formCore.currentPage?.hasSubmitButtons
    ) {
      return;
    }
    const controls = document.createElement('div');
    controls.className = 'flex justify-between items-center mt-6';

    const backButton = document.createElement('button');
    backButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
      this.currentStep === 0
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
    }`;
    backButton.textContent = 'Back';
    backButton.disabled = this.currentStep === 0;
    backButton.addEventListener('click', () => this.handlePrevious());

    const nextButton = document.createElement('button');
    nextButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
      this.currentStep === this.totalSteps - 1
        ? 'bg-green-600 text-white hover:bg-green-700'
        : 'bg-blue-600 text-white hover:bg-blue-700'
    }`;
    nextButton.textContent =
      this.currentStep === this.totalSteps - 1 ? 'Submit' : 'Next';
    nextButton.addEventListener('click', () => this.handleNext());

    controls.appendChild(backButton);
    controls.appendChild(nextButton);
    this.container.appendChild(controls);
  }

  private submitHandler(event: Event): void {
    const customEvent = event as CustomEvent;
    console.log('Form submitted with data:', customEvent.detail);
  }

  private setupEventListeners(): void {
    // Listen for form submission events
    this.container.removeEventListener('formSubmit', this.submitHandler);
    this.container.addEventListener('formSubmit', this.submitHandler);
  }

  private handlePrevious(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.formCore.handlePrevious();
      this.renderFormControls();
      this.updateNavigationControls();
    }
  }

  private handleNext(): void {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.formCore.handleNext();
      this.renderFormControls();
      this.updateNavigationControls();
    } else if (this.currentStep === this.totalSteps - 1) {
      // Submit the form
      //const formData = this.formCore.getFormData();
      // if (this.onSubmit) {
      //   this.onSubmit({});
      // }
      this.formCore.handleNext();
    }
  }

  private updateNavigationControls(): void {
    const backButton = this.container.querySelector(
      '.back-button'
    ) as HTMLButtonElement;
    const nextButton = this.container.querySelector(
      '.next-button'
    ) as HTMLButtonElement;

    if (backButton) {
      backButton.disabled = this.currentStep === 0;
      backButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
        this.currentStep === 0
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`;
    }

    if (nextButton) {
      nextButton.textContent =
        this.currentStep === this.totalSteps - 1 ? 'Submit' : 'Next';
      nextButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
        this.currentStep === this.totalSteps - 1
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`;
    }

    // Update step indicator
    const steps = this.container.querySelectorAll('.step');
    steps.forEach((step, index) => {
      step.classList.toggle('text-blue-600', index === this.currentStep);
      step.classList.toggle('text-gray-400', index !== this.currentStep);
      const number = step.querySelector('div');
      if (number) {
        number.classList.toggle(
          'bg-blue-600 text-white',
          index === this.currentStep
        );
        number.classList.toggle(
          'bg-gray-200 text-gray-600',
          index !== this.currentStep
        );
      }
      const connector = step.querySelector('div:last-child');
      if (connector) {
        connector.classList.toggle('bg-blue-600', index === this.currentStep);
        connector.classList.toggle('bg-gray-200', index !== this.currentStep);
      }
    });
  }
}
