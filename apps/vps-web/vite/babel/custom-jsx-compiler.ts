import * as babelTypes from '@babel/types';
import { NodePath } from '@babel/traverse';
import { appendChildrenToTemplate } from './helpers/append-children-to-template';
import { Content } from './types/content';
import { createTemplateForHtml } from './helpers/create-template-for-html';
import { handleChildren } from './helpers/handle-children';
import { createElementReferences } from './helpers/create-element-references';

/*
  the process for parsing JSX and creating html nodes:
 
  .. create internal content tree structure
  .. create ast nodes to create template and clone template
  .. create html nodes from template using getFirstChild/nextSibling etc..
  .. create events on html nodes

*/

export default function (babel: { types: typeof babelTypes }) {
  const t = babel.types as unknown as typeof babelTypes;

  // use https://astexplorer.net/ for AST exploration and generation
  // https://babeljs.io/docs/en/babel-types

  const handleJSXElement = (path: NodePath<babelTypes.JSXElement>) => {
    const openingElement = path.node.openingElement;
    const tagName = (openingElement.name as unknown as babelTypes.JSXIdentifier)
      .name;

    console.log('handleJSXElement', tagName, path.node.children?.length);

    if (path.node.children && path.node.children.length > 0) {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(t, '', [path.node], attributes);
      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate(t, 'template', content);
      blockElements.push(...result.elements);

      const elementReferenceBlocks: babelTypes.Statement[] =
        createElementReferences(t, 'template', content);
      console.log('createTemplateForHtml call1');
      return createTemplateForHtml(
        t,
        blockElements,
        elementReferenceBlocks,
        result.parentId
      );
    } else {
      const attributes = path.node.openingElement.attributes;

      const content: Content[] = handleChildren(
        t,
        '',
        [path.node],
        attributes,
        path.node
      );

      const blockElements: babelTypes.Statement[] = [];
      const result = appendChildrenToTemplate(t, 'template', content);
      blockElements.push(...result.elements);

      const elementReferenceBlocks: babelTypes.Statement[] =
        createElementReferences(t, 'template', content);
      console.log('createTemplateForHtml call2');
      return createTemplateForHtml(
        t,
        blockElements,
        elementReferenceBlocks,
        result.parentId
      );
    }
  };

  return {
    name: 'custom-jsx-plugin',
    visitor: {
      JSXElement(path: NodePath<babelTypes.JSXElement>) {
        console.log(
          'handleJSXElement CALL',
          path.node.openingElement?.name?.type,
          (path.node.openingElement?.name as unknown as any)?.name
        );
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
