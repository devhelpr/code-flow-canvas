export class RunCounter {
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
}
