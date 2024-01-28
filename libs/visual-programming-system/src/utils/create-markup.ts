import { compileExpressionAsInfo } from '@devhelpr/expression-compiler';
import {
  IASTTree as IASTMarkupTree,
  IASTTreeNode as IASTMarkupTreeNode,
} from '@devhelpr/markup-compiler';
import { createElement } from './create-element';

const createMarkupElement = (
  level: number,
  index: number,
  astNode: IASTMarkupTreeNode
  //    parentElement: DOMElementNode,
  //    elements: IElementNode[]
) => {
  let text = '';

  if (astNode.type === 'EXPRESSION') {
    const compiledExpression = compileExpressionAsInfo(astNode.value || '');
    text += `
        const element${level}_${index} = document.createTextNode(
          (() => {${compiledExpression.script}})()
        );
      `;
  } else {
    if (!!astNode.tagName && astNode.tagName !== '') {
      text += `
        const element${level}_${index} = document.createElement('${
        astNode.tagName ?? 'div'
      }','${astNode.value ?? ''}');
      `;

      astNode.body?.forEach((childASTNode, childIndex) => {
        text += `
          ${createMarkupElement(level + 1, childIndex, childASTNode)}
          element${level}_${index}.appendChild(element${
          level + 1
        }_${childIndex});
        `;
      });
    } else {
      text += `
        const element${level}_${index} = document.createTextNode('${
        astNode.value ?? ''
      }');
      `;
    }
    if (level === 0) {
      text += `return element${level}_${index};`;
    }
  }
  return text;
};

export const setupMarkupElement = (
  markupExpression: string,
  rootElement: HTMLElement
) => {
  const compiledExpressionInfo = compileExpressionAsInfo(
    markupExpression,
    true,
    (markup: IASTMarkupTree) => {
      console.log('markup', createMarkupElement(0, 0, markup.body));
      return ` ${createMarkupElement(0, 0, markup.body)} `;
    }
  );

  console.log('compiledExpression', compiledExpressionInfo);

  const compiledExpression = (
    new Function(
      'payload',
      `console.log("createElement", this.createElement);
      ${compiledExpressionInfo.script}`
    ) as unknown as (payload?: any) => any
  ).bind({ ...compiledExpressionInfo.bindings, createElement });
  const element = compiledExpression({});
  rootElement.appendChild(element);
};
