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
  Composition,
  importCompositions,
} from '@devhelpr/visual-programming-system';
import { RunCounter } from '../follow-path/run-counter';
import {
  runPathForNodeConnectionPairs,
  runPathFromThumb,
  runPath,
} from '../follow-path/run-path';
import {
  setupCanvasNodeTaskRegistry,
  getNodeTaskFactory,
  registerCompositionNodes,
} from '../node-task-registry/canvas-node-task-registry';
import { NodeInfo } from '../types/node-info';
import { increaseRunIndex, runNode, run } from './flow-engine';

export class RuntimeFlowEngine {
  public canvasApp: IFlowCanvasBase<NodeInfo>;
  constructor() {
    this.canvasApp = createRuntimeFlowContext<NodeInfo>();
  }
  initialize(
    flow: FlowNode<NodeInfo>[],
    compositions?: Record<string, Composition<NodeInfo>>
  ) {
    if (!this.canvasApp) {
      throw new Error('CanvasAppInstance not initialized');
    }

    setupCanvasNodeTaskRegistry(() => {
      const runCounter = new RunCounter();
      runCounter.setRunCounterResetHandler(() => {
        if (runCounter.runCounter <= 0) {
          increaseRunIndex();
        }
      });
      return runCounter;
    });
    if (compositions) {
      importCompositions<NodeInfo>(compositions, this.canvasApp);
      registerCompositionNodes(this.canvasApp.compositons.getAllCompositions());
    }
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
  destroy() {
    this.canvasApp?.destoyCanvasApp();
    this.canvasApp?.canvas?.domElement.remove();
    //     this.rootElement?.remove();
    //     this.canvasApp = undefined;
    //     this.rootElement = undefined;
  }
  run(input?: any) {
    return this.runFlow(input);
  }
  runNode(nodeId: string, input?: any) {
    const node = this.canvasApp.elements.get(
      nodeId
    ) as INodeComponent<NodeInfo>;

    if (!node) {
      throw new Error(`Node not found ${nodeId}`);
    }
    if (node.nodeType === NodeType.Shape) {
      return new Promise<any>((resolve) => {
        const runCounter = new RunCounter();
        let output: any;
        runCounter.setRunCounterResetHandler(() => {
          if (runCounter.runCounter <= 0) {
            increaseRunIndex();
            resolve(output);
          }
        });
        runNode(
          node as IRectNodeComponent<NodeInfo>,
          this.canvasApp,
          (input) => {
            output = input;
          },
          input,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          runCounter,
          undefined,
          {
            trigger: true,
          }
        );
      });
    }
    throw new Error(`Invalid node type ${nodeId} - ${node.nodeType}`);
  }
  private runFlow = (input?: any) => {
    return new Promise<any>((resolve) => {
      this.canvasApp?.elements.forEach((node) => {
        if (node && node.nodeInfo && node.nodeInfo.initializeOnStartFlow) {
          node.nodeInfo?.initializeCompute?.();
        }
      });
      const runCounter = new RunCounter();
      let output: any;

      runCounter.setRunCounterResetHandler(() => {
        if (runCounter.runCounter <= 0) {
          increaseRunIndex();
          resolve(output);
        }
      });
      run(
        this.canvasApp?.elements,
        this.canvasApp,
        (input) => {
          output = input;
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
