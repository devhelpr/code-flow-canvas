import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { StateMachine } from '../state-machine';
import { BaseNodeInfo } from './base-node-info';

export interface NodeInfo extends BaseNodeInfo {
  compute?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => any;
  computeAsync?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => Promise<any>;
  canvasAppInstance?: CanvasAppInstance<NodeInfo>;
  setValue?: ((values: any[]) => void) | ((values: string) => void);
  stateMachine?: StateMachine<NodeInfo>;
  isVariable?: boolean;
  sendData?: (input: any, loopIndex?: number, payload?: any) => any;
  getData?: (parameter?: any, scope?: string) => any;
  getDependencies?: () => { startNodeId: string; endNodeId: string }[];
  supportsDecorators?: boolean;

  initializeOnStartFlow?: boolean;
}

//export type NodeInfo = any;
