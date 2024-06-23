import {
  BaseComponent,
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { BaseFormFieldProps, FormFieldComponent } from './field';
import { trackNamedSignal } from '../../reactivity';

export interface SliderFieldProps extends BaseFormFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  isRow?: boolean;
  isLast?: boolean;

  onChange?: (value: string) => void;
  onGetSettings: () => {
    min: number;
    max: number;
    step: number;
  };
  onStoreSettings: (settings: {
    min: number;
    max: number;
    step: number;
  }) => void;
}

export class SliderFieldChildComponent extends FormFieldComponent<SliderFieldProps> {
  oldProps: SliderFieldProps | null = null;
  input: HTMLInputElement | null = null;
  label: HTMLLabelElement | null = null;
  parametersWrapper: HTMLDivElement | null = null;
  minLabel: HTMLSpanElement | null = null;
  minInput: HTMLInputElement | null = null;
  valueLabel: HTMLSpanElement | null = null;
  stepLabel: HTMLSpanElement | null = null;
  stepInput: HTMLInputElement | null = null;
  maxLabel: HTMLSpanElement | null = null;
  maxInput: HTMLInputElement | null = null;
  doRenderChildren = false;
  initialRender = false;
  min = 0.1;
  max = 100;
  step = 0.1;
  constructor(parent: BaseComponent | null, props: SliderFieldProps) {
    super(parent, props);
    this.fieldName = props.fieldName;

    const { min, max, step } = props.onGetSettings?.() ?? {
      min: props.min ?? 0.1,
      max: props.max ?? 100,
      step: props.step ?? 0.1,
    };
    this.min = min ?? 0.1;
    this.max = max ?? 100;
    this.step = step ?? 0.1;
    this.template = createTemplate(
      `<div class="slider-container w-full ${props.isLast ? '' : 'mb-2'} ${
        props.isRow ? 'flex' : ''
      }">
        <label for="${props.formId}_${props.fieldName}" class="block  mb-10 ${
        props.settings?.showLabel === false ? 'hidden' : ''
      } 
      ${props.settings?.textLabelColor ?? 'text-white'} ${
        props.isRow ? 'mr-2' : ''
      }">${props.label ?? props.fieldName}</label>
        <input class="block w-full py-1 text-white accent-white slider"
          name="${props.formId}_${props.fieldName}"      
          id="${props.formId}_${props.fieldName}"
          value="${props.value ?? 0}"
          min="${this.min}"
          max="${this.max}"
          step="${this.step}"
          type="range"></input>
          <div class="flex w-full justify-center relative h-[18px]">
            <button class="absolute left-0 text-xs cursor-pointer">${
              this.min
            }</button>
            <input id=${props.formId}_${props.fieldName}_min" name="${
        props.formId
      }_${
        props.fieldName
      }_min" class="absolute left-0 text-xs w-[40px] appearance-none hidden"></input>
            <span class="slider-value-bubble text-sm absolute text-center origin-center px-2 -top-[50px] left-0 -translate-x-1/2 bg-white rounded text-black">${
              props.value || '0'
            }</span>
            <button class="absolute text-xs cursor-pointer">${
              this.step
            }</button>
            <input id="${props.formId}_${props.fieldName}_step" name="${
        props.formId
      }_${
        props.fieldName
      }_step" class="text-xs w-[40px] appearance-none hidden"></input>
            <button class="absolute right-0 text-xs cursor-pointer">${
              this.max
            }</button>
            <input id="${props.formId}_${props.fieldName}_max" name="${
        props.formId
      }_${
        props.fieldName
      }_max" class="absolute right-0 text-xs w-[40px] appearance-none hidden"></input>
          </div>
          <div class="flex w-full justify-center relative h-[18px]">
            <label class="absolute left-0 text-xs" for=${props.formId}_${
        props.fieldName
      }_min">min</label>
            <label class="absolute text-xs" for="${props.formId}_${
        props.fieldName
      }_step">step</label>
            <label class="absolute right-0 text-xs" for="${props.formId}_${
        props.fieldName
      }_max">max</label>
          </div>
        </div>`
    );

    this.mount();
  }

  override mount() {
    super.mount();

    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.renderList = [];
      this.element = createElementFromTemplate(this.template);
      if (this.element) {
        this.element.remove();
        this.label = this.element.firstChild as HTMLLabelElement;
        this.input = this.label.nextSibling as HTMLInputElement;

        this.parametersWrapper = this.input.nextSibling as HTMLDivElement;

        this.minLabel = this.parametersWrapper.firstChild as HTMLSpanElement;
        this.minInput = this.minLabel.nextSibling as HTMLInputElement;
        this.valueLabel = this.minInput.nextSibling as HTMLSpanElement;
        this.stepLabel = this.valueLabel.nextSibling as HTMLSpanElement;
        this.stepInput = this.stepLabel.nextSibling as HTMLInputElement;
        this.maxLabel = this.stepInput.nextSibling as HTMLSpanElement;
        this.maxInput = this.maxLabel.nextSibling as HTMLInputElement;

        this.renderList.push(this.label, this.input, this.parametersWrapper);

        const value = Number(this.valueLabel.textContent || '0') || 0;
        const min = this.min;
        const max = this.max;
        const newVal = Number(((value - min) * 100) / (max - min));

        this.valueLabel.style.left = `calc(${newVal}% + ${
          8 - newVal * 0.15
        }px)`;

        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('pointerdown', (event: PointerEvent) => {
          event.stopPropagation();
        });

        this.minLabel.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          if (this.minInput) {
            this.minInput.value = this.input?.min ?? '0.1';
            this.minLabel?.classList.add('hidden');
            this.minInput?.classList.remove('hidden');
            this.minInput?.focus();
          }
          return false;
        });

        const setMin = () => {
          if (this.minInput && this.minLabel && this.input) {
            this.minLabel.textContent = this.minInput.value;
            this.input.min = this.minInput.value;
            this.min = parseFloat(this.minInput.value);

            this.minInput.blur();
            this.minInput.classList.add('hidden');
            this.minLabel.classList.remove('hidden');
            this.props.onStoreSettings({
              min: this.min,
              max: this.max,
              step: this.step,
            });
          }
        };
        this.minInput.addEventListener('keydown', (event: Event) => {
          if ((event as KeyboardEvent).key === 'Enter') {
            event.stopPropagation();
            setMin();
          }
          return false;
        });

        this.minInput.addEventListener('blur', (_event: Event) => {
          setMin();
        });

        this.stepLabel.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          if (this.stepInput) {
            this.stepInput.value = this.input?.step ?? '0.1';
            this.stepLabel?.classList.add('hidden');
            this.stepInput?.classList.remove('hidden');
            this.stepInput?.focus();
          }
          return false;
        });

        const setStep = () => {
          if (this.input && this.stepInput && this.stepLabel) {
            this.stepLabel.textContent = this.stepInput.value;
            this.input.step = this.stepInput.value;
            this.step = parseFloat(this.stepInput.value);

            this.stepInput.blur();
            this.stepInput.classList.add('hidden');
            this.stepLabel.classList.remove('hidden');
            this.props.onStoreSettings({
              min: this.min,
              max: this.max,
              step: this.step,
            });
          }
        };

        this.stepInput.addEventListener('keydown', (event: Event) => {
          if ((event as KeyboardEvent).key === 'Enter') {
            event.stopPropagation();
            setStep();
          }
          return false;
        });

        this.stepInput.addEventListener('blur', (_event: Event) => {
          setStep();
        });

        this.maxLabel.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          if (this.maxInput) {
            this.maxInput.value = this.input?.max ?? '100';
            this.maxLabel?.classList.add('hidden');
            this.maxInput?.classList.remove('hidden');
            this.maxInput?.focus();
          }
          return false;
        });

        const setMax = () => {
          if (this.maxInput && this.maxLabel && this.input) {
            this.maxLabel.textContent = this.maxInput.value;
            this.input.max = this.maxInput.value;

            this.max = parseFloat(this.maxInput.value);

            this.maxInput.classList.add('hidden');
            this.maxLabel.classList.remove('hidden');
            this.maxInput.blur();
            this.props.onStoreSettings({
              min: this.min,
              max: this.max,
              step: this.step,
            });
          }
        };

        this.maxInput.addEventListener('keydown', (event: Event) => {
          if ((event as KeyboardEvent).key === 'Enter') {
            event.stopPropagation();
            setMax();
          }
          return false;
        });

        this.maxInput.addEventListener('blur', (_event: Event) => {
          setMax();
        });

        trackNamedSignal(
          `${this.props.formId}_${this.props.fieldName}`,
          (value) => {
            console.log(
              'trackNamedSignal',
              this.props.formId,
              this.props.fieldName,
              value
            );
            if (this.input) {
              this.input.value = value;
            }
          }
        );
      }
    }
    this.isMounted = true;
  }
  override unmount() {
    super.unmount();
    if (this.element && this.element.remove) {
      // remove only removes the connection between parent and node
      this.element.remove();
    }
    this.isMounted = false;
  }

  onInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    // console.log(input.value);
    if (this.valueLabel) {
      this.valueLabel.textContent = input.value;
      const value = Number(input.value);

      const min = this.min;
      const max = this.max;
      const newVal = Number(((value - min) * 100) / (max - min));

      this.valueLabel.style.left = `calc(${newVal}% + ${8 - newVal * 0.15}px)`;
    }
    if (this.props.onChange) {
      this.props.onChange(input.value);
    }
  };
  override render() {
    super.render();
    if (!this.element) return;
    if (!this.input) return;

    this.oldProps = this.props;

    if (this.initialRender) {
      this.initialRender = false;
      this.renderElements([this.input]);
    }
  }
}
