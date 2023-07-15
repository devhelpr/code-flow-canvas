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
        attribute.name.name.toString() === 'reference'
      ) {
        console.log('reference attribute', attribute);

        if (
          attribute.value &&
          attribute.value.type === 'JSXExpressionContainer' &&
          attribute.value.expression &&
          attribute.value.expression.type === 'ArrowFunctionExpression'
        ) {
          statements.push(
            t.expressionStatement(
              t.callExpression(attribute.value.expression, [
                t.identifier(elementName),
              ])
            )
          );
        } else if (
          attribute.value &&
          attribute.value.type === 'JSXExpressionContainer' &&
          attribute.value.expression &&
          attribute.value.expression.type === 'Identifier'
        ) {
          statements.push(
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.identifier(attribute.value.expression.name),
                t.identifier(elementName)
              )
            )
          );
          return;
        }
      }

      if (
        attribute.type === 'JSXAttribute' &&
        attribute.value &&
        attribute.value.type === 'JSXExpressionContainer' &&
        attribute.value.expression &&
        (attribute.value.expression.type === 'ArrowFunctionExpression' ||
          attribute.value.expression.type === 'MemberExpression' ||
          attribute.value.expression.type === 'ConditionalExpression')
      ) {
        if (attribute.value.expression.type === 'ConditionalExpression') {
          console.log(
            'attribute.value.expression',
            attribute.value.expression.type,
            attribute.value.expression
          );
        }
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
