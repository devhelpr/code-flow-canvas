import * as babelTypes from '@babel/types';

export const setAttributes = (
  t: typeof babelTypes,
  elementName: string,
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[]
) => {
  // needed for html elements
  const statements: babelTypes.Statement[] = [];
  if (attributes) {
    //console.log('attributes SET', attributes);
    attributes.forEach((attribute) => {
      // TODO handle value type 'JSXExpressionContainer' (expression)
      if (
        attribute.type === 'JSXAttribute' &&
        attribute.value &&
        attribute.value.type === 'StringLiteral' &&
        attribute.value.value
      ) {
        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(elementName),
                t.identifier('setAttribute')
              ),
              [
                t.stringLiteral(attribute.name.name.toString()),
                t.stringLiteral(attribute.value.value),
              ]
            )
          )
        );
      } else if (
        attribute.type === 'JSXAttribute' &&
        attribute.value &&
        attribute.value.type === 'JSXExpressionContainer' &&
        attribute.value.expression &&
        !attribute.name.name.toString().startsWith('on') &&
        (attribute.value.expression.type === 'ArrowFunctionExpression' ||
          attribute.value.expression.type === 'ArrayExpression' ||
          attribute.value.expression.type === 'Identifier' ||
          attribute.value.expression.type === 'TemplateLiteral' ||
          attribute.value.expression.type === 'ConditionalExpression' ||
          attribute.value.expression.type === 'BinaryExpression')
      ) {
        // TODO .. set these on the clone nodes..?
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
                t.identifier('setAttribute')
              ),
              [
                t.stringLiteral(attribute.name.name.toString()),
                attribute.value.expression,
              ]
            )
          )
        );
      } else {
        console.log('Unhandled attribute found');
      }
    });
  }
  return statements;
};
