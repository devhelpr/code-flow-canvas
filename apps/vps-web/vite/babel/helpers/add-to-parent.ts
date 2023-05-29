import * as babelTypes from '@babel/types';

export const addToParent = (
  t: typeof babelTypes,
  statements: babelTypes.Statement[],
  addToParentElement: boolean,
  templateVariableName: string,
  elementId: string
) => {
  if (templateVariableName !== 'template' && addToParentElement) {
    const expressionStatement = t.expressionStatement(
      t.callExpression(
        addToParentElement
          ? t.memberExpression(
              t.identifier(templateVariableName),
              t.identifier('appendChild')
            )
          : t.memberExpression(
              t.memberExpression(
                t.identifier(templateVariableName),
                t.identifier('content')
              ),
              t.identifier('append')
            ),
        [t.identifier(elementId)]
      )
    );
    statements.push(expressionStatement);
  }
};
