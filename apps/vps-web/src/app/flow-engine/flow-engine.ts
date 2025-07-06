import { CreateRunCounterContext } from '@devhelpr/app-canvas';
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
  IComputeResult,
  IConnectionNodeComponent,
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
  runNode,
  RegisterNodeFactoryFunction,
  FlowEngine,
} from '@devhelpr/web-flow-executor';

export class RuntimeFlowEngine {
  public canvasApp: IFlowCanvasBase<NodeInfo, FlowEngine>;
  constructor() {
    this.canvasApp = createRuntimeFlowContext<NodeInfo>();
  }
  onSendUpdateToNode:
    | undefined
    | ((data: any, node: IRectNodeComponent<NodeInfo>) => void);
  initialize(
    flow: FlowNode<NodeInfo>[],
    registerExternalNodes?: (
      registerNodeFactory: RegisterNodeFactoryFunction,
      createRunCounterContext: CreateRunCounterContext,
      flowEngine?: FlowEngine
    ) => void,
    flowEngine?: FlowEngine
  ) {
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
    }, registerExternalNodes);

    importToCanvas(
      flow,
      this.canvasApp,
      () => {
        //
      },
      undefined,
      0,
      getNodeTaskFactory,
      undefined,
      flowEngine
    );

    this.canvasApp.setAnimationFunctions({
      animatePathFunction: this.runFlowPath,
      animatePathFromThumbFunction: this.runPathFromThumbFlow,
      animatePathFromConnectionPairFunction: runPathForNodeConnectionPairs,
    });

    console.log('runtime flow engine initialized', this.canvasApp.elements);

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
    console.log(
      ' this.onSendUpdateToNode',
      this.onSendUpdateToNode !== undefined,
      this.onSendUpdateToNode
    );
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
      console.log('run flow', run);
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
        false,
        undefined,
        (data, node) => {
          console.log('onSendUpdateToNode', data, node);
          this.onSendUpdateToNode?.(data, node);
        }
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

  public runNode = (
    node: IRectNodeComponent<NodeInfo>,

    onStopped?: (input: string | any[], scopeId?: string) => void,
    input?: string,
    offsetX?: number,
    offsetY?: number,
    loopIndex?: number,
    connection?: IConnectionNodeComponent<NodeInfo>,
    scopeId?: string,
    runCounter?: RunCounter,
    shouldClearExecutionHistory = false,
    inputPayload?: any,
    useThumbName?: string,
    computeAsync?: (
      node: IRectNodeComponent<NodeInfo>,
      input: string | any[],
      loopIndex?: number,
      payload?: any,
      thumbName?: string,
      scopeId?: string,
      runCounter?: RunCounter,
      connection?: IConnectionNodeComponent<NodeInfo>
    ) => Promise<IComputeResult>,
    sendOutputToNode?: (
      data: any,
      node: IRectNodeComponent<NodeInfo>,
      scopeId: string | undefined
    ) => void
  ): void => {
    runNode(
      node,
      this.canvasApp,
      onStopped,
      input,
      offsetX,
      offsetY,
      loopIndex,
      connection,
      scopeId,
      runCounter,
      shouldClearExecutionHistory,
      inputPayload,
      useThumbName,
      computeAsync,
      sendOutputToNode
    );
  };
}
