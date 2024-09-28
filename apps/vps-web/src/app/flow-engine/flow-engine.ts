import {
  IThumbNodeComponent,
  OnNextNodeFunction,
  IDOMElement,
  IRunCounter,
  IRectNodeComponent,
  createRuntimeFlowContext,
  INodeComponent,
  NodeType,
  FlowNode,
  importToCanvas,
  IFlowCanvasBase,
} from '@devhelpr/visual-programming-system';
import {
  setupCanvasNodeTaskRegistry,
  RunCounter,
  increaseRunIndex,
  NodeInfo,
  runPathFromThumb,
  runPath,
  runPathForNodeConnectionPairs,
  run,
  getNodeTaskFactory,
} from '@devhelpr/web-flow-executor';

export class FlowEngine {
  public canvasApp: IFlowCanvasBase<NodeInfo>;
  constructor() {
    this.canvasApp = createRuntimeFlowContext<NodeInfo>();
  }
  initialize(flow: FlowNode<NodeInfo>[]) {
    if (!this.canvasApp) {
      throw new Error('CanvasAppInstance not initialized');
    }

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
      flow,
      this.canvasApp,
      () => {
        //
      },
      undefined,
      0,
      getNodeTaskFactory
    );

    this.canvasApp.setAnimationFunctions({
      animatePathFunction: this.runFlowPath,
      animatePathFromThumbFunction: this.runPathFromThumbFlow,
      animatePathFromConnectionPairFunction: runPathForNodeConnectionPairs,
    });

    this.canvasApp.elements.forEach((node) => {
      const nodeComponent = node as unknown as INodeComponent<NodeInfo>;
      if (nodeComponent.nodeType !== NodeType.Connection) {
        if (nodeComponent?.nodeInfo?.initializeCompute) {
          nodeComponent.nodeInfo.initializeCompute();
        }
      }
    });
  }
  run(input?: any) {
    return this.runFlow(input);
  }
  private runFlow = (input?: any) => {
    let output: any;
    return new Promise<string>((resolve, _reject) => {
      const runCounter = new RunCounter();
      runCounter.setRunCounterResetHandler(() => {
        if (runCounter.runCounter <= 0) {
          console.log('setRunCounterResetHandler: runCounter.runCounter <= 0');
          increaseRunIndex();
          resolve(output);
        } else {
          console.log(
            'setRunCounterResetHandler: runCounter.runCounter > 0',
            runCounter.runCounter
          );
        }
      });
      run(
        this.canvasApp?.elements,
        this.canvasApp,
        (input) => {
          output = input;
          console.log('run finished', input);
        },
        input,
        undefined,
        undefined,
        runCounter,
        false
      );
    });
  };
  private runPathFromThumbFlow = (
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
      this.canvasApp,
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

  private runFlowPath = (
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
      this.canvasApp,
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
}
