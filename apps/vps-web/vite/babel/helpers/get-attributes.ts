import * as babelTypes from '@babel/types';

export const getAttributes = (
  t: typeof babelTypes,
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[]
) => {
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
        (attribute.value.expression.type === 'ArrayExpression' ||
          attribute.value.expression.type === 'MemberExpression')
      ) {
        properties.push(
          t.objectProperty(
            t.identifier(attribute.name.name.toString()),
            attribute.value.expression
          )
        );
      }
      // handle
    });
    attributeObject = t.objectExpression(properties);
  }
  return attributeObject;
};
