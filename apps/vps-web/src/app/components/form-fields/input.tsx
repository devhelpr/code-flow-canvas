import { trackNamedSignal } from '@devhelpr/visual-programming-system';

export interface InputFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  onChange?: (value: string) => void;
}

export const InputField = (props: InputFieldProps) => {
  let inputRef: HTMLInputElement | null = null;

  trackNamedSignal(`${props.formId}_${props.fieldName}`, (value) => {
    console.log('trackNamedSignal', props.formId, props.fieldName, value);
    if (inputRef) {
      inputRef.value = value;
    }
  });

  return (
    <input
      reference={(reference: HTMLInputElement) => (inputRef = reference)}
      id={props.fieldName}
      type="text"
      class="block w-full p-1"
      name={props.fieldName}
      autocomplete="off"
      value={props.value}
      oninput={(event: InputEvent) => {
        const input = event.target as HTMLInputElement;
        console.log(input.value);
        if (props.onChange) {
          props.onChange(input.value);
        }
      }}
    ></input>
  );
};
