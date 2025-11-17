import {
  BaseNodeInfo,
  IFlowCanvasBase,
  IConnectionNodeComponent,
  IDOMElement,
} from '@devhelpr/visual-programming-system';
import { RunCounter } from '../follow-path/run-counter';
import { StateMachine } from '../state-machine';

export interface NodeInfo extends BaseNodeInfo {
  compute?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter,
    connection?: IConnectionNodeComponent<NodeInfo>
  ) => any;
  computeAsync?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter,
    connection?: IConnectionNodeComponent<NodeInfo>
  ) => Promise<any>;
  canvasAppInstance?: IFlowCanvasBase<NodeInfo>;
  setValue?: ((values: any[]) => void) | ((values: string) => void);
  stateMachine?: StateMachine<NodeInfo>;
  isVariable?: boolean;
  isRunOnStart?: boolean;
  getData?: (parameter?: any, scope?: string) => any;
  getDependencies?: () => { startNodeId: string; endNodeId: string }[];
  supportsDecorators?: boolean;

  updateVisual?: (
    data: any,
    dataContext?: any,
    scopeId?: string | undefined
  ) => void;
  updatesVisualAfterCompute?: boolean;

  initializeOnStartFlow?: boolean;
  isUINode?: boolean;

  getFormattedMessageValue?: (value: any) => any;

  compileInfo?: {
    getCode?: (
      input: any,
      loopIndex?: number,
      payload?: any,
      thumbName?: string,
      scopeId?: string,
      runCounter?: RunCounter
    ) => string;
    getGlobalCode?: () => string;
  };

  getSettingsPopup?: (popupContainer: HTMLElement) => IDOMElement;
  shouldNotSendOutputFromWorkerToMainThread?: boolean;

  offscreenCanvas?: OffscreenCanvas;

  backpropagate?: (
    data: any,
    fromNode?: any,
    fromConnection?: IConnectionNodeComponent<NodeInfo>
  ) => void;
}

//export type NodeInfo = any;
