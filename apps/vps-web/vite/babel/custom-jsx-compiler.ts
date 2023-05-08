import * as babelTypes from '@babel/types';
import { NodePath } from '@babel/traverse';

/*
  the process for parsing JSX and creating html nodes:
 
  .. create internal content tree structure
  .. create ast nodes to create template and clone template
  .. create html nodes from template using getFirstChild/nextSibling etc..
  .. create events on html nodes

*/
export type Content = {
  parentId: string;
  index: number;
  tagName: string;
  content: string | babelTypes.JSXElement;
  isExpression?: boolean;
  expression?: babelTypes.Expression;
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[];
  children?: Content[];
};

export type ElementsResult = {
  elementId: string;
  statements: babelTypes.Statement[];
};

export default function (babel: { types: typeof babelTypes }) {
  const t = babel.types as unknown as typeof babelTypes;

  // use https://astexplorer.net/ for AST exploration and generation
  // https://babeljs.io/docs/en/babel-types

  const getAttributes = (
    attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[]
  ) => {
    // needed for Custom Components
    let attributeObject: babelTypes.ObjectExpression | undefined;
    if (attributes) {
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
        }
      });
      attributeObject = t.objectExpression(properties);
    }
    return attributeObject;
  };

  const setAttributes = (
    elementName: string,
    attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[]
  ) => {
    // needed for html elements
    const statements: babelTypes.Statement[] = [];
    if (attributes) {
      attributes.forEach((attribute) => {
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
        } else {
          // TODO : event handlers should be set on the cloned node ... not on the template!!

          if (
            attribute.type === 'JSXAttribute' &&
            attribute.value &&
            attribute.value.type === 'JSXExpressionContainer' &&
            attribute.value.expression &&
            attribute.value.expression.type === 'ArrowFunctionExpression'
          ) {
            statements.push(
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier(elementName),
                    t.identifier('addEventListener')
                  ),
                  [
                    t.stringLiteral(attribute.name.name.toString()),
                    attribute.value.expression,
                  ]
                )
              )
            );
          }
        }
      });
    }
    return statements;
  };

  const appendChildrenToTemplate = (
    index: number,
    templateVariableName: string,
    tagName: string,
    content: Content[]
  ): babelTypes.Statement[] => {
    //console.log(`appendChildrenToTemplate`, content);
    //let elementId = `element_${index}_0`;
    //let parentId = `element${index}`;

    const statements: babelTypes.Statement[] = [];

    const addToParent = (
      addToParentElement: boolean,
      templateVariableName: string,
      elementId: string
    ) => {
      const expressionStatement = t.expressionStatement(
        t.callExpression(
          addToParentElement
            ? t.memberExpression(
                t.identifier(templateVariableName),
                t.identifier('append')
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
    };

    //let lastParentId: string | undefined = undefined;
    //const elements: string[] = [];
    content.forEach((item, childIndex) => {
      // if (!lastParentId || item.parentId !== lastParentId) {
      //   let addToTemplate = false;
      //   if (lastParentId === undefined) {
      //     addToTemplate = true;
      //   } else if (lastParentId === '') {
      //     parentId = elementId;
      //   } else {
      //     parentId = elementId;
      //   }

      //   elementId = `element_${index}_${childIndex}`;

      //   if (elements.indexOf(elementId) === -1) {
      //     const variableDefinition = t.variableDeclaration('const', [
      //       t.variableDeclarator(
      //         t.identifier(elementId),
      //         t.callExpression(
      //           t.memberExpression(
      //             t.identifier('document'),
      //             t.identifier('createElement')
      //           ),
      //           [t.stringLiteral(tagName)]
      //         )
      //       ),
      //     ]);

      //     statements.push(variableDefinition);
      //     elements.push(elementId);
      //   }

      //   // addToParent(
      //   //   !addToTemplate,
      //   //   addToTemplate ? templateVariableName : parentId
      //   // );
      //   addToParent(templateVariableName !== 'template', templateVariableName);

      //   lastParentId = item.parentId;
      // }

      const elementId = `${
        templateVariableName !== 'template' ? templateVariableName : ''
      }elementChild_${childIndex}`;

      if (item.isExpression === true && item.expression) {
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

        statements.push(...setAttributes(elementId, item.attributes));

        // statements.push(
        //   t.expressionStatement(
        //     t.callExpression(
        //       t.memberExpression(
        //         t.identifier(elementId),
        //         t.identifier('append')
        //       ),
        //       [t.identifier(`elementChild${childIndex}`)]
        //     )
        //   )
        // );

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
                  [item.expression]
                ),
              ]
            )
          )
        );
      } else if (typeof item.content === 'string') {
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

        statements.push(...setAttributes(elementId, item.attributes));

        // statements.push(
        //   t.expressionStatement(
        //     t.callExpression(
        //       t.memberExpression(
        //         t.identifier(elementId),
        //         t.identifier('append')
        //       ),
        //       [t.identifier(`elementChild${childIndex}`)]
        //     )
        //   )
        // );

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
        addToParent(
          templateVariableName !== 'template',
          templateVariableName,
          elementId
        );

        if (item && item.children && item.children.length > 0) {
          const childStatements = appendChildrenToTemplate(
            0,
            elementId,
            '',
            item.children
          );
          statements.push(...childStatements);
        }
      } else {
        console.log('item', item.tagName, templateVariableName);
        const attributeObject = getAttributes(item.attributes);
        statements.push(
          t.expressionStatement(
            t.callExpression(
              templateVariableName === 'template'
                ? t.memberExpression(
                    t.memberExpression(
                      t.identifier(templateVariableName),
                      t.identifier('content')
                    ),
                    t.identifier('append')
                  )
                : t.memberExpression(
                    t.identifier(templateVariableName),
                    t.identifier('append')
                  ),
              [
                t.callExpression(
                  t.identifier(item.tagName),
                  attributeObject ? [attributeObject] : []
                ),
              ]
            )
          )
        );
      }
    });

    return [...statements];
  };

  const createTemplateForHtml = (
    blockElements: babelTypes.Statement[] = []
  ) => {
    const documentIdentifier = t.identifier('document');
    const createTemplateIdentifier = t.identifier('createElement');
    const calleeCreateTemplate = t.memberExpression(
      documentIdentifier,
      createTemplateIdentifier
    );
    const callCreateTemplateExpression = t.callExpression(
      calleeCreateTemplate,
      [t.stringLiteral('template')]
    );

    const variableDefinition = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('template'),
        callCreateTemplateExpression
      ),
    ]);

    const callCloneNodeExpression = t.callExpression(
      t.memberExpression(
        t.memberExpression(t.identifier('template'), t.identifier('content')),
        t.identifier('cloneNode')
      ),
      [t.booleanLiteral(true)]
    );
    const variableCloneNodeDefinition = t.variableDeclaration('const', [
      t.variableDeclarator(t.identifier('cloneNode'), callCloneNodeExpression),
    ]);

    const blockStatement = t.blockStatement([
      variableDefinition,
      ...blockElements,
      variableCloneNodeDefinition,
      t.returnStatement(t.identifier('cloneNode')),
    ]);
    return blockStatement;
  };

  const handleChildren = (
    parentId: string,
    children: (
      | babelTypes.JSXElement
      | babelTypes.JSXText
      | babelTypes.JSXExpressionContainer
      | babelTypes.JSXSpreadChild
      | babelTypes.JSXFragment
    )[],
    attributes: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[],
    parent?: babelTypes.JSXElement
  ) => {
    let childIndex = 0;
    const content: Content[] = [];
    children.forEach((item) => {
      if (
        item.type === 'JSXExpressionContainer' &&
        item.expression.type === 'StringLiteral' &&
        item.expression.value &&
        item.expression.value.trim() !== ''
      ) {
        content.push({
          index: childIndex,
          parentId,
          tagName: parent
            ? (
                parent.openingElement
                  .name as unknown as babelTypes.JSXIdentifier
              ).name
            : 'span',
          content: item.expression.value,
          attributes,
        });
        childIndex++;
      } else if (
        item.type === 'JSXText' &&
        item.value &&
        item.value.trim() !== ''
      ) {
        content.push({
          index: childIndex,
          parentId,
          tagName: parent
            ? (
                parent.openingElement
                  .name as unknown as babelTypes.JSXIdentifier
              ).name
            : 'span',
          content: item.value,
          attributes,
        });
        childIndex++;
      } else if (
        item.type === 'JSXExpressionContainer' &&
        item.expression.type !== 'JSXEmptyExpression'
      ) {
        content.push({
          index: childIndex,
          parentId,
          tagName: parent
            ? (
                parent.openingElement
                  .name as unknown as babelTypes.JSXIdentifier
              ).name
            : 'span',
          content: '',
          isExpression: true,
          expression: item.expression,
          attributes,
        });
        childIndex++;
      } else if (item.type === 'JSXElement') {
        const tagName = (
          item.openingElement.name as unknown as babelTypes.JSXIdentifier
        ).name;
        if (tagName[0] === tagName[0].toUpperCase()) {
          content.push({
            index: childIndex,
            parentId,
            tagName,
            content: item,
            attributes: item.openingElement.attributes,
          });
          childIndex++;
        } else if (
          item.children &&
          item.children.length === 1 &&
          item.children[0].type === 'JSXText' &&
          item.children[0].value &&
          item.children[0].value.trim() !== ''
        ) {
          content.push({
            index: childIndex,
            parentId,
            tagName: (
              item.openingElement.name as unknown as babelTypes.JSXIdentifier
            ).name,
            content: item.children[0].value,
            attributes: item.openingElement.attributes,
          });
          childIndex++;
        } else if (item.children.length > 0) {
          /*content.push(
            {
              index: childIndex,
              parentId,
              tagName: (
                item.openingElement.name as unknown as babelTypes.JSXIdentifier
              ).name,
              content: '',
              attributes: item.openingElement.attributes,
            },
            ...handleChildren(
              childIndex,
              parentId + '_',
              item.children,
              item.openingElement.attributes
            )
          );

          */
          content.push({
            index: childIndex,
            parentId,
            tagName: (
              item.openingElement.name as unknown as babelTypes.JSXIdentifier
            ).name,
            content: '',
            attributes: item.openingElement.attributes,
            children: handleChildren(
              parentId + '_',
              item.children,
              item.openingElement.attributes,
              item
            ),
          });
          childIndex++;
        }
      }
    });
    //console.log('content', content);
    return content;
  };

  const handleJSXElement = (path: NodePath<babelTypes.JSXElement>) => {
    const openingElement = path.node.openingElement;
    const tagName = (openingElement.name as unknown as babelTypes.JSXIdentifier)
      .name;

    if (path.node.children && path.node.children.length > 0) {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(
        '',
        path.node.children,
        attributes,
        path.node
      );
      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate(0, 'template', tagName, content);
      blockElements.push(...result);

      return createTemplateForHtml(blockElements);
    } else {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(
        '',
        [path.node],
        attributes,
        path.node
      );
      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate(0, 'template', tagName, content);
      blockElements.push(...result);

      return createTemplateForHtml(blockElements);
    }
  };

  return {
    name: 'custom-jsx-plugin',
    visitor: {
      JSXElement(path: NodePath<babelTypes.JSXElement>) {
        const returnStatement = handleJSXElement(path);
        if (returnStatement) {
          path.replaceWith(returnStatement);
        }
      },
      JSXText(path: NodePath<babelTypes.JSXText>) {
        //console.log('JSXTEXT parsing');
        const text = path.node.value;
        const trimmed = text.trim();
        if (trimmed.length === 0) {
          path.remove();
        } else {
          path.replaceWith(t.stringLiteral(trimmed));
        }
      },
    },
  };
}

/*
    JSXElement where opening tag starts with capital letter	
	divChild.append(externalComponent())
    // callExpression
*/
