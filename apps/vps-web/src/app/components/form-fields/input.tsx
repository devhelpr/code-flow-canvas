export interface InputFieldProps {
    fieldName: string,
    value: string
}

export const InputField = (props: InputFieldProps) => (
    <input id={props.fieldName} type="text" class="block w-full p-1" name={props.fieldName} value={props.value}></input>
);
