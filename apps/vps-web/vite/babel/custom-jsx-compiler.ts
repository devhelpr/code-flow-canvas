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
  runExpression?: boolean;
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
          attribute.value.expression.type === 'ArrayExpression'
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

  const setAttributes = (
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
          (attribute.value.expression.type === 'ArrowFunctionExpression' ||
            attribute.value.expression.type === 'ArrayExpression' ||
            attribute.value.expression.type === 'Identifier' ||
            attribute.value.expression.type === 'TemplateLiteral')
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
        } else
         {
          console.log('Unhandled attribute', attribute);
        }
      });
    }
    return statements;
  };

  const setEventAttributes = (
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
      });
    }
    return statements;
  };

  const appendChildrenToTemplate = (
    templateVariableName: string,
    content: Content[]
  ): babelTypes.Statement[] => {
    const statements: babelTypes.Statement[] = [];
console.log("appendChildrenToTemplate", templateVariableName, content.length);
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
    };

    content.forEach((item, childIndex) => {
      const elementId = `${
        templateVariableName !== 'template' ? templateVariableName : ''
      }elementChild_${childIndex}`;

      if (item.isExpression === true && item.expression) {
        //console.log('item.expression', item.tagName, item.expression);
        if (item.runExpression) {
          console.log("appendChildrenToTemplate runExpression", templateVariableName);
          //console.log('item.expression', item.tagName, item.expression);

          // const childStatements = appendChildrenToTemplate(
          //   templateVariableName,
          //   item.expression
          // );

          const contentChildren: Content[] = handleChildren(
            item.tagName,
            (item.expression as unknown as babelTypes.JSXElement).children,
            []
          );
          //console.log('item.expression', item.tagName, (item.expression as unknown as any).children[0].expression["body"], contentChildren);          

          //console.log(JSON.stringify(contentChildren, null ,2));
          if (contentChildren.length > 0) {
            
            // TODO : upgrade to NodesJS v17+...
            const structuredCloneHelper = (input : any) => {
              if (typeof structuredClone !== "undefined") {
                return structuredClone(input);
              }
              return {...input};
            }

            const clonedFunction = structuredCloneHelper(
              contentChildren[0].expression
            ) as babelTypes.ArrowFunctionExpression;

            clonedFunction.params = [
              t.identifier('item'),
              t.identifier('index'),
            ];

            //console.log(JSON.stringify(item, null ,2));
            const listAttribute = item.attributes?.find((attribute) => attribute.type === "JSXAttribute" && attribute.name?.name === "list");

            if (!listAttribute) {
              throw new Error("list attribute not found for list:Render");
            }
            if (listAttribute.type !== "JSXAttribute") {
              throw new Error("Unsupported list attribute type found for list:Render");
            }
            if (!listAttribute.value) {
              throw new Error("list attribute value not found for list:Render");
            }
            if (listAttribute.value.type !== "JSXExpressionContainer") {
              throw new Error("Unsupported list attribute value type found for list:Render");
            }
            if (!listAttribute.value.expression) {
              throw new Error("list attribute expression not found for list:Render");
            }
            if (listAttribute.value.expression.type !== "MemberExpression") {
              throw new Error("Unsupported list attribute expression type found for list:Render");
            }
            if (!listAttribute.value.expression.property) {
              throw new Error("list attribute expression property not found for list:Render");
            }
            if (listAttribute.value.expression.property.type !== "Identifier") {
              throw new Error("Unsupported list attribute expression property type found for list:Render");
            }
            console.log("listAttribute.value.expression.property.name", listAttribute.value.expression.property.name);
            const statement = t.callExpression(
              t.memberExpression(
                t.memberExpression(t.identifier('props'), t.identifier(listAttribute.value.expression.property.name)),
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
            templateVariableName !== 'template',
            templateVariableName,
            elementId
          );

          if (item && item.children && item.children.length > 0) {
            console.log("appendChildrenToTemplate call1");
            const childStatements = appendChildrenToTemplate(
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
          statements.push(...setAttributes(elementId, item.attributes));
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
          templateVariableName !== 'template',
          templateVariableName,
          elementId
        );

        if (item && item.children && item.children.length > 0) {
          console.log("appendChildrenToTemplate call2");
          const childStatements = appendChildrenToTemplate(
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
          templateVariableName !== 'template',
          templateVariableName,
          elementId
        );
      }
    });
    console.log("appendChildrenToTemplate return", templateVariableName);
    return [...statements];
  };

  const createTemplateForHtml = (
    blockElements: babelTypes.Statement[] = [],
    elementReferenceBlocks: babelTypes.Statement[] = []
  ) => {
    console.log("createTemplateForHtml");
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
      ...elementReferenceBlocks,
      t.returnStatement(t.identifier('cloneNode')),
    ]);
    return blockStatement;
  };

  const createRenderListStatements = (
    childIndex: number,
    parentId: string,
    item: babelTypes.JSXElement
  ): Content => {
    console.log('createRenderListStatements', childIndex, parentId);
    return {
      index: childIndex,
      parentId,
      tagName: 'div',
      //content: 'RenderMap',
      content: '',
      isExpression: true,
      runExpression: true,
      expression: item,
      attributes: item.openingElement.attributes,
    };
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
    console.log('handleChildren', parentId, parent?.type);
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
          tagName: '',
          // parent
          //   ? (
          //       parent.openingElement
          //         .name as unknown as babelTypes.JSXIdentifier
          //     ).name
          //   : 'span',
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
        const tagName =
          item.openingElement.name.type === 'JSXNamespacedName'
            ? `${
                (
                  item.openingElement
                    .name as unknown as babelTypes.JSXNamespacedName
                ).namespace.name
              }:${
                (
                  item.openingElement
                    .name as unknown as babelTypes.JSXNamespacedName
                ).name.name
              }`
            : (item.openingElement.name as unknown as babelTypes.JSXIdentifier)
                .name;

        if (tagName[0] === tagName[0].toUpperCase()) {
          content.push({
            index: childIndex,
            parentId,
            tagName,
            content: item,
            attributes: item.openingElement.attributes,
          });
          childIndex++;
        } else if (tagName === 'list:Render') {
          //console.log('list:Render', item.children);
          content.push(createRenderListStatements(childIndex, parentId, item));

          // TODO : increase then when elements are added..
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
        } else {
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
              item.children || [],
              item.openingElement.attributes,
              item
            ),
          });
          childIndex++;
        }
      }
    });
    return content;
  };

  const createElementReferences = (parentId: string, content: Content[]) => {
    const elementReferenceBlocks: babelTypes.Statement[] = [];
    let previousElement: babelTypes.Identifier | undefined = undefined;

    if (parentId !== 'template') {
      previousElement = t.identifier(parentId);
    }

    const effectList: any[] = [];
    const replaceList: any[] = [];
    content.forEach((item, index) => {
      if (item.isExpression && item.runExpression) {

          const elementReferenceName =
            (parentId === 'template' ? 'e' : parentId) + '_' + item.index;
          const elementReferenceIdentifier = t.identifier(elementReferenceName);


          const elementReference = t.variableDeclaration('let', [ // let e_0_1 = undefined;
            t.variableDeclarator(
              elementReferenceIdentifier,
              t.identifier('undefined')
            ),
          ]);          
          elementReferenceBlocks.push(elementReference);
  
          const listAttribute = item.attributes?.find((attribute) => attribute.type === "JSXAttribute" && attribute.name?.name === "list");

          if (!listAttribute) {
            throw new Error("list attribute not found for list:Render");
          }
          if (listAttribute.type !== "JSXAttribute") {
            throw new Error("Unsupported list attribute type found for list:Render");
          }
          if (!listAttribute.value) {
            throw new Error("list attribute value not found for list:Render");
          }
          if (listAttribute.value.type !== "JSXExpressionContainer") {
            throw new Error("Unsupported list attribute value type found for list:Render");
          }
          if (!listAttribute.value.expression) {
            throw new Error("list attribute expression not found for list:Render");
          }
          if (listAttribute.value.expression.type !== "MemberExpression") {
            throw new Error("Unsupported list attribute expression type found for list:Render");
          }
          if (!listAttribute.value.expression.property) {
            throw new Error("list attribute expression property not found for list:Render");
          }
          if (listAttribute.value.expression.property.type !== "Identifier") {
            throw new Error("Unsupported list attribute expression property type found for list:Render");
          }
          console.log("listAttribute.value.expression.property.name", listAttribute.value.expression.property.name);
          const forEachStatement = t.callExpression(
            t.memberExpression(
              t.memberExpression(t.identifier('props'), t.identifier(listAttribute.value.expression.property.name)),
              t.identifier('forEach')
            ),
            [
              t.arrowFunctionExpression(
                [t.identifier('item'), t.identifier('index')],
                t.blockStatement(
                  [
                    t.ifStatement(
                      t.binaryExpression(
                        '===',
                        elementReferenceIdentifier,
                        t.identifier('undefined')
                      ),
                      t.blockStatement( // if
                        [
                          t.expressionStatement(t.assignmentExpression(
                            '=',
                            elementReferenceIdentifier,
                            t.memberExpression(
                              previousElement ?? t.identifier('cloneNode'), // TODO : replace this cloneNode...
                              index === 0 ? t.identifier('firstChild') : t.identifier('nextSibling')
                            )
                          ))
                        ]
                      ),
                      t.blockStatement( // else
                        [
                          t.expressionStatement(t.assignmentExpression(
                            '=',
                            elementReferenceIdentifier,
                            t.memberExpression(
                              elementReferenceIdentifier,
                              t.identifier('nextSibling')
                            )
                          ))
                        ]
                      )
                    ),
                  ]
                )
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
            t.memberExpression(
              previousElement ?? t.identifier('cloneNode'),
              index === 0
                ? t.identifier('firstChild')
                : t.identifier('nextSibling')
            )
          ),
        ]);
        elementReferenceBlocks.push(elementReference);

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

          const attributeObject = getAttributes(item.attributes);

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
        elementReferenceBlocks.push(
          ...setEventAttributes(elementReferenceName, item.attributes)
        );

        if (item.children && item.children.length > 0) {
          elementReferenceBlocks.push(
            ...createElementReferences(elementReferenceName, item.children)
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

  const handleJSXElement = (path: NodePath<babelTypes.JSXElement>) => {
   
    const openingElement = path.node.openingElement;
    const tagName = (openingElement.name as unknown as babelTypes.JSXIdentifier)
      .name;

    console.log("handleJSXElement", tagName, path.node.children?.length);

    if (path.node.children && path.node.children.length > 0) {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(
        '',
        [path.node],
        attributes
      );
      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate('template', content);
      blockElements.push(...result);

      const elementReferenceBlocks: babelTypes.Statement[] =
        createElementReferences('template', content);
console.log("createTemplateForHtml call1");
      return createTemplateForHtml(blockElements, elementReferenceBlocks);
    } else {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(
        '',
        [path.node],
        attributes,
        path.node
      );

      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate('template', content);
      blockElements.push(...result);

      const elementReferenceBlocks: babelTypes.Statement[] =
        createElementReferences('template', content);
        console.log("createTemplateForHtml call2");
      return createTemplateForHtml(blockElements, elementReferenceBlocks);
    }
  };

  /*
t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier('createEffect'),
            t.identifier('createEffect')
          ),
        ],
        t.stringLiteral('@devhelpr/visual-programming-system')
      ),
  */
  return {
    name: 'custom-jsx-plugin',
    visitor: {
      JSXElement(path: NodePath<babelTypes.JSXElement>) {
        console.log("handleJSXElement CALL", path.node.openingElement?.name?.type, (path.node.openingElement?.name as unknown as any)?.name);
        const statements = handleJSXElement(path);
        if (statements) {
          path.replaceWith(statements);
        }
      },
      Program(path: NodePath<babelTypes.Program>) {
        const importDeclaration = t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier('createEffect'),
              t.identifier('createEffect')
            ),
          ],
          t.stringLiteral('@devhelpr/visual-programming-system')
        );
        path.unshiftContainer('body', importDeclaration);
      },
      // JSXText(path: NodePath<babelTypes.JSXText>) {
      //   console.log('JSXTEXT parsing');
      //   const text = path.node.value;
      //   const trimmed = text.trim();
      //   if (trimmed.length === 0) {
      //     path.remove();
      //   } else {
      //     path.replaceWith(t.stringLiteral(trimmed));
      //   }
      // },
    },
  };
}
