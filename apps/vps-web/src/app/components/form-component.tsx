import { InputField } from './form-fields/input';
import { TextAreaField } from './form-fields/textarea';

export const FormFieldType = {
  Text: 'Text',
  TextArea: 'TextArea',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export type FormField = {
  fieldName: string;
  value: string;
  fieldType: FormFieldType;
  onChange?: (value: string) => void;
};

export interface FormComponentProps {
  onSave: (values: any) => void;
  formElements: FormField[];
  hasSubmitButton?: boolean;
  id: string;
}

export const FormComponent = (props: FormComponentProps) => (
  <div class="w-full p-2">
    <form
      onsubmit={(event: SubmitEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.target as HTMLFormElement;
        const values = Object.fromEntries(new FormData(form));
        console.log(values);
        props.onSave({ ...values });
        return false;
      }}
    >
      <list:Render list={props.formElements}>
        {(item: FormField) => (
          <div class="w-full mb-2">
            <label for={item.fieldName} class="block mb-2">
              {item.fieldName}
            </label>
            <if:Condition test={item.fieldType === FormFieldType.Text}>
              <div>
                <InputField
                  formId={props.id}
                  fieldName={item.fieldName}
                  value={item.value}
                  onChange={(value: string) => {
                    if (item.onChange) {
                      item.onChange(value);
                    }
                  }}
                ></InputField>
              </div>
            </if:Condition>
            <if:Condition test={item.fieldType === FormFieldType.TextArea}>
              <TextAreaField
                fieldName={item.fieldName}
                value={item.value}
              ></TextAreaField>
            </if:Condition>
            {/*<button
              type="button"
              onclick={() => {
                alert('clicked');
              }}
            >
              CLICK
            </button>*/}
          </div>
        )}
      </list:Render>
      <if:Condition
        test={
          props.hasSubmitButton === undefined || props.hasSubmitButton === true
        }
      >
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save
        </button>
      </if:Condition>
    </form>
  </div>
);
