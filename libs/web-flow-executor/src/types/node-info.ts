import {
  BaseNodeInfo,
  IFlowCanvasBase,
  IConnectionNodeComponent,
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
  getData?: (parameter?: any, scope?: string) => any;
  getDependencies?: () => { startNodeId: string; endNodeId: string }[];
  supportsDecorators?: boolean;

  updateVisual?: (data: any, dataContext?: any) => void;

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
}

//export type NodeInfo = any;
