import {
  createJSXElement,
  renderElement,
} from '@devhelpr/visual-programming-system';

// export const DebugInfo = () => {
//   return <div></div>;
// };

export class DebugInfoController {
  debugElement: HTMLElement | undefined;
  constructor(rootElement: HTMLElement) {
    renderElement(
      <div
        class={`fixed top-0 right-0 z-[50000] bg-white text-black p-2 border border-gray-300`}
        getElement={(element: HTMLElement) => {
          this.debugElement = element;
        }}
      ></div>,
      rootElement
    );
  }

  sendDebugInfo(debugInfo: Record<string, boolean | number | string>) {
    if (this.debugElement) {
      this.debugElement.innerHTML = '';
      renderElement(
        <div>
          {Object.keys(debugInfo).map((key) => {
            return (
              <div>
                {key}: {debugInfo[key]}
              </div>
            );
          })}
        </div>,
        this.debugElement
      );
    }
  }
}
