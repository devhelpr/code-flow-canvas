export const LineType = {
  BezierCubic: 'BezierCubic',
  BezierQuadratic: 'BezierQuadratic',
} as const;

export type LineType = (typeof LineType)[keyof typeof LineType];
