export interface TextAreaComponentProps {
  onInput: (event: InputEvent) => void;
}

export const TextAreaComponent = (props: TextAreaComponentProps) => (
  <textarea
    id="textAreaCode"
    input={props.onInput}
    class="w-full h-full p-2 outline-none"
  ></textarea>
);
