// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createJSXElement } from '@devhelpr/visual-programming-system';

export const TestComponent = () => {
  return (
    <div>
      Hello Test Component
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        click={(event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          alert('Hello World!');
          return false;
        }}
      >
        Click Me
      </button>
    </div>
  );
};
