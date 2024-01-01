import { expressionAST } from '@devhelpr/expression-compiler';
import {
  IASTVariableStatementNode,
  IASTExpressionNode,
  IASTIfStatementNode,
  IASTBlockNode,
  IASTNode,
  IASTAssignmentExpressionNode,
  IASTIdentifierNode,
  IASTReturnNode,
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
const expressionNodeWidth = 280;
const expressionNodeOffset = 32;
const showValueNodeOffset = -6;
const lastNodeWasshowValueOffset = 32;

const scaleX = 1.25;
const scaleY = 1; //1.25;

export const convertExpressionScriptToFlow = (expressionScript: string) => {
  let connections: string[] = [];

  const ast = expressionAST(expressionScript);
  console.log('IMPORT SCRIPT', expressionScript, ast);
  const nodeList: FlowNode<NodeInfo>[] = [];
  let x = 0;
  let y = 0;
  let varX = 0;
  let varY = 0;

  let functionX = 0;
  let functionY = 500;

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
    connections.forEach((connectionId, _index) => {
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
      x += xMod * scaleX;
    }
    if (resetY) {
      y = yMod;
    } else {
      y += yMod * scaleY;
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
          adjustCoordinate(200, 0, false, false);

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
      } else if (statement.type === 'FunctionDeclaration') {
        const oldconnections = [...connections];

        const tempX = x;
        const tempY = y;
        x = functionX;
        y = functionY;

        const functionStatementNode = {
          id: crypto.randomUUID(),
          nodeType: 'Shape',
          nodeInfo: {
            type: 'function',
            formValues: {
              node: (statement as any).name.name,
              parameters: (statement as any).params
                .map((param: any) => param.identifier.name)
                .join(','),
            },
          },
          x,
          y,
        };
        lastNodeType = 'function';
        nodeList.push(functionStatementNode);
        lastNodeId = functionStatementNode.id;
        adjustCoordinate(200, 0, false, false);

        createConnections(functionStatementNode.id);

        adjustCoordinate(0, expressionNodeOffset, false, false);
        const blockStatement = (statement as any).body as IASTBlockNode;
        createFlowNodes(blockStatement.body);

        connections = oldconnections;

        functionX = x;
        functionY = y;
        x = tempX;
        y = tempY;
      } else {
        if (lastNodeType === 'variable' && isTopLevel) {
          adjustCoordinate(0, 400, true, false);
        }
        isTopLevel = false;

        if (statement.type === 'ReturnStatement') {
          const returnStatement = statement as IASTReturnNode;
          if (
            returnStatement.argument &&
            returnStatement.argument.type === 'BinaryExpression'
          ) {
            createBinaryExpression(
              returnStatement.argument,
              x,
              y,
              nodeList,
              connections,
              true,
              adjustCoordinate
            );

            adjustCoordinate(0, -expressionNodeOffset, false, false);
          }
        } else if (statement.type === 'ExpressionStatement') {
          const expressionStatement = statement as IASTExpressionNode;

          if (expressionStatement.expression.type === 'AssignmentExpression') {
            const assignment =
              expressionStatement.expression as IASTAssignmentExpressionNode;
            if (assignment.right.type === 'BinaryExpression') {
              if (lastNodeType === 'show-value') {
                adjustCoordinate(0, -lastNodeWasshowValueOffset, false, false);
              } else if (
                lastNodeType === 'set-variable' ||
                lastNodeType === 'expression'
              ) {
                adjustCoordinate(0, -expressionNodeOffset, false, false);
              }
              createBinaryExpression(
                assignment.right,
                x,
                y,
                nodeList,
                connections,
                true,
                adjustCoordinate
              );

              adjustCoordinate(0, -expressionNodeOffset, false, false);

              const setVariableNode = {
                id: crypto.randomUUID(),
                nodeType: 'Shape',
                nodeInfo: {
                  type: 'set-variable',
                  formValues: {
                    variableName: (assignment.left as IASTIdentifierNode).name,
                  },
                },
                x,
                y,
              };
              adjustCoordinate(
                expressionNodeWidth,
                expressionNodeOffset,
                false,
                false
              );

              lastNodeType = 'set-variable';
              nodeList.push(setVariableNode);
              createConnections(setVariableNode.id);
              lastNodeId = setVariableNode.id;
            }
          } else if (expressionStatement.expression.type === 'CallExpression') {
            const callExpression = expressionStatement.expression as any;
            callExpression.arguments.forEach((argument: any) => {
              if (argument.type === 'Identifier') {
                if (lastNodeType === 'show-value') {
                  adjustCoordinate(
                    0,
                    -lastNodeWasshowValueOffset - showValueNodeOffset,
                    false,
                    false
                  );
                } else if (
                  lastNodeType === 'set-variable' ||
                  lastNodeType === 'expression'
                ) {
                  adjustCoordinate(0, -expressionNodeOffset, false, false);
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
                  adjustCoordinate(
                    0,
                    -lastNodeWasshowValueOffset - showValueNodeOffset,
                    false,
                    false
                  );
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
              } else if (argument.type === 'CallExpression') {
                const callFunctionNode = {
                  id: crypto.randomUUID(),
                  nodeType: 'Shape',
                  nodeInfo: {
                    type: 'call-function',
                    formValues: {
                      functionCall: `${argument.callee.name}(1,2)`,
                    },
                  },
                  x,
                  y,
                };
                adjustCoordinate(expressionNodeWidth, 0, false, false);

                lastNodeType = 'call-function';
                nodeList.push(callFunctionNode);
                createConnections(callFunctionNode.id);
                lastNodeId = callFunctionNode.id;
              }
            });
            if (callExpression.callee.name === 'showValue') {
              if (
                lastNodeType === 'set-variable' ||
                lastNodeType === 'expression'
              ) {
                adjustCoordinate(0, -6, false, false);
              }

              const showValueNode = {
                id: crypto.randomUUID(),
                nodeType: 'Shape',
                nodeInfo: {
                  type: 'show-value',
                },
                x,
                y,
              };
              adjustCoordinate(200, 0, false, false);

              lastNodeType = 'show-value';
              nodeList.push(showValueNode);
              createConnections(showValueNode.id);
              lastNodeId = showValueNode.id;
            } else {
              const callFunctionNode = {
                id: crypto.randomUUID(),
                nodeType: 'Shape',
                nodeInfo: {
                  type: 'call-function',
                  functionCall: callExpression.callee.name,
                },
                x,
                y,
              };
              adjustCoordinate(200, 0, false, false);

              lastNodeType = 'call-function';
              nodeList.push(callFunctionNode);
              createConnections(callFunctionNode.id);
              lastNodeId = callFunctionNode.id;
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
            adjustCoordinate(50, -47, false, false);

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
            adjustCoordinate(200, 0, false, false);

            createConnections(ifStatementNode.id);
            const oldconnections = [...connections];
            const oldx = x;
            const oldy = y;
            const newConnections: string[] = [];
            if (ifStatement.consequent?.type === 'BlockStatement') {
              startThumbName = 'success';
              endThumbName = 'input';
              adjustCoordinate(0, -143, false, false);
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
              adjustCoordinate(0, 200, false, false);
              const blockStatement = ifStatement.alternate as IASTBlockNode;
              createFlowNodes(blockStatement.body);
              newConnections.push(lastNodeId);
            }
            connections.push(...newConnections);
            adjustCoordinate(0, oldy + 47, false, true);
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
