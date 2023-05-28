export const RunExpressionType = {
  renderList: 'Text',
  ifCondition: 'TextArea',
} as const;
export type RunExpressionType =
  (typeof RunExpressionType)[keyof typeof RunExpressionType];
