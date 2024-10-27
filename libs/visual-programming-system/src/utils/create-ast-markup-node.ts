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
import { createNodeElement } from './create-element';
import { BaseNodeInfo } from '../types/base-node-info';

/**
 * This function, `createASTNodeElement`, creates an AST node element from a given AST node,
 * parent element, map of elements, optional expressions, and an optional scope ID.
 *
 * It initializes an `element` variable and an `elementProperties` object, then iterates over the
 * `properties` of the `astNode`, adding each property to `elementProperties`.
 *
 * If the `astNode` type is 'EXPRESSION', it compiles and runs the expression,
 * storing the result in `text`.
 *
 * If the `tagName` of the `astNode` is 'script' or 'style' with a `scopeId`, it sets `dontFollowChildren` to `true` and
 * wraps the body in a self-invoking function or `@scope` rule respectively.
 *
 * The `element` is created using the `createElement` function with the `tagName`, `elementProperties`,
 * `parentElement`, and `text`.
 *
 * If `text` contains any expressions, it updates the `value`, `isTextNode`, and `element` properties of
 * the corresponding expression and sets the `textContent` of the `domElement` to an empty string.
 *
 * If the `value` of each property contains any expressions, it updates the `value`, `isProperty`, `propertyName`, and `element`
 * properties of the corresponding expression and sets the attribute of the `domElement`
 * to an empty string.
 *
 * If the `element` was successfully created, it sets the `id` of the `domElement`, adds the `element`
 *  to the `elements` map, and recursively creates AST node elements for each child of the `astNode` (unless `dontFollowChildren` is `true`).
 *
 * The function then returns the created `element`.
 *
 * @template T - The type of the element.
 * @param {IASTTreeNode} astNode - The AST node.
 * @param {DOMElementNode} parentElement - The parent element.
 * @param {ElementNodeMap<T>} elements - The map of elements.
 * @param {Record<string, object>} [expressions] - The expressions.
 * @param {string} [scopeId] - The scope ID.
 * @returns {IElementNode<T>} - The created element.
 */
export const createASTNodeElement = <T extends BaseNodeInfo>(
  astNode: IASTTreeNode,
  parentElement: DOMElementNode,
  elements: ElementNodeMap<T>,
  expressions?: Record<string, object>,
  scopeId?: string,
  payload?: any
) => {
  let element: IElementNode<T> | undefined = undefined;
  const elementProperties: any = {};
  astNode.properties?.forEach((propertyKeyValue) => {
    elementProperties[propertyKeyValue.propertyName] = propertyKeyValue.value;
  });
  let text = astNode.value ?? '';
  if (astNode.type === 'EXPRESSION') {
    const compiledExpression = compileExpression(astNode.value || '');
    text = runExpression(compiledExpression, payload ?? {});
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
  } else if (astNode.tagName === 'style' && scopeId) {
    // TODO : uncomment when @scope is supported in more major browsers
    dontFollowChildren = true;
    text = `@scope ([id="${scopeId}"]) {
        ${astNode.body?.[0].value ?? ''}
    }`;
  }
  element = createNodeElement(
    astNode.tagName || 'div',
    elementProperties,
    parentElement,
    text
  );

  const matches = (text || '').toString().match(/\[[\s\S]+?\]/gm);
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
          expressions,
          scopeId
        );
      });
    }
  }
  return element;
};
