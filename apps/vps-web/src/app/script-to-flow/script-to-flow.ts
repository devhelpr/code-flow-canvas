import { expressionAST } from '@devhelpr/expression-compiler';
import {
  IASTVariableStatementNode,
  IASTExpressionNode,
} from '@devhelpr/expression-compiler/lib/interfaces/ast';
import { FlowNode, LineType } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

const getValue = (argument: any) => {
  if (argument.type === 'Identifier') {
    return argument.name;
  } else if (argument.type === 'NumberLiteral') {
    return argument.value;
  }
  return false;
};

let lastNodeType = '';
export const createBinaryExpression = (
  argument: any,
  x: number,
  y: number,
  nodeList: FlowNode<NodeInfo>[],
  connections: string[],
  isRoot = false,
  adjustCoordinates: (
    x: number,
    y: number,
    resetX: boolean,
    resetY: boolean
  ) => void
): string | false => {
  if (typeof argument === 'string') {
    return false;
  }
  const expressionNodeWidth = 280;
  const expressionNodeOffset = 32;

  if (argument.type === 'Identifier') {
    if (isRoot) {
      const expressionNode = {
        id: crypto.randomUUID(),
        nodeType: 'Shape',
        nodeInfo: {
          type: 'expression',
          formValues: {
            expression: argument.name,
          },
        },
        x,
        y,
      };
      lastNodeType = 'expression';
      connections.push(expressionNode.id);
      adjustCoordinates(
        expressionNodeWidth,
        expressionNodeOffset,
        false,
        false
      );
      nodeList.push(expressionNode);
    }
    return false;
  }
  if (
    (argument.left.type === 'Identifier' ||
      argument.left.type === 'NumberLiteral') &&
    (argument.right.type === 'Identifier' ||
      argument.right.type === 'NumberLiteral')
  ) {
    const expression = `${getValue(argument.left)} ${
      argument.operator
    } ${getValue(argument.right)}`;
    if (isRoot) {
      const expressionNode = {
        id: crypto.randomUUID(),
        nodeType: 'Shape',
        nodeInfo: {
          type: 'expression',
          formValues: {
            expression,
          },
        },
        x,
        y,
      };
      lastNodeType = 'expression';
      connections.push(expressionNode.id);
      adjustCoordinates(
        expressionNodeWidth,
        expressionNodeOffset,
        false,
        false
      );
      nodeList.push(expressionNode);
    } else {
      return expression;
    }
    return false;
  }

  if (
    argument.left.type === 'BinaryExpression' &&
    argument.right.type === 'BinaryExpression'
  ) {
    const resultLeft = createBinaryExpression(
      argument.left,
      x,
      y,
      nodeList,
      connections,
      false,
      adjustCoordinates
    );
    const resultRight = createBinaryExpression(
      argument.right,
      x,
      y,
      nodeList,
      connections,
      false,
      adjustCoordinates
    );
    const expression = `${resultLeft} ${argument.operator} ${resultRight}`;
    if (isRoot) {
      const expressionNode = {
        id: crypto.randomUUID(),
        nodeType: 'Shape',
        nodeInfo: {
          type: 'expression',
          formValues: {
            expression,
          },
        },
        x,
        y,
      };
      lastNodeType = 'expression';
      connections.push(expressionNode.id);
      adjustCoordinates(
        expressionNodeWidth,
        expressionNodeOffset,
        false,
        false
      );
      nodeList.push(expressionNode);
    } else {
      return expression;
    }
  }

  if (
    argument.left.type === 'BinaryExpression' &&
    argument.right.type !== 'BinaryExpression'
  ) {
    const result = createBinaryExpression(
      argument.left,
      x,
      y,
      nodeList,
      connections,
      false,
      adjustCoordinates
    );
    const expression = `${result} ${argument.operator} ${getValue(
      argument.right
    )}`;
    if (isRoot) {
      const expressionNode = {
        id: crypto.randomUUID(),
        nodeType: 'Shape',
        nodeInfo: {
          type: 'expression',
          formValues: {
            expression,
          },
        },
        x,
        y,
      };
      lastNodeType = 'expression';
      connections.push(expressionNode.id);
      adjustCoordinates(
        expressionNodeWidth,
        expressionNodeOffset,
        false,
        false
      );
      nodeList.push(expressionNode);
    } else if (result) {
      return expression;
    }
  }

  if (
    argument.right.type === 'BinaryExpression' &&
    argument.left.type !== 'BinaryExpression'
  ) {
    const result = createBinaryExpression(
      argument.right,
      x,
      y,
      nodeList,
      connections,
      false,
      adjustCoordinates
    );
    const expression = `${getValue(argument.left)} ${
      argument.operator
    } ${result}`;
    if (isRoot) {
      const expressionNode = {
        id: crypto.randomUUID(),
        nodeType: 'Shape',
        nodeInfo: {
          type: 'expression',
          formValues: {
            expression,
          },
        },
        x,
        y,
      };
      lastNodeType = 'expression';
      connections.push(expressionNode.id);
      adjustCoordinates(
        expressionNodeWidth,
        expressionNodeOffset,
        false,
        false
      );
      nodeList.push(expressionNode);
    } else if (result) {
      return expression;
    }
  }
  return false;
};

function createConnections(
  nodeList: FlowNode<NodeInfo>[],
  connections: string[]
) {
  connections.forEach((connectionId, index) => {
    if (index > 0) {
      const connectionNode = {
        id: crypto.randomUUID(),
        nodeType: 'Connection',
        startNodeId: connections[index - 1],
        endNodeId: connectionId,
        lineType: LineType.BezierCubic,
        x: 0,
        y: 0,
      };
      nodeList.push(connectionNode);
    }
  });
  if (connections.length > 1) {
    connections.slice(0, connections.length - 1);
  }
}

export const convertExpressionScriptToFlow = (expressionScript: string) => {
  const ast = expressionAST(expressionScript);
  const nodeList: FlowNode<NodeInfo>[] = [];
  let x = 0;
  let y = 0;

  const adjustCoordinate = (
    xMod: number,
    yMod: number,
    resetX: boolean,
    resetY: boolean
  ) => {
    if (resetX) {
      x = xMod;
    } else {
      x += xMod;
    }
    if (resetY) {
      y = yMod;
    } else {
      y += yMod;
    }
  };
  const connections: string[] = [];
  console.log('IMPORT SCRIPT', expressionScript, ast);
  if (ast) {
    ast.body.forEach((statement) => {
      if (statement.type === 'VariableStatement') {
        const variableStatement = statement as IASTVariableStatementNode;
        variableStatement.declarations.forEach((declaration) => {
          const varNode = {
            id: crypto.randomUUID(),
            nodeType: 'Shape',
            nodeInfo: {
              type: 'variable',
              formValues: {
                variableName: declaration.id.name,
                initialValue: (declaration.init as any)?.value ?? 0,
              },
              isVariable: true,
            },
            x,
            y,
          };
          x += 200;
          lastNodeType = 'variable';
          nodeList.push(varNode);
        });
      } else if (statement.type === 'ExpressionStatement') {
        if (lastNodeType === 'variable') {
          x = 0;
          y += 100;
        }
        const expressionStatement = statement as IASTExpressionNode;
        if (expressionStatement.expression.type === 'CallExpression') {
          const callExpression = expressionStatement.expression as any;
          callExpression.arguments.forEach((argument: any) => {
            if (argument.type === 'Identifier') {
              if (lastNodeType === 'show-value') {
                y -= 32;
              }
              createBinaryExpression(
                argument,
                x,
                y,
                nodeList,
                connections,
                true,
                adjustCoordinate
              );
            } else if (argument.type === 'BinaryExpression') {
              if (lastNodeType === 'expshow-value') {
                y -= 32;
              }
              createBinaryExpression(
                argument,
                x,
                y,
                nodeList,
                connections,
                true,
                adjustCoordinate
              );
            }
          });
          if (callExpression.callee.name === 'showValue') {
            const showValueNode = {
              id: crypto.randomUUID(),
              nodeType: 'Shape',
              nodeInfo: {
                type: 'show-value',
              },
              x,
              y,
            };
            x += 200;

            lastNodeType = 'show-value';
            connections.push(showValueNode.id);
            nodeList.push(showValueNode);
          }
          createConnections(nodeList, connections);
        }
      }
    });
    return nodeList;
  }
  return false;
};
