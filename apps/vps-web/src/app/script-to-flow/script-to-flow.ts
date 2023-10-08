import { expressionAST } from '@devhelpr/expression-compiler';
import {
  IASTVariableStatementNode,
  IASTExpressionNode,
  IASTIfStatementNode,
  IASTBlockNode,
  IASTNode,
} from '@devhelpr/expression-compiler/lib/interfaces/ast';
import { FlowNode, LineType } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

/*
  TODO:
  - connections list contains nodeid's from which a new node should be connected to
     ... currently it's a list of nodeid's to which create connections between
     ... new node's should first create connections to all the previous node in the list 
         .. and then clear the list and place themselves on the list
         .. the if-condtion should place both the last nodeids of success and failure flows on the list

*/
const getValue = (argument: any) => {
  if (argument.type === 'Identifier') {
    return argument.name;
  } else if (argument.type === 'NumberLiteral') {
    return argument.value;
  }
  return false;
};

export const convertExpressionScriptToFlow = (expressionScript: string) => {
  let connections: string[] = [];

  const ast = expressionAST(expressionScript);
  console.log('IMPORT SCRIPT', expressionScript, ast);
  const nodeList: FlowNode<NodeInfo>[] = [];
  let x = 0;
  let y = 0;
  let varX = 0;
  let varY = 0;
  let lastNodeType = '';
  let startThumbName = '';
  let endThumbName = '';
  let lastNodeId = '';
  let isTopLevel = true;

  const createBinaryExpression = (
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
        adjustCoordinates(
          expressionNodeWidth,
          expressionNodeOffset,
          false,
          false
        );
        nodeList.push(expressionNode);
        createConnections(expressionNode.id);
        lastNodeId = expressionNode.id;
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
        adjustCoordinates(
          expressionNodeWidth,
          expressionNodeOffset,
          false,
          false
        );
        nodeList.push(expressionNode);
        createConnections(expressionNode.id);
        lastNodeId = expressionNode.id;
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
        adjustCoordinates(
          expressionNodeWidth,
          expressionNodeOffset,
          false,
          false
        );
        nodeList.push(expressionNode);
        createConnections(expressionNode.id);
        lastNodeId = expressionNode.id;
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
        adjustCoordinates(
          expressionNodeWidth,
          expressionNodeOffset,
          false,
          false
        );
        nodeList.push(expressionNode);
        createConnections(expressionNode.id);
        lastNodeId = expressionNode.id;
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
        adjustCoordinates(
          expressionNodeWidth,
          expressionNodeOffset,
          false,
          false
        );
        nodeList.push(expressionNode);
        createConnections(expressionNode.id);
        lastNodeId = expressionNode.id;
      } else if (result) {
        return expression;
      }
    }
    return false;
  };

  function createConnections(nodeId: string) {
    connections.forEach((connectionId, index) => {
      const connectionNode: FlowNode<NodeInfo> = {
        id: crypto.randomUUID(),
        nodeType: 'Connection',
        startNodeId: connectionId, //connections[index - 1],
        endNodeId: nodeId,
        lineType: LineType.BezierCubic,
        x: 0,
        y: 0,
      };
      if (startThumbName) {
        connectionNode.startThumbName = startThumbName;
        startThumbName = '';
      }
      if (endThumbName) {
        connectionNode.endThumbName = endThumbName;
        endThumbName = '';
      }
      nodeList.push(connectionNode as FlowNode<NodeInfo>);
    });
    connections = [];
    connections.push(nodeId);
  }

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

  function createFlowNodes(blocks: IASTNode[]) {
    blocks.forEach((statement) => {
      if (statement.type === 'VariableStatement') {
        const tempX = x;
        const tempY = y;
        x = varX;
        y = varY;
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

          if (isTopLevel) {
            lastNodeType = 'variable';
          }
          nodeList.push(varNode);
          //lastNodeId = varNode.id;
        });
        varX = x;
        varY = y;
        x = tempX;
        y = tempY;
      } else {
        if (lastNodeType === 'variable' && isTopLevel) {
          x = 0;
          y += 100;
        }
        isTopLevel = false;

        if (statement.type === 'ExpressionStatement') {
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
              nodeList.push(showValueNode);
              createConnections(showValueNode.id);
              lastNodeId = showValueNode.id;
            }
          }
        } else if (statement.type === 'IfStatement') {
          const ifStatement = statement as IASTIfStatementNode;
          if (ifStatement.test.type === 'BinaryExpression') {
            const expression = createBinaryExpression(
              ifStatement.test,
              x,
              y,
              nodeList,
              connections,
              false,
              adjustCoordinate
            );
            x += 50;
            y -= 47;
            console.log('if-statement expression', expression);
            const ifStatementNode = {
              id: crypto.randomUUID(),
              nodeType: 'Shape',
              nodeInfo: {
                type: 'if-condition',
                formValues: {
                  expression: expression,
                  Mode: 'expression',
                },
              },
              x,
              y,
            };
            lastNodeType = 'if-condition';
            nodeList.push(ifStatementNode);
            lastNodeId = ifStatementNode.id;
            x += 200;

            createConnections(ifStatementNode.id);
            const oldconnections = [...connections];
            const oldx = x;
            const oldy = y;
            const newConnections: string[] = [];
            if (ifStatement.consequent?.type === 'BlockStatement') {
              startThumbName = 'success';
              endThumbName = 'input';
              y -= 143;
              const blockStatement = ifStatement.consequent as IASTBlockNode;
              createFlowNodes(blockStatement.body);
              newConnections.push(lastNodeId);
            }

            if (ifStatement.alternate?.type === 'BlockStatement') {
              x = oldx;
              y = oldy;
              connections = oldconnections;
              startThumbName = 'failure';
              endThumbName = 'input';
              y += 200;
              const blockStatement = ifStatement.alternate as IASTBlockNode;
              createFlowNodes(blockStatement.body);
              newConnections.push(lastNodeId);
            }
            connections.push(...newConnections);
            y = oldy;
            y += 47;
          }
        }
      }
    });
  }

  if (ast) {
    createFlowNodes(ast.body);
    return nodeList;
  }
  return false;
};
