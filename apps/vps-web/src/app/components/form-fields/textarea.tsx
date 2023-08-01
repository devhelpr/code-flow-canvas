export interface TextAreaFieldProps {
  fieldName: string;
  value: string;
  onChange?: (value: string) => void;
}

export const TextAreaField = (props: TextAreaFieldProps) => (
  <textarea
    id={props.fieldName}
    type="text"
    class="block w-full h-[200px] p-1"
    name={props.fieldName}
    oninput={(event: InputEvent) => {
      const input = event.target as HTMLInputElement;
      if (props.onChange) {
        props.onChange(input.value);
      }
    }}
  >
    {props.value}
  </textarea>
);
