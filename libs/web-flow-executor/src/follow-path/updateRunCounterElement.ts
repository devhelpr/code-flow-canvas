//import { nodeAnimationMap } from './animate-path';
import { IRunCounter } from '@devhelpr/visual-programming-system';

let runCounterUpdateElement: undefined | HTMLElement = undefined;
export const setRunCounterUpdateElement = (domElement: HTMLElement) => {
  runCounterUpdateElement = domElement;
};
export const updateRunCounterElement = (runCounter: IRunCounter) => {
  if (runCounterUpdateElement) {
    //runCounterUpdateElement.textContent = `${runCounter.runCounter.toString()} / ${nodeAnimationMap.size.toString()}`;
    //runCounterUpdateElement.textContent = `${runCounter.runCounter.toString()} / ${nodeAnimationMap.size.toString()}`;

    runCounterUpdateElement.textContent = `${runCounter.runCounter.toString()}`;
  }
};
