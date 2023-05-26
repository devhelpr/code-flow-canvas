export interface TextAreaComponentProps {
  onInput: (event: InputEvent) => void;
  onSave: (values : any) => void;
  formElements : string[];
}

export const TextAreaComponent = (props: TextAreaComponentProps) => (
  <div class="w-full p-2">
    <form submit={(event : SubmitEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const form = event.target as HTMLFormElement;
      const values = Object.fromEntries(new FormData(form));
      console.log(values);
      props.onSave({...values});
      return false;
    }}>
      <textarea
        name="textAreaCode"
        id="textAreaCode"
        class="w-full h-[300px] mb-2 p-1 block"
      ></textarea>
      <list:Render list={props.formElements}>
        {(item: string ) => (
          <div class="w-full mb-2">
            <label id={item} class="block">{item}</label>
            <input type="text" class="block p-1" name={item}></input>
          </div>
        )}
      </list:Render>
      <button
        type="submit"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"        
      >Save</button>
    </form>
  </div>
);
