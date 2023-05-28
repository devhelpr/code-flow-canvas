import * as babelTypes from '@babel/types';
import { Content } from '../types/content';
import { RunExpressionType } from '../types/run-expression';
import { setAttributes } from './set-attributes';
import { structuredCloneHelper } from './structured-clone';
import { handleChildren } from './handle-children';
import { addToParent } from './add-to-parent';

export const appendChildrenToTemplate = (
  t: typeof babelTypes,
  templateVariableName: string,
  content: Content[]
): babelTypes.Statement[] => {
  const statements: babelTypes.Statement[] = [];
  console.log('appendChildrenToTemplate', templateVariableName, content.length);

  content.forEach((item, childIndex) => {
    const elementId = `${
      templateVariableName !== 'template' ? templateVariableName : ''
    }elementChild_${childIndex}`;

    if (item.isExpression === true && item.expression) {
      //console.log('item.expression', item.tagName, item.expression);
      if (item.runExpression === RunExpressionType.ifCondition) {
        console.log('appendChildrenToTemplate runExpression ifCondition'); //, (item.expression as unknown as babelTypes.JSXElement).children);
        const children = (item.expression as unknown as babelTypes.JSXElement)
          .children;

        const contentChildren: Content[] = handleChildren(
          t,
          item.tagName,
          (item.expression as unknown as babelTypes.JSXElement).children,
          []
        );
        if (children && children.length > 0 && contentChildren.length > 0) {
          const clonedFunction = t.arrowFunctionExpression(
            [],
            children[0] as unknown as babelTypes.JSXElement
          );

          //console.log(JSON.stringify(item, null ,2));
          const testAttribute = item.attributes?.find(
            (attribute) =>
              attribute.type === 'JSXAttribute' &&
              attribute.name?.name === 'test'
          );

          if (!testAttribute) {
            throw new Error('test attribute not found for if:Condition');
          }

          //console.log("ifCondition 'test' attribute", contentChildren);
          if (testAttribute.type !== 'JSXAttribute') {
            throw new Error(
              'Unsupported test attribute type found for if:Condition'
            );
          }
          if (!testAttribute.value) {
            throw new Error('test attribute value not found for if:Condition');
          }
          if (testAttribute.value.type !== 'JSXExpressionContainer') {
            throw new Error(
              `Unsupported test attribute value type found for if:Condition: ${testAttribute.value.type}`
            );
          }
          if (!testAttribute.value.expression) {
            throw new Error(
              'test attribute expression not found for if:Condition'
            );
          }
          if (
            testAttribute.value.expression.type !== 'BinaryExpression' &&
            testAttribute.value.expression.type !== 'LogicalExpression'
          ) {
            throw new Error(
              `Unsupported test attribute value expression type found for if:Condition: ${testAttribute.value.expression.type}`
            );
          }

          //console.log("testAttribute.name.name", testAttribute.name.name);

          const statement = t.ifStatement(
            testAttribute.value.expression,
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(
                  t.arrowFunctionExpression(
                    [],
                    t.callExpression(
                      t.memberExpression(
                        t.identifier(templateVariableName),
                        t.identifier('appendChild')
                      ),
                      [t.callExpression(clonedFunction, [])]
                    )
                  ),
                  []
                )
              ),
            ])
          );
          statements.push(statement);
        }
      } else if (item.runExpression === RunExpressionType.renderList) {
        console.log(
          'appendChildrenToTemplate runExpression renderList',
          templateVariableName
        );

        const contentChildren: Content[] = handleChildren(
          t,
          item.tagName,
          (item.expression as unknown as babelTypes.JSXElement).children,
          []
        );
        if (contentChildren.length > 0) {
          const clonedFunction = structuredCloneHelper(
            contentChildren[0].expression
          ) as babelTypes.ArrowFunctionExpression;

          clonedFunction.params = [t.identifier('item'), t.identifier('index')];

          //console.log(JSON.stringify(item, null ,2));
          const listAttribute = item.attributes?.find(
            (attribute) =>
              attribute.type === 'JSXAttribute' &&
              attribute.name?.name === 'list'
          );

          if (!listAttribute) {
            throw new Error('list attribute not found for list:Render');
          }
          if (listAttribute.type !== 'JSXAttribute') {
            throw new Error(
              'Unsupported list attribute type found for list:Render'
            );
          }
          if (!listAttribute.value) {
            throw new Error('list attribute value not found for list:Render');
          }
          if (listAttribute.value.type !== 'JSXExpressionContainer') {
            throw new Error(
              'Unsupported list attribute value type found for list:Render'
            );
          }
          if (!listAttribute.value.expression) {
            throw new Error(
              'list attribute expression not found for list:Render'
            );
          }
          if (listAttribute.value.expression.type !== 'MemberExpression') {
            throw new Error(
              'Unsupported list attribute expression type found for list:Render'
            );
          }
          if (!listAttribute.value.expression.property) {
            throw new Error(
              'list attribute expression property not found for list:Render'
            );
          }
          if (listAttribute.value.expression.property.type !== 'Identifier') {
            throw new Error(
              'Unsupported list attribute expression property type found for list:Render'
            );
          }
          console.log(
            'listAttribute.value.expression.property.name',
            listAttribute.value.expression.property.name
          );
          const statement = t.callExpression(
            t.memberExpression(
              t.memberExpression(
                t.identifier('props'),
                t.identifier(listAttribute.value.expression.property.name)
              ),
              t.identifier('forEach')
            ),
            [
              t.arrowFunctionExpression(
                [t.identifier('item'), t.identifier('index')],
                t.callExpression(
                  t.memberExpression(
                    t.identifier(templateVariableName),
                    t.identifier('appendChild')
                  ),
                  [
                    t.callExpression(clonedFunction, [
                      t.identifier('item'),
                      t.identifier('index'),
                    ]),
                  ]
                )
              ),
            ]
          );
          statements.push(t.expressionStatement(statement));
        }
      } else {
        statements.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(elementId),
              t.callExpression(
                t.memberExpression(
                  t.identifier('document'),
                  t.identifier('createTextNode')
                ),
                [item.expression] // t.stringLiteral(item.tagName)
              )
            ),
          ])
        );

        addToParent(
          t,
          statements,
          templateVariableName !== 'template',
          templateVariableName,
          elementId
        );

        if (item && item.children && item.children.length > 0) {
          console.log('appendChildrenToTemplate call1');
          const childStatements = appendChildrenToTemplate(
            t,
            elementId,
            item.children
          );
          statements.push(...childStatements);
        }
      }
    } else if (typeof item.content === 'string') {
      if (item.tagName === '') {
        statements.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(elementId),
              t.callExpression(
                t.memberExpression(
                  t.identifier('document'),
                  t.identifier('createTextNode')
                ),
                [t.stringLiteral(item.content)]
              )
            ),
          ])
        );
      } else {
        statements.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(elementId),
              t.callExpression(
                t.memberExpression(
                  t.identifier('document'),
                  t.identifier('createElement')
                ),
                [t.stringLiteral(item.tagName)]
              )
            ),
          ])
        );
        statements.push(...setAttributes(t, elementId, item.attributes));
        if (!item.children || item.children.length === 0) {
          statements.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier(elementId),
                  t.identifier('append')
                ),
                [
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('document'),
                      t.identifier('createTextNode')
                    ),
                    [t.stringLiteral(item.content)]
                  ),
                ]
              )
            )
          );
        }
      }
      addToParent(
        t,
        statements,
        templateVariableName !== 'template',
        templateVariableName,
        elementId
      );

      if (item && item.children && item.children.length > 0) {
        console.log('appendChildrenToTemplate call2');
        const childStatements = appendChildrenToTemplate(
          t,
          elementId,
          item.children
        );
        statements.push(...childStatements);
      }
    } else {
      // create a document fragment to append external components to
      // this will happen during cloning and adding the component to the DOM
      statements.push(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier(elementId),
            t.callExpression(
              t.memberExpression(
                t.identifier('document'),
                t.identifier('createElement')
              ),
              [t.stringLiteral('div')]
            )
          ),
        ])
      );

      addToParent(
        t,
        statements,
        templateVariableName !== 'template',
        templateVariableName,
        elementId
      );
    }
  });
  console.log('appendChildrenToTemplate return', templateVariableName);
  return [...statements];
};
