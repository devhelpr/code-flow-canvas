import {
  createEffect as createTestEffect,
  createNamedSignal,
  createSignal,
} from '@devhelpr/visual-programming-system';

export interface InputFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  onChange?: (value: string) => void;
}

export const InputField = (props: InputFieldProps) => {
  const [value, setValue] = createSignal(props.value);
  const [currentValue, setCurrentValue] = createNamedSignal(
    props.formId,
    props.value
  );
  createTestEffect(() => {
    console.log('createTestEffect', currentValue());
  });

  return (
    <input
      id={props.fieldName}
      type="text"
      class="block w-full p-1"
      name={props.fieldName}
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
