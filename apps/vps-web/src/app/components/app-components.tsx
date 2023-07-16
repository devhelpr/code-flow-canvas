export interface AppComponentsProps {
  setExecutionPath: (value: number) => void;
}

//  <_:_>fragment</_:_>
// <div data-test="app-components">
//   </div>

export const AppComponents = (props: AppComponentsProps) => (
  <element:Fragment>
    <div class="fixed w-[50px] h-[calc(100%-135px)] top-[60px] right-0 left-auto z-50 p-2 bg-slate-400">
      <input
        id="execution-path"
        name="execution-path"
        type="range"
        class="w-full h-full vertical-slider accent-blue-500"
        orient="vertical"
        min="0"
        max="100"
        step="1"
        value="0"
        oninput={(event: InputEvent) => {
          const value = parseInt((event.target as HTMLInputElement).value);
          if (!isNaN(value)) {
            props.setExecutionPath(value);
          }
        }}
      ></input>
    </div>
  </element:Fragment>
);
