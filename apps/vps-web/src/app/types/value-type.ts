export type ValueType<T> = {
  type: string;
  value: T;
};

export type RangeValueType = {
  min: undefined | number;
  max: undefined | number;
  step: undefined | number;
};
