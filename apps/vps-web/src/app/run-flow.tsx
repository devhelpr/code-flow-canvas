import {
  createJSXElement,
  renderElement,
} from '@devhelpr/visual-programming-system';
import { RuntimeFlowEngine } from './flow-engine/flow-engine';
import { flow } from './test-flows/celsius-fahrenheit';
import { flow as fetchFlow } from '../tests/flows/map-flow';
function clearBody() {
  document.body
    .querySelectorAll('div:not(.run-flow-container)')
    .forEach((el) => {
      el.remove();
    });
}

export const runFlow = () => {
  clearBody();
  const flowEngine = new RuntimeFlowEngine();
  flowEngine.initialize(flow.flows.flow.nodes);

  const rootElement = document.getElementById('run-flow-container')!;
  //let resultElement: HTMLDivElement | undefined = undefined;
  let celciusElement: HTMLInputElement | undefined = undefined;
  let fahrenheitElement: HTMLInputElement | undefined = undefined;

  flowEngine.canvasApp.setOnNodeMessage((key, value) => {
    console.log('onNodeMessage', key, value);
    if (key === 'celsius') {
      if (celciusElement) {
        celciusElement.value = value;
      }
    }
    if (key === 'fahrenheit') {
      if (fahrenheitElement) {
        fahrenheitElement.value = value;
      }
    }
  });

  renderElement(
    <div class="w-[clamp(240px,100%,1024px)] mx-auto">
      <div
      // getElement={(element: HTMLDivElement) => (resultElement = element)}
      ></div>
      <div class="flex flex-col">
        <label>Celcius</label>
        <input
          getElement={(element: HTMLInputElement) => {
            celciusElement = element;
          }}
          class="border border-solid border-black "
          name="celsius"
          input={(event: InputEvent) => {
            const input = event.target as HTMLInputElement;
            console.log('celsius input', input.value);
            flowEngine.canvasApp.sendMessageToNode('celsius', input.value);
          }}
        />
        <label>Fahrenheit</label>
        <input
          getElement={(element: HTMLInputElement) => {
            fahrenheitElement = element;
          }}
          class="border border-solid border-black"
          name="fahrenheit"
          input={(event: InputEvent) => {
            const input = event.target as HTMLInputElement;
            console.log('fahrenheit input', input.value);
            flowEngine.canvasApp.sendMessageToNode('fahrenheit', input.value);
          }}
        />
      </div>
      <button
        click={() => {
          const flowEngine = new RuntimeFlowEngine();
          const outputs: Record<string, any> = {};
          flowEngine.canvasApp.setOnNodeMessage(
            (key: string, inputValue: string) => {
              console.log('output', inputValue);
              outputs[key] = inputValue;
            }
          );

          flowEngine.initialize(fetchFlow.flows.flow.nodes);
          flowEngine.run().then((result) => {
            console.log('result', result, outputs);
          });
        }}
      >
        test fetch
      </button>
    </div>,
    rootElement
  );

  flowEngine.run();

  return;
};
