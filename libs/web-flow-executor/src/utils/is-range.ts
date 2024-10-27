import { RangeValueType } from '../types/value-type';

export const isInputOfRangeValueType = (input: RangeValueType) => {
  if (typeof input === 'object' && input) {
    return (
      input.min !== undefined &&
      input.max !== undefined &&
      typeof input.min === 'number' &&
      typeof input.max === 'number' &&
      ((typeof input.step === 'number' && !isNaN(input.step)) ||
        typeof input.step === 'undefined') &&
      !isNaN(input.min) &&
      !isNaN(input.max)
    );
  }
  return false;
};
