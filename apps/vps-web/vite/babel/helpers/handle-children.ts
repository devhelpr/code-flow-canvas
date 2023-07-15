import * as babelTypes from '@babel/types';
import { Content } from '../types/content';
import { RunExpressionType } from '../types/run-expression';

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
    content: '',
    isExpression: true,
    runExpression: RunExpressionType.renderList,
    expression: item,
    attributes: item.openingElement.attributes,
  };
};

const createFragmentStatement = (
  childIndex: number,
  parentId: string,
  item: babelTypes.JSXElement
): Content => {
  console.log('createFragmentConditionStatement', childIndex, parentId);
  return {
    index: childIndex,
    parentId,
    tagName: 'div',
    content: '',
    isExpression: true,
    runExpression: RunExpressionType.fragment,
    expression: item,
    attributes: item.openingElement.attributes,
  };
};

const createIfConditionStatement = (
  childIndex: number,
  parentId: string,
  item: babelTypes.JSXElement
): Content => {
  console.log('createIfConditionStatement', childIndex, parentId);
  return {
    index: childIndex,
    parentId,
    tagName: 'div',
    content: '',
    isExpression: true,
    runExpression: RunExpressionType.ifCondition,
    expression: item,
    attributes: item.openingElement.attributes,
  };
};

export const handleChildren = (
  t: typeof babelTypes,
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
          ? (parent.openingElement.name as unknown as babelTypes.JSXIdentifier)
              .name
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
          ? (parent.openingElement.name as unknown as babelTypes.JSXIdentifier)
              .name
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
        content.push(createRenderListStatements(childIndex, parentId, item));
        childIndex++;
      } else if (tagName === 'if:Condition') {
        content.push(createIfConditionStatement(childIndex, parentId, item));
        childIndex++;
      } else if (tagName === 'element:Fragment') {
        content.push(createFragmentStatement(childIndex, parentId, item));
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
            t,
            parentId + '_',
            item.children || [],
            [], //item.openingElement.attributes,
            item
          ),
        });
        childIndex++;
      }
    }
  });
  return content;
};
