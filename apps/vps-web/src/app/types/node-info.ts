import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { StateMachine } from '../state-machine';

export interface INodeDecorator {
  taskType: string;
  formValues?: any;
  executeOrder?: 'before' | 'after';
  decoratorNode?: {
    nodeInfo: {
      compute?: (
        input: any,
        pathExecution?: RunNodeResult<NodeInfo>[],
        loopIndex?: number,
        payload?: any,
        thumbName?: string,
        scopeId?: string
      ) => any;
      initializeCompute?: () => void;
    };
  };
}

export interface NodeInfo {
  taskType?: string;
  compute?: (
    input: any,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => any;
  computeAsync?: (
    input: any,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => Promise<any>;
  initializeCompute?: () => void;
  showFormOnlyInPopup?: boolean;
  formElements?: any[];
  canvasAppInstance?: CanvasAppInstance<NodeInfo>;
  delete?: () => void;
  formValues?: any;
  type?: string;
  setValue?: ((values: any[]) => void) | ((values: string) => void);
  stateMachine?: StateMachine<NodeInfo>;
  isVariable?: boolean;
  sendData?: (
    input: any,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => any;
  getData?: (parameter?: any, scope?: string) => any;
  getDependencies?: () => { startNodeId: string; endNodeId: string }[];
  supportsDecorators?: boolean;
  decorators?: INodeDecorator[];
  initializeOnStartFlow?: boolean;
}

//export type NodeInfo = any;
