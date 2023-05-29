import * as babelTypes from '@babel/types';
import { Content } from '../types/content';
import { RunExpressionType } from '../types/run-expression';
import { getAttributes } from './get-attributes';
import { setEventAttributes } from './set-event-attributes';

export const createElementReferences = (
  t: typeof babelTypes,
  parentId: string,
  content: Content[]
) => {
  const elementReferenceBlocks: babelTypes.Statement[] = [];
  let previousElement: babelTypes.Identifier | undefined = undefined;

  if (parentId !== 'template') {
    previousElement = t.identifier(parentId);
  }

  const effectList: any[] = [];
  const replaceList: any[] = [];
  content.forEach((item, index) => {
    if (
      item.isExpression &&
      item.runExpression === RunExpressionType.ifCondition
    ) {
      //
    } else if (
      item.isExpression &&
      item.runExpression === RunExpressionType.renderList
    ) {
      const elementReferenceName =
        (parentId === 'template' ? 'e' : parentId) + '_' + item.index;
      const elementReferenceIdentifier = t.identifier(elementReferenceName);

      const elementReference = t.variableDeclaration('let', [
        // let e_0_1 = undefined;
        t.variableDeclarator(
          elementReferenceIdentifier,
          t.identifier('undefined')
        ),
      ]);
      elementReferenceBlocks.push(elementReference);

      const listAttribute = item.attributes?.find(
        (attribute) =>
          attribute.type === 'JSXAttribute' && attribute.name?.name === 'list'
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
        throw new Error('list attribute expression not found for list:Render');
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
      const forEachStatement = t.callExpression(
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
            t.blockStatement([
              t.ifStatement(
                t.binaryExpression(
                  '===',
                  elementReferenceIdentifier,
                  t.identifier('undefined')
                ),
                t.blockStatement(
                  // if
                  [
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        elementReferenceIdentifier,
                        previousElement
                          ? t.memberExpression(
                              previousElement,
                              index === 0
                                ? t.identifier('firstChild')
                                : t.identifier('nextSibling')
                            )
                          : t.identifier('cloneNode')
                      )
                    ),
                  ]
                ),
                t.blockStatement(
                  // else
                  [
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        elementReferenceIdentifier,
                        t.memberExpression(
                          elementReferenceIdentifier,
                          t.identifier('nextSibling')
                        )
                      )
                    ),
                  ]
                )
              ),
            ])
          ),
        ]
      );
      elementReferenceBlocks.push(t.expressionStatement(forEachStatement));

      previousElement = elementReferenceIdentifier;
    } else {
      const elementReferenceName =
        (parentId === 'template' ? 'e' : parentId) + '_' + item.index;
      const elementReferenceIdentifier = t.identifier(elementReferenceName);
      const elementReference = t.variableDeclaration('const', [
        t.variableDeclarator(
          elementReferenceIdentifier,
          previousElement
            ? t.memberExpression(
                previousElement,
                index === 0
                  ? t.identifier('firstChild')
                  : t.identifier('nextSibling')
              )
            : t.identifier('cloneNode')
        ),
      ]);
      elementReferenceBlocks.push(elementReference);

      let addEventAttributes = true;
      if (item.isExpression) {
        if (!item.runExpression) {
          effectList.push({
            id: parentId,
            expression: item.expression,
          });
        }
      } else if (!item.isExpression && typeof item.content !== 'string') {
        // if component contains another component ..
        //   .. then appendChild it to the cloned node instead of to the template...
        //   (the template contains a documet fragment)

        addEventAttributes = false;
        const attributeObject = getAttributes(t, item.attributes, true);

        replaceList.push({
          id: elementReferenceName,
          statement: t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.memberExpression(
                  t.identifier(elementReferenceName),
                  t.identifier('parentNode')
                ),
                t.identifier('replaceChild')
              ),
              [
                t.callExpression(
                  t.identifier(item.tagName),
                  attributeObject ? [attributeObject] : []
                ),
                t.identifier(elementReferenceName),
              ]
            )
          ),
        });
      }
      if (addEventAttributes) {
        elementReferenceBlocks.push(
          ...setEventAttributes(t, elementReferenceName, item.attributes)
        );
      }

      if (item.children && item.children.length > 0) {
        elementReferenceBlocks.push(
          ...createElementReferences(t, elementReferenceName, item.children)
        );
      }
      previousElement = elementReferenceIdentifier;
    }
  });
  replaceList.forEach((item) => {
    elementReferenceBlocks.push(item.statement);
  });
  effectList.forEach((item) => {
    elementReferenceBlocks.push(
      t.expressionStatement(
        t.callExpression(t.identifier('createEffect'), [
          t.arrowFunctionExpression(
            [],
            t.assignmentExpression(
              '=',
              t.memberExpression(
                t.identifier(item.id),
                t.identifier('textContent')
              ),
              item.expression
            )
          ),
        ])
      )
    );
  });
  return elementReferenceBlocks;
};
