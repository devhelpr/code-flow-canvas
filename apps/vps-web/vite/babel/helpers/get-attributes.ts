import * as babelTypes from '@babel/types';

export const getAttributes = (
  t: typeof babelTypes,
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[],
  passThroughAttributes?: boolean
) => {
  const supportedExpressionTypes = ['ArrayExpression', 'MemberExpression'];

  if (passThroughAttributes) {
    supportedExpressionTypes.push('ArrowFunctionExpression');
  }
  // needed for Custom Components
  let attributeObject: babelTypes.ObjectExpression | undefined;
  if (attributes) {
    // TODO handle value type 'JSXExpressionContainer' (expression)
    //console.log('attributes', attributes);
    const properties: babelTypes.ObjectProperty[] = [];
    attributes.forEach((attribute) => {
      if (
        attribute.type === 'JSXAttribute' &&
        attribute.value &&
        attribute.value.type === 'StringLiteral' &&
        attribute.value.value
      ) {
        properties.push(
          t.objectProperty(
            t.identifier(attribute.name.name.toString()),
            t.stringLiteral(attribute.value.value.toString())
          )
        );
      } else if (
        attribute.type === 'JSXAttribute' &&
        attribute.value &&
        attribute.value.type === 'JSXExpressionContainer' &&
        attribute.value.expression &&
        supportedExpressionTypes.indexOf(attribute.value.expression.type) >= 0
      ) {
        properties.push(
          t.objectProperty(
            t.identifier(attribute.name.name.toString()),
            attribute.value.expression as unknown as babelTypes.Expression
          )
        );
      }
    });
    attributeObject = t.objectExpression(properties);
  }
  return attributeObject;
};
