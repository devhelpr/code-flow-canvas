import * as babelTypes from '@babel/types';

export const setEventAttributes = (
  t: typeof babelTypes,
  elementName: string,
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[]
) => {
  const statements: babelTypes.Statement[] = [];
  if (attributes) {
    attributes.forEach((attribute) => {
      if (
        attribute.type === 'JSXAttribute' &&
        attribute.value &&
        attribute.value.type === 'JSXExpressionContainer' &&
        attribute.value.expression &&
        (attribute.value.expression.type === 'ArrowFunctionExpression' ||
          attribute.value.expression.type === 'MemberExpression')
      ) {
        // console.log(
        //   'attribute.value.expression',
        //   attribute.value.expression.type,
        //   attribute.value.expression
        // );
        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(elementName),
                attribute.name.name.toString().startsWith('on')
                  ? t.identifier('addEventListener')
                  : t.identifier('setAttribute')
              ),
              [
                t.stringLiteral(
                  attribute.name.name.toString().startsWith('on')
                    ? attribute.name.name.toString().slice(2)
                    : attribute.name.name.toString()
                ),
                attribute.value.expression,
              ]
            )
          )
        );
      }
    });
  }
  return statements;
};
