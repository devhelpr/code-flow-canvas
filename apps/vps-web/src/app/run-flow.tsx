import {
  FlowNode,
  IDOMElement,
  IRectNodeComponent,
  IRunCounter,
  IThumbNodeComponent,
  OnNextNodeFunction,
  createContextInstanceApp,
  createJSXElement,
  importToCanvas,
  renderElement,
} from '@devhelpr/visual-programming-system';
import {
  NodeInfo,
  RunCounter,
  getNodeTaskFactory,
  increaseRunIndex,
  run,
  runPath,
  runPathForNodeConnectionPairs,
  runPathFromThumb,
  setupCanvasNodeTaskRegistry,
} from '@devhelpr/web-flow-executor';
import flowData from '../example-data/counter.json';

export const runFlow = () => {
  const canvasApp = createContextInstanceApp<NodeInfo>();
  document.body
    .querySelectorAll('div:not(.run-flow-container)')
    .forEach((el) => {
      el.remove();
    });
  const rootElement = document.getElementById('run-flow-container')!;
  let resultElement: HTMLDivElement | undefined = undefined;
  renderElement(
    <div>
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        click={() => {
          runFlow();
        }}
      >
        Click to increase counter
      </button>
      <div
        getElement={(element: HTMLDivElement) => (resultElement = element)}
      ></div>
    </div>,
    rootElement
  );

  const runPathFromThumbFlow = (
    node: IThumbNodeComponent<NodeInfo>,
    color: string,
    onNextNode?: OnNextNodeFunction<NodeInfo>,
    onStopped?: (input: string | any[], scopeId?: string) => void,
    input?: string | any[],
    followPathByName?: string,
    animatedNodes?: {
      node1?: IDOMElement;
      node2?: IDOMElement;
      node3?: IDOMElement;
      cursorOnly?: boolean;
    },
    offsetX?: number,
    offsetY?: number,
    followPathToEndThumb?: boolean,
    singleStep?: boolean,
    scopeId?: string,
    runCounter?: IRunCounter
  ) => {
    return runPathFromThumb(
      canvasApp,
      node,
      color,
      onNextNode,
      onStopped,
      input,
      followPathByName,
      animatedNodes,
      offsetX,
      offsetY,
      followPathToEndThumb,
      singleStep,
      scopeId,
      runCounter
    );
  };

  const runFlowPath = (
    node: IRectNodeComponent<NodeInfo>,
    color: string,
    onNextNode?: OnNextNodeFunction<NodeInfo>,
    onStopped?: (input: string | any[]) => void,
    input?: string | any[],
    followPathByName?: string, // normal, success, failure, "subflow",
    animatedNodes?: {
      node1?: IDOMElement;
      node2?: IDOMElement;
      node3?: IDOMElement;
    },
    offsetX?: number,
    offsetY?: number,
    followPathToEndThumb?: boolean,
    singleStep?: boolean,
    followThumb?: string,
    scopeId?: string,
    runCounter?: IRunCounter
  ) => {
    return runPath(
      canvasApp,
      node,
      color,
      onNextNode,
      onStopped,
      input,
      followPathByName,
      animatedNodes,
      offsetX,
      offsetY,
      followPathToEndThumb,
      singleStep,
      followThumb,
      scopeId,
      runCounter
    );
  };

  setupCanvasNodeTaskRegistry(() => {
    const runCounter = new RunCounter();
    runCounter.setRunCounterResetHandler(() => {
      if (runCounter.runCounter <= 0) {
        console.log('setRunCounterResetHandler: runCounter.runCounter <= 0');
        increaseRunIndex();
      } else {
        console.log(
          'setRunCounterResetHandler: runCounter.runCounter > 0',
          runCounter.runCounter
        );
      }
    });
    return runCounter;
  });

  importToCanvas(
    flowData.flows.flow.nodes as FlowNode<NodeInfo>[],
    canvasApp,
    () => {
      //
    },
    undefined,
    0,
    getNodeTaskFactory
  );

  canvasApp.setAnimationFunctions({
    animatePathFunction: runFlowPath,
    animatePathFromThumbFunction: runPathFromThumbFlow,
    animatePathFromConnectionPairFunction: runPathForNodeConnectionPairs,
  });

  const runCounter = new RunCounter();
  runCounter.setRunCounterResetHandler(() => {
    if (runCounter.runCounter <= 0) {
      console.log('setRunCounterResetHandler: runCounter.runCounter <= 0');
      increaseRunIndex();
    } else {
      console.log(
        'setRunCounterResetHandler: runCounter.runCounter > 0',
        runCounter.runCounter
      );
    }
  });

  //let startAgain = true;
  function runFlow() {
    run(
      canvasApp?.elements,
      canvasApp,
      (input) => {
        console.log('run finished', input);
        if (resultElement) {
          const element = resultElement as HTMLDivElement;
          element.textContent = `counter: ${input.toString()}`;
        }
        //   if (startAgain) {
        //     startAgain = false;
        //     run(
        //       canvasApp?.elements,
        //       canvasApp,
        //       () => {
        //         //
        //       },
        //       undefined,
        //       undefined,
        //       undefined,
        //       runCounter,
        //       false
        //     );
        //   }
      },
      undefined,
      undefined,
      undefined,
      runCounter,
      false
    );
  }
  runFlow();
  return;
};
