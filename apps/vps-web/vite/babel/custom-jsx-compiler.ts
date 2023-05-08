import * as babelTypes from '@babel/types';
import { NodePath } from '@babel/traverse';

export type Content = {
  parentId: string;
  index: number;
  tagName: string;
  content: string | babelTypes.JSXElement;
  isExpression?: boolean;
  expression?: babelTypes.Expression;
  attributes?: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[];
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
  ): ElementsResult => {
    //console.log(`appendChildrenToTemplate`, content);
    let elementId = `element_${index}_0`;
    let parentId = `element${index}`;

    const statements: babelTypes.Statement[] = [];

    const addToParent = (
      addToParentElement: boolean,
      templateVariableName: string
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

    let lastParentId: string | undefined = undefined;
    const elements: string[] = [];
    content.forEach((item, childIndex) => {
      if (!lastParentId || item.parentId !== lastParentId) {
        let addToTemplate = false;
        if (lastParentId === undefined) {
          addToTemplate = true;
        } else if (lastParentId === '') {
          parentId = elementId;
        } else {
          // this is not a new parent but a new child for the previous rendered element (childIndex - 1)
          // .. so what should we do here?

          parentId = elementId;
        }

        elementId = `element_${index}_${childIndex}`;

        if (elements.indexOf(elementId) === -1) {
          const variableDefinition = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(elementId),
              t.callExpression(
                t.memberExpression(
                  t.identifier('document'),
                  t.identifier('createElement')
                ),
                [t.stringLiteral(tagName)]
              )
            ),
          ]);

          statements.push(variableDefinition);
          elements.push(elementId);
        }

        addToParent(
          !addToTemplate,
          addToTemplate ? templateVariableName : parentId
        );

        lastParentId = item.parentId;
      }

      if (item.isExpression === true && item.expression) {
        statements.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(`elementChild${childIndex}`),
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

        statements.push(
          ...setAttributes(`elementChild${childIndex}`, item.attributes)
        );

        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(elementId),
                t.identifier('append')
              ),
              [t.identifier(`elementChild${childIndex}`)]
            )
          )
        );

        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(`elementChild${childIndex}`),
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
              t.identifier(`elementChild${childIndex}`),
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

        statements.push(
          ...setAttributes(`elementChild${childIndex}`, item.attributes)
        );

        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(elementId),
                t.identifier('append')
              ),
              [t.identifier(`elementChild${childIndex}`)]
            )
          )
        );

        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(`elementChild${childIndex}`),
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
      } else {
        const attributeObject = getAttributes(item.attributes);
        statements.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(elementId),
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

        // statements.push(
        //   t.expressionStatement(
        //     t.callExpression(
        //       t.memberExpression(
        //         t.identifier(elementId),
        //         t.identifier('append')
        //       ),
        //       [t.callExpression(t.identifier(item.tagName), [])]
        //     )
        //   )
        // );
      }
    });

    return {
      elementId,
      statements: [...statements],
    };
  };

  const appendHtmlToTemplate = (
    index: number,
    templateVariableName: string,
    tagName: string,
    content: string | Content[]
  ): ElementsResult => {
    const elementId = `element${index}`;

    const variableDefinition = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(elementId),
        t.callExpression(
          t.memberExpression(
            t.identifier('document'),
            t.identifier('createElement')
          ),
          [t.stringLiteral(tagName)]
        )
      ),
    ]);

    const statements: babelTypes.Statement[] = [];

    if (typeof content === 'string') {
      statements.push(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier(elementId), t.identifier('append')),
            [
              t.callExpression(
                t.memberExpression(
                  t.identifier('document'),
                  t.identifier('createTextNode')
                ),
                [t.stringLiteral(content)]
              ),
            ]
          )
        )
      );
    } else {
      console.log('content', content);
      content.forEach((item, childIndex) => {
        if (typeof item.content === 'string') {
          statements.push(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(`elementChild${childIndex}`),
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

          statements.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier(elementId),
                  t.identifier('append')
                ),
                [t.identifier(`elementChild${childIndex}`)]
              )
            )
          );

          statements.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier(`elementChild${childIndex}`),
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
        } else {
          statements.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier(elementId),
                  t.identifier('append')
                ),
                [t.callExpression(t.identifier(item.tagName), [])]
              )
            )
          );
        }
      });
    }

    const expressionStatement = t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.memberExpression(
            t.identifier(templateVariableName),
            t.identifier('content')
          ),
          t.identifier('append')
        ),
        [t.identifier(elementId)]
      )
    );
    return {
      elementId,
      statements: [variableDefinition, ...statements, expressionStatement],
    };
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
    // const expressionStatement = t.expressionStatement(
    //   t.assignmentExpression(
    //     '=',
    //     t.memberExpression(t.identifier('template'), t.identifier('innerHTML')),
    //     t.stringLiteral(html)
    //   )
    // );

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

    /*
	const blockElements: babelTypes.Statement[] = [];
    content.forEach((item, index) => {
      blockElements.push(
        ...appendHtmlToTemplate(index, 'template', item.tagName, item.content)
      );
    });

	*/

    const blockStatement = t.blockStatement([
      variableDefinition,
      ...blockElements,
      variableCloneNodeDefinition,
      t.returnStatement(t.identifier('cloneNode')),
    ]);
    return blockStatement;
  };

  const handleChildren = (
    index: number,
    parentId: string,
    children: (
      | babelTypes.JSXElement
      | babelTypes.JSXText
      | babelTypes.JSXExpressionContainer
      | babelTypes.JSXSpreadChild
      | babelTypes.JSXFragment
    )[],
    attributes: (babelTypes.JSXAttribute | babelTypes.JSXSpreadAttribute)[]
  ) => {
    const content: Content[] = [];
    children.forEach((item, childIndex) => {
      if (
        item.type === 'JSXExpressionContainer' &&
        item.expression.type === 'StringLiteral'
      ) {
        content.push({
          index: childIndex,
          parentId,
          tagName: 'span',
          content: item.expression.value,
          attributes,
        });
      } else if (item.type === 'JSXText' && item.value.trim() !== '') {
        content.push({
          index: childIndex,
          parentId,
          tagName: 'span',
          content: item.value,
          attributes,
        });
      } else if (
        item.type === 'JSXExpressionContainer' &&
        item.expression.type !== 'JSXEmptyExpression'
      ) {
        content.push({
          index: childIndex,
          parentId,
          tagName: 'span',
          content: '',
          isExpression: true,
          expression: item.expression,
          attributes,
        });
      } else if (item.type === 'JSXElement') {
        const tagName = (
          item.openingElement.name as unknown as babelTypes.JSXIdentifier
        ).name;
        if (tagName[0] === tagName[0].toUpperCase()) {
          content.push({
            index: childIndex,
            parentId,
            tagName: (
              item.openingElement.name as unknown as babelTypes.JSXIdentifier
            ).name,
            content: item,
            attributes: item.openingElement.attributes,
          });
        } else if (
          item.children &&
          item.children.length === 1 &&
          item.children[0].type === 'JSXText'
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
        } else if (item.children.length > 0) {
          content.push(
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
        }
      }
    });
    return content;
  };

  const handleJSXElement = (path: NodePath<babelTypes.JSXElement>) => {
    const openingElement = path.node.openingElement;
    const tagName = (openingElement.name as unknown as babelTypes.JSXIdentifier)
      .name;

    // const args: any[] = [];
    // args.push(t.stringLiteral(tagName));
    // const attribs = t.nullLiteral();
    // args.push(attribs);

    const blockElements: babelTypes.Statement[] = [];
    let content = '';
    if (
      path.node.children &&
      path.node.children.length === 1 &&
      path.node.children[0].type === 'JSXText'
    ) {
      content = path.node.children[0].value;

      const result = appendHtmlToTemplate(0, 'template', tagName, content);
      blockElements.push(...result.statements);

      return createTemplateForHtml(blockElements);
    } else if (path.node.children && path.node.children.length > 0) {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(
        0,
        '',
        path.node.children,
        attributes
      );
      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate(0, 'template', tagName, content);
      blockElements.push(...result.statements);

      return createTemplateForHtml(blockElements);
    }

    const result = appendHtmlToTemplate(0, 'template', tagName, content);
    blockElements.push(...result.statements);
    return createTemplateForHtml(blockElements);
  };

  return {
    name: 'custom-jsx-plugin',
    visitor: {
      JSXElement(path: NodePath<babelTypes.JSXElement>) {
        // const openingElement = path.node.openingElement;
        // const tagName = (
        //   openingElement.name as unknown as babelTypes.JSXIdentifier
        // ).name;

        // const args: any[] = [];
        // args.push(t.stringLiteral(tagName));
        // // as we are considering props as null for now
        // const attribs = t.nullLiteral();
        // //push props or other attributes which is null for now
        // args.push(attribs);

        // //const expression = t.expressionStatement(t.);
        const returnStatement = handleJSXElement(path);

        let hasText = false;
        let hasOtherElements = false;
        if (path.node.children) {
          //console.log('children', path.node.children);
          path.node.children.forEach((child) => {
            if (
              child.type === 'JSXExpressionContainer' &&
              child.expression.type === 'StringLiteral'
            ) {
              // console.log(
              //   'child is JSXExpressionContainer',
              //   child.expression.value
              // );
              hasText = true;
            } else if (child.type === 'JSXElement') {
              // console.log(
              //   'child is jsx element',
              //   (
              //     child.openingElement
              //       .name as unknown as babelTypes.JSXIdentifier
              //   ).name,
              //   child.children
              // );
            } else {
              //console.log('child is not text', child);
              hasOtherElements = true;
            }
          });
        }

        // let children = path.node.children;

        // if (hasText && hasOtherElements) {
        //   console.log('hasText && hasOtherElements');
        //   children = children.map((child) => {
        //     if (
        //       child.type === 'JSXExpressionContainer' &&
        //       child.expression.type === 'StringLiteral'
        //     ) {
        //       const reactIdentifier = t.identifier('JSX'); //object
        //       const createElementIdentifier = t.identifier('createTextElement'); //property of object
        //       const callee = t.memberExpression(
        //         reactIdentifier,
        //         createElementIdentifier
        //       );
        //       const callExpression = t.callExpression(callee, [
        //         child.expression,
        //       ]);
        //       //callExpression.arguments = );
        //       return callExpression;
        //     } else {
        //       return child;
        //     }
        //   });
        //   console.log('children', children);
        // }
        // } else if (hasText) {
        //   console.log('hasText');
        //   children = children.map((child) => {
        //     return t.stringLiteral(child.value);
        //   });
        // }
        //callExpression.arguments = callExpression.arguments.concat(children);
        // replace jsxElement node with the call expression node made above
        //path.replaceWith(callExpression);
        path.replaceWith(returnStatement);
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
