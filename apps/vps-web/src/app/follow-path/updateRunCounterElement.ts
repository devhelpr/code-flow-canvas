import { RunCounter } from './run-counter';
import { nodeAnimationMap } from './animate-path';

let runCounterUpdateElement: undefined | HTMLElement = undefined;
export const setRunCounterUpdateElement = (domElement: HTMLElement) => {
  runCounterUpdateElement = domElement;
};
export const updateRunCounterElement = (runCounter: RunCounter) => {
  if (runCounterUpdateElement) {
    runCounterUpdateElement.textContent = `${runCounter.runCounter.toString()} / ${nodeAnimationMap.size.toString()}`;
  }
};
