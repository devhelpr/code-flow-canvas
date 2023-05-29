import * as babelTypes from '@babel/types';

export const createTemplateForHtml = (
  t: typeof babelTypes,
  blockElements: babelTypes.Statement[] = [],
  elementReferenceBlocks: babelTypes.Statement[] = [],
  assignToCloneNodeIdentifier: string
) => {
  console.log('createTemplateForHtml');
  // const documentIdentifier = t.identifier('document');
  // const createTemplateIdentifier = t.identifier('createElement');
  // const calleeCreateTemplate = t.memberExpression(
  //   documentIdentifier,
  //   createTemplateIdentifier
  // );
  // const callCreateTemplateExpression = t.callExpression(calleeCreateTemplate, [
  //   t.stringLiteral('template'),
  // ]);

  // const variableDefinition = t.variableDeclaration('const', [
  //   t.variableDeclarator(
  //     t.identifier('template'),
  //     callCreateTemplateExpression
  //   ),
  // ]);

  // const callCloneNodeExpression = t.callExpression(
  //   t.memberExpression(
  //     t.memberExpression(t.identifier('template'), t.identifier('content')),
  //     t.identifier('cloneNode')
  //   ),
  //   [t.booleanLiteral(true)]
  // );
  // const variableCloneNodeDefinition = t.variableDeclaration('const', [
  //   t.variableDeclarator(t.identifier('cloneNode'), callCloneNodeExpression),
  // ]);

  const variableCloneNodeDefinition = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier('cloneNode'),
      t.identifier(assignToCloneNodeIdentifier)
    ),
  ]);

  const blockStatement = t.blockStatement([
    //variableDefinition,
    ...blockElements,
    variableCloneNodeDefinition,
    ...elementReferenceBlocks,
    t.returnStatement(t.identifier('cloneNode')),
  ]);
  return blockStatement;
};
