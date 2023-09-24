import {
  compileExpression,
  runExpression,
} from '@devhelpr/expression-compiler';
import { IASTTreeNode } from '@devhelpr/markup-compiler';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { createElement } from './create-element';

export const createASTNodeElement = <T>(
  astNode: IASTTreeNode,
  parentElement: DOMElementNode,
  elements: ElementNodeMap<T>,
  expressions?: Record<string, object>
) => {
  let element: IElementNode<T> | undefined = undefined;
  const elementProperties: any = {};
  astNode.properties?.forEach((propertyKeyValue) => {
    elementProperties[propertyKeyValue.propertyName] = propertyKeyValue.value;
  });
  let text = astNode.value ?? '';
  if (astNode.type === 'EXPRESSION') {
    const compiledExpression = compileExpression(astNode.value || '');
    text = runExpression(compiledExpression, {});
  }
  let dontFollowChildren = false;
  if (astNode.tagName === 'script') {
    dontFollowChildren = true;
    text = `(function () {
      try {
        ${astNode.body?.[0].value ?? ''}
      } catch (error) {
        console.log('Error in script', error);
      };
    })();`;
  }
  element = createElement(
    astNode.tagName ?? 'div',
    elementProperties,
    parentElement,
    text
  );

  const matches = text.toString().match(/\[[\s\S]+?\]/gm);
  if (matches && expressions && element) {
    matches.map((match) => {
      const expressionId = match.slice(1, -1);
      const expression = expressions[expressionId] as any;
      if (expression && element) {
        expression.value = text;
        expression.isTextNode = true;
        expression.element = element;
        element.domElement.textContent = '';
      }
    });
  }

  astNode.properties?.forEach((propertyKeyValue) => {
    const matches = propertyKeyValue.value.toString().match(/\[[\s\S]+?\]/gm);
    if (matches && expressions) {
      matches.map((match) => {
        const expressionId = match.slice(1, -1);
        const expression = expressions[expressionId] as any;
        if (expression) {
          expression.value = propertyKeyValue.value;
          expression.isProperty = true;
          expression.propertyName = propertyKeyValue.propertyName;
          expression.element = element;
          (element!.domElement as HTMLElement).setAttribute(
            propertyKeyValue.propertyName,
            ''
          );
        }
      });
    }
  });

  if (element) {
    (element.domElement as unknown as HTMLElement | SVGElement).id = element.id;
    elements.set(element.id, element);
    if (!dontFollowChildren) {
      astNode.body?.forEach((childASTNode) => {
        createASTNodeElement(
          childASTNode,
          element!.domElement,
          element!.elements,
          expressions
        );
      });
    }
  }
  return element;
};
