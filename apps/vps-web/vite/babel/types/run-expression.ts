export const RunExpressionType = {
  renderList: 'Text',
  ifCondition: 'TextArea',
  fragment: 'Fragment',
} as const;
export type RunExpressionType =
  (typeof RunExpressionType)[keyof typeof RunExpressionType];
