import { INodeComponent } from '.';
import { BaseNodeInfo } from '../types/base-node-info';

export interface IRunCounter {
  runCounter: number;
  incrementRunCounter: () => void;
  decrementRunCounter: () => void;
  resetRunCounter: () => void;
  setRunCounterResetHandler(handler: () => void): void;
  runCounterResetHandler:
    | undefined
    | ((input?: string | any[], node?: INodeComponent<BaseNodeInfo>) => void);
  callRunCounterResetHandler: () => void;
  pushCallstack: (nodeId: string) => false | number;
  runId: string;
  callstack: string[];
}
