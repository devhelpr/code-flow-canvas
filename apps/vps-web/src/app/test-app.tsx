import { TestComponent } from './components/test-component';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
//import { createJSXElement } from '@devhelpr/visual-programming-system';

export const TestApp = () => (
  <div className="hello">
    <p>paragraaf</p>
    <div>
      Test
      <h1>Hello JSX!</h1>
      <p>lorem ipsum</p>
      <TestComponent />
    </div>
  </div>
);
/*

 <h1>Hello JSX!</h1>
    <TestComponent />
    */
