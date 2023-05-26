export interface TextAreaComponentProps {
  onInput: (event: InputEvent) => void;
  formElements : string[];
}

export const TextAreaComponent = (props: TextAreaComponentProps) => (
  <div class="w-full p-2">
    <textarea
      id="textAreaCode"
      input={props.onInput}
      class="w-full h-[300px] mb-2 p-1 block"
    ></textarea>
    <list:Render list={props.formElements}>
      {(item: string ) => (
        <div class="w-full mb-2">
          <label class="block">{item}</label>
          <input type="text" class="block p-1" name={item}></input>
        </div>
      )}
    </list:Render>
  </div>
);
