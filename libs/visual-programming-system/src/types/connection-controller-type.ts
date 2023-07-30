export const ConnectionControllerType = {
  begin: 'begin',
  end: 'end',
  c1: 'c1',
  c2: 'c2',
} as const;

export type ConnectionControllerType =
  (typeof ConnectionControllerType)[keyof typeof ConnectionControllerType];
