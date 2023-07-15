// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppComponentsProps {
  //
}

//  <_:_>fragment</_:_>

export const AppComponents = (props: AppComponentsProps) => (
  <div data-test="app-components">
    <element:Fragment>
      <div>fragment</div>
    </element:Fragment>
  </div>
);
