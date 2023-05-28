export interface InputFieldProps {
  fieldName: string;
  value: string;
  onChange?: (value: string) => void;
}

export const InputField = (props: InputFieldProps) => (
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
