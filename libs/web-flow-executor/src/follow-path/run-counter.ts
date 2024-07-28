import { IRunCounter } from '@devhelpr/visual-programming-system';

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
  runCounterResetHandler: undefined | ((input?: string | any[]) => void) =
    undefined;
  setRunCounterResetHandler(handler: () => void) {
    this.runCounterResetHandler = handler;
  }
  callRunCounterResetHandler() {
    if (this.runCounter <= 0 && this.runCounterResetHandler) {
      this.runCounterResetHandler();
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
