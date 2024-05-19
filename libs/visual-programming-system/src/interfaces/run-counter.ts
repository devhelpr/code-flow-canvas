export interface IRunCounter {
  runCounter: number;
  incrementRunCounter: () => void;
  decrementRunCounter: () => void;
  resetRunCounter: () => void;
  runCounterResetHandler: undefined | ((input?: string | any[]) => void);
  callRunCounterResetHandler: () => void;
  pushCallstack: (nodeId: string) => boolean | number;
}
