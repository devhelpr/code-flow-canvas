import { TestComponent } from './components/test-component';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
//import { createJSXElement } from '@devhelpr/visual-programming-system';
const AnotherComponent = () => {
  return <div>Another Component text</div>;
};
export const TestApp = () => (
  <div className="hello">
    <p>paragraaf</p>
    <div class="parent">
      Test
      <h1 class="strong text-xl font-bold">Hello JSX!</h1>
      <p>lorem ipsum</p>
      <TestComponent test="hello test property" />
      <AnotherComponent />
    </div>
    <AnotherComponent />
    <h2 class="strong text-lg font-bold">TEST H2</h2>
  </div>
);
/*

 <h1>Hello JSX!</h1>
    <TestComponent />

  <div>  
    <div className="hello">
    <p>paragraaf</p>
    <div>
      Test
      <h1 class="strong text-lg font-bold">Hello JSX!</h1>
      <p>lorem ipsum</p>
      <TestComponent test="hello test property" />
      <AnotherComponent />
    </div>
  </div>
    */
