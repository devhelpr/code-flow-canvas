import { trackNamedSignal } from '@devhelpr/visual-programming-system';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  formId: string;
  fieldName: string;
  value: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export const SelectField = (props: SelectFieldProps) => {
  //let selectRef: HTMLInputElement | null = null;

  trackNamedSignal(`${props.formId}_${props.fieldName}`, (value) => {
    console.log('trackNamedSignal', props.formId, props.fieldName, value);
    // if (selectRef) {
    //   selectRef.value = value;
    // }
  });

  // return (
  //   <select
  //     reference={(reference: HTMLInputElement) => (selectRef = reference)}
  //     id={props.fieldName}
  //     class="block w-full p-1"
  //     name={props.fieldName}
  //     autocomplete="off"
  //     value={props.value}
  //     oninput={(event: InputEvent) => {
  //       const select = event.target as HTMLInputElement;
  //       console.log(select.value);
  //       if (props.onChange) {
  //         props.onChange(select.value);
  //       }
  //     }}
  //   >
  //     <list:Render list={props.options}>
  //       {(item: SelectOption) => (
  //         <option value={item.value} selected={item.value === props.value}>
  //           {item.label}
  //         </option>
  //       )}
  //     </list:Render>
  //   </select>
  // );
};
