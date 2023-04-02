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
  elements: ElementNodeMap<T>
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
  element = createElement(
    astNode.tagName ?? 'div',
    elementProperties,
    parentElement,
    text
  );

  if (element) {
    (element.domElement as unknown as HTMLElement | SVGElement).id = element.id;
    elements.set(element.id, element);

    astNode.body?.forEach((childASTNode) => {
      createASTNodeElement(
        childASTNode,
        element!.domElement,
        element!.elements
      );
    });
  }
};
