import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { StateMachine } from '../state-machine';

export interface NodeInfo {
  taskType?: string;
  compute?: (
    input: any,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => any;
  computeAsync?: (
    input: any,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => Promise<any>;
  initializeCompute?: () => void;
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
  getData?: () => any;
  getDependencies?: () => { startNodeId: string; endNodeId: string }[];
}

//export type NodeInfo = any;
