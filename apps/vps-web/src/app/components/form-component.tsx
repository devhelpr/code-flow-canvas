import { InputField } from "./form-fields/input";
import { TextAreaField } from "./form-fields/textarea";

export const FormFieldType = {
  Text: 'Text',
  TextArea: 'TextArea',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export type FormField = {
  fieldName: string,
  value: string,
  fieldType: FormFieldType
};

export interface FormComponentProps {
  onInput: (event: InputEvent) => void;
  onSave: (values : any) => void;
  formElements : FormField[];
}

export const FormComponent = (props: FormComponentProps) => (
  <div class="w-full p-2">
    <form onsubmit={(event : SubmitEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const form = event.target as HTMLFormElement;
      const values = Object.fromEntries(new FormData(form));
      console.log(values);
      props.onSave({...values});
      return false;
    }}>      
      <list:Render list={props.formElements}>
        {(item: FormField ) => (
          <div class="w-full mb-2">
            <label for={item.fieldName} class="block">{item.fieldName}</label>
            <if:Condition test={item.fieldType===FormFieldType.Text}>
              <div>
                <InputField fieldName={item.fieldName} value={item.value}></InputField>
                <div>Hello div</div>
              </div>
            </if:Condition>
            <if:Condition test={item.fieldType===FormFieldType.TextArea}>
              <TextAreaField fieldName={item.fieldName} value={item.value}></TextAreaField>
            </if:Condition>
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
