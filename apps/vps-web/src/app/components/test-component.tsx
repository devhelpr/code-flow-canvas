// eslint-disable-next-line @typescript-eslint/no-unused-vars
//import { createJSXElement } from '@devhelpr/visual-programming-system';
import { getCount, setCount } from '@devhelpr/visual-programming-system';

function Add(a: number, b: number) {
  return a + b;
}

export interface TestComponentProps {
  list: { test: string }[];
}

export const TestComponent = (props: TestComponentProps) => {
  console.log('TestComponent constructor');
  return (
    <div>
      Hello Test Component
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onclick={(event: MouseEvent) => {
          console.log('click TestComponent');
          ///event.preventDefault();
          //event.stopPropagation();
          //alert('Hello World!');

          setCount(getCount() + 1);

          return false;
        }}
      >
        Click Me
      </button>
      <div>{2 + 3 * Add(1, 6)}</div>
      <div>{getCount()}</div>
      <ul>
        <list:Render list={props.list}>
          {(item: { test: string }) => (
            <div>
              <div>
                <li>{item.test}</li>
              </div>
            </div>
          )}
        </list:Render>
      </ul>
    </div>
  );
};
