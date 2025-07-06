import {
  createJSXElement,
  FlowNode,
  IComputeResult,
  IRectNodeComponent,
  Rect,
  IFlowCanvasBase,
  FormField,
  InitialValues,
  IRunCounter,
  IConnectionNodeComponent,
} from '@devhelpr/visual-programming-system';
import { FlowEngine, NodeInfo, RunCounter } from '@devhelpr/web-flow-executor';

export type CreateRunCounterContext = (
  isRunViaRunButton: boolean,
  shouldResetConnectionSlider: boolean,
  onFlowFinished?: () => void
) => RunCounter;

export class BaseRectNode {
  nodeRenderElement: HTMLElement | undefined = undefined;
  rectElement: HTMLElement | undefined = undefined;
  canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  id: string;
  node: IRectNodeComponent<NodeInfo> | undefined = undefined;
  updated: () => void;

  rectInstance: Rect<NodeInfo> | undefined;

  createRunCounterContext: CreateRunCounterContext | undefined = undefined;

  static readonly nodeTypeName: string = 'rect-node';
  static readonly nodeTitle: string = 'Rect node';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static getFormFields:
    | ((
        getNode: () => IRectNodeComponent<NodeInfo>,
        updated: () => void,
        values?: InitialValues
      ) => FormField[])
    | undefined = undefined;

  static readonly disableManualResize: boolean = true;
  flowEngine: FlowEngine | undefined = undefined;
  constructor(
    id: string,
    updated: () => void,
    node: IRectNodeComponent<NodeInfo>,
    flowEngine?: FlowEngine
  ) {
    this.id = id;
    this.updated = updated;
    this.node = node;
    this.flowEngine = flowEngine;
  }

  initNode(_node: IRectNodeComponent<NodeInfo>, _flowEngine?: FlowEngine) {
    //
  }

  destroy() {
    //
  }

  updateVisual:
    | ((data: any, scopeId?: string | undefined) => void)
    | undefined = undefined;

  initializeCompute: (() => void) | undefined = undefined;

  compute = (
    input: unknown,
    _loopIndex?: number,
    _payload?: unknown,
    _portName?: string,
    _scopeId?: string,
    _runCounter?: IRunCounter,
    _connection?: IConnectionNodeComponent<NodeInfo>
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      resolve({
        result: input,
        output: input,
        followPath: undefined,
      });
    });
  };

  childElementSelector = '.child-node-wrapper > textarea';
  render(_node: FlowNode<NodeInfo>) {
    return <div></div>;
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
  setSize = (width: number, height: number) => {
    //
  };
}
