export const LineType = {
  BezierCubic: 'BezierCubic',
  BezierQuadratic: 'BezierQuadratic',
  Straight: 'Straight',
} as const;

export type LineType = (typeof LineType)[keyof typeof LineType];
