import { TestComponent } from './components/test-component';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createJSXElement } from '@devhelpr/visual-programming-system';

export const TestApp = () => (
  <div className="hello">
    <h1>Hello JSX!</h1>
    <TestComponent />
  </div>
);
