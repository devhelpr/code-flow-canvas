import {
  compileExpression,
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
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
/*

function Test (){ 
    () => {
        const element = createElement('div','');
        element.appendChild(() => {
            const element = createElement('div','');
            element.appendChild(() => {
                const element = createTextNode('test');
                return element;
            }));
            element.appendChild(return 2*3));
            return element;
        }));
        return element;
    } ;
};
return Test();;

function Component() {
    const element = createElement('div','');
     const elementL1 = createTextNode('test');
    element.appendChild(elementL1);
    return element;
}
function Test (){ 
        const element = createElement('div','');
        const elementL1 = createElement('div','');
        element.appendChild(elementL1);
        const elementL2 = createTextNode('test');
        elementL1.appendChild(elementL2);
        const elementL3 = createTextNode(2*3);
        elementL1.appendChild(elementL3);
        const elementL4 = Component();
        return element;
};
return Test();;

.. const root = document.getElementById('root');
.. root.appendChild(element);
*/

/*
function Test (){ 
    const element0 = createElement('div','');
    const element1 = createElement('div','');
    const element2_0 = createTextNode('test');
    );
    element.appendChild(element2_0);
    return 2*3);
    element.appendChild(element2_1);
        );
        element.appendChild(element1_0);
        return element0_0; ;};return Test();;

        */
