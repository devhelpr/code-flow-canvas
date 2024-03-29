import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { StateMachine } from '../state-machine';
import { BaseNodeInfo } from './base-node-info';
import { RunCounter } from '../follow-path/run-counter';

export interface NodeInfo extends BaseNodeInfo {
  compute?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => any;
  computeAsync?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => Promise<any>;
  canvasAppInstance?: CanvasAppInstance<NodeInfo>;
  setValue?: ((values: any[]) => void) | ((values: string) => void);
  stateMachine?: StateMachine<NodeInfo>;
  isVariable?: boolean;
  getData?: (parameter?: any, scope?: string) => any;
  getDependencies?: () => { startNodeId: string; endNodeId: string }[];
  supportsDecorators?: boolean;

  initializeOnStartFlow?: boolean;
  isUINode?: boolean;
}

//export type NodeInfo = any;
