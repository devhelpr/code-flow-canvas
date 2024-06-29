import {
  FlowNode,
  IDOMElement,
  IRectNodeComponent,
  IRunCounter,
  IThumbNodeComponent,
  OnNextNodeFunction,
  createContextInstanceApp,
  importToCanvas,
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

  run(
    canvasApp?.elements,
    canvasApp,
    (input) => {
      console.log('run finished', input);
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
  return;
};
