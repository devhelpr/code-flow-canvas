export interface TextAreaFieldProps {
    fieldName: string,
    value: string
}

export const  TextAreaField = (props:  TextAreaFieldProps) => (
    <textarea id={props.fieldName} type="text" class="block w-full h-[200px] p-1" name={props.fieldName}>{props.value}</textarea>
);
