import * as babelTypes from '@babel/types';
import { RunExpressionType } from './run-expression';

export type Content = {
  parentId: string;
  index: number;
  tagName: string;
  content: string | babelTypes.JSXElement;
  isExpression?: boolean;
  runExpression?: RunExpressionType;
  expression?: babelTypes.Expression;
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[];
  children?: Content[];
};
