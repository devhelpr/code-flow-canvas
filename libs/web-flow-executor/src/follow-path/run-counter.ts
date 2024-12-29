import {
  INodeComponent,
  IRunCounter,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export class RunCounter implements IRunCounter {
  constructor() {
    this.runId = crypto.randomUUID();
  }
  runId: string;
  runCounter = 0;
  incrementRunCounter() {
    this.runCounter++;
  }
  decrementRunCounter() {
    this.runCounter--;
  }
  resetRunCounter() {
    this.runCounter = 0;
  }
  runCounterResetHandler:
    | undefined
    | ((input?: string | any[], node?: INodeComponent<NodeInfo>) => void) =
    undefined;
  setRunCounterResetHandler(handler: () => void) {
    this.runCounterResetHandler = handler;
  }
  callRunCounterResetHandler(output?: any, node?: INodeComponent<NodeInfo>) {
    if (this.runCounter <= 0 && this.runCounterResetHandler) {
      this.runCounterResetHandler(output, node);
    }
  }

  callstack: string[] = [];
  pushCallstack(nodeId: string) {
    if (this.callstack.indexOf(nodeId) !== -1) {
      return false;
    }
    return this.callstack.push(nodeId);
  }
}
