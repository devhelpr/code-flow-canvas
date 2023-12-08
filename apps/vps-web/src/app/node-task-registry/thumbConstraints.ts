export const thumbConstraints = {
  value: 'value',
  array: 'array',
  object: 'object',
  number: 'number',
  string: 'string',
  set: 'set',
  range: 'range',
} as const;
// export type ThumbConstraints =
//   (typeof thumbConstraints)[keyof typeof thumbConstraints];
