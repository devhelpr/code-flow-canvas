import {
  IFlowCanvasBase,
  ElementNodeMap,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  NodeType,
  ThumbConnectionType,
  hasNodeInputs,
} from '@devhelpr/visual-programming-system';
import { registerCustomFunction } from '@devhelpr/expression-compiler';
import { NodeInfo } from '../types/node-info';
import { OnNextNodeFunction } from '../follow-path/OnNextNodeFunction';
import { RunCounter } from '../follow-path/run-counter';
import { updateRunCounterElement } from '../follow-path/updateRunCounterElement';

registerCustomFunction('random', [], () => {
  return Math.round(Math.random() * 100);
});

export interface ConnectionExecute {
  connection: IConnectionNodeComponent<NodeInfo>;
  connectionValue: any;
  nodeStates: Map<string, any>;
  cursorOnly?: boolean;
  nextNodeStates?: Map<string, any>;
}

export let connectionExecuteHistory: ConnectionExecute[] = [];

const handleDecoratrs = (
  decorators: any[],
  executeOrder: 'before' | 'after',
  input: any,
  payload: any,
  scopeId?: string
) => {
  const executeDecorators = decorators.filter((e: any) => {
    return e.executeOrder === executeOrder;
  });
  let decoratorInput = input;
  executeDecorators.forEach((decorator: any) => {
    const decoratorNode = decorator.decoratorNode;
    if (decoratorNode && decoratorNode.nodeInfo?.compute) {
      const decoratorResult = decoratorNode.nodeInfo?.compute(
        decoratorInput,
        runIndex,
        payload,
        undefined,
        scopeId
      );
      if (decoratorResult && !decoratorResult.stop && decoratorResult.output) {
        decoratorInput = decoratorResult.output;
        console.log(
          `decorator output ${decorator.taskType}`,
          decoratorInput,
          'input was',
          input
        );
      } else {
        // ? error handling decorators ?
        //return false;
      }
    }
  });
  return decoratorInput;
};

const getVariablePayload = (
  _node: IRectNodeComponent<NodeInfo>,
  _canvasApp: IFlowCanvasBase<NodeInfo>,
  scopeId?: string
) => {
  // const dataNodesConnectionPairs =
  //   getNodeConnectionPairByIdWhereNodeIsEndpoint<NodeInfo>(
  //     canvasApp,
  //     node,
  //     undefined,
  //     undefined,
  //     true
  //   );
  // const payload: Record<string, unknown> = {};
  // if (dataNodesConnectionPairs) {
  //   dataNodesConnectionPairs.forEach((connectionInfo) => {
  //     if (connectionInfo.start) {
  //       const nodeInfo = connectionInfo.start.nodeInfo as unknown as any;
  //       if (nodeInfo && nodeInfo.getData) {
  //         payload['variable'] = nodeInfo.getData(scopeId) ?? 0;
  //       }
  //     }
  //   });
  // }
  // return payload;
  const payload = flowVariableScope[scopeId ?? 'global'];
  return payload ?? {};
};

let flowVariableScope: Record<string, Record<string, any>> = {};

export const initFlowVariableScope = () => {
  flowVariableScope = {};
};

export const setFlowVariableByScope = (
  variableName: string,
  value: any,
  scopeId?: string
) => {
  const scope = scopeId ?? 'global';
  if (!flowVariableScope[scope]) {
    flowVariableScope[scope] = {};
  }
  flowVariableScope[scope][variableName] = value;
};

const triggerExecution = (
  node: IRectNodeComponent<NodeInfo>,
  canvasApp: IFlowCanvasBase<NodeInfo>,
  result: any,

  onStopped: undefined | ((input: string | any[], scopeId?: string) => void),
  followPath: string | undefined,
  offsetX?: number,
  offsetY?: number,
  scopeId?: string,
  runCounter?: RunCounter
) => {
  let lastConnectionExecutionHistory: ConnectionExecute | undefined = undefined;
  if (result !== undefined) {
    const animateFunctions = canvasApp.getAnimationFunctions();
    animateFunctions?.animatePathFunction(
      node,
      'white',
      ((
        _nodeId: string,
        nextNode: IRectNodeComponent<NodeInfo>,
        input: string | any[],
        connection: IConnectionNodeComponent<NodeInfo>,
        scopeId?: string
      ) => {
        let result: any = false;
        const formInfo = nextNode.nodeInfo as unknown as any;
        const storeNodeStates = () => {
          const nodeStates = canvasApp.getNodeStates();
          if (!canvasApp.isContextOnly) {
            let inputToHistory: any = input;
            let inputAsObject: any = input;
            if (
              inputAsObject &&
              typeof inputAsObject === 'object' &&
              inputAsObject.connectionHistory === false
            ) {
              inputToHistory = undefined;
            }

            lastConnectionExecutionHistory = {
              connection:
                connection as unknown as IConnectionNodeComponent<NodeInfo>,
              connectionValue: inputToHistory,
              nodeStates: nodeStates,
            };
            connectionExecuteHistory.push(lastConnectionExecutionHistory);
          }
        };
        storeNodeStates();
        if (runCounter) {
          if (
            nextNode.nodeInfo?.isUINode &&
            hasNodeInputs(nextNode) &&
            !runCounter.pushCallstack(
              `${scopeId}_${nextNode.id}_${
                connection.endNodeThumb?.thumbName ?? ''
              }`
            )
          ) {
            if (onStopped) {
              onStopped(input, scopeId);
            }
            return Promise.resolve({
              result: input as any,
              stop: true,
              output: input as any,
            });
          }
        }
        const payload = getVariablePayload(nextNode, canvasApp, scopeId);
        if (formInfo && formInfo.computeAsync) {
          if (formInfo.decorators) {
            const decoratorInput = handleDecoratrs(
              formInfo.decorators,
              'before',
              input,
              payload,
              scopeId
            );
            if (decoratorInput === false) {
              return {
                result: false,
                output: undefined,
              };
            }
            input = decoratorInput;
          }

          const promise = formInfo.computeAsync(
            input,
            runIndex,
            payload,
            connection?.endNodeThumb?.thumbName,
            scopeId,
            runCounter,
            connection
          );

          return new Promise((resolve, reject) => {
            promise
              .then((computeResult: any) => {
                if (computeResult.stop && !computeResult.dummyEndpoint) {
                  if (lastConnectionExecutionHistory) {
                    lastConnectionExecutionHistory.nextNodeStates =
                      canvasApp.getNodeStates();
                    lastConnectionExecutionHistory = undefined;
                  }
                  if (onStopped) {
                    if (runCounter) {
                      runCounter.decrementRunCounter();
                      updateRunCounterElement(runCounter);
                      runCounter.callRunCounterResetHandler();
                    }
                    onStopped(computeResult.output ?? '', scopeId);
                  }
                } else {
                  if (computeResult.stop && computeResult.dummyEndpoint) {
                    lastConnectionExecutionHistory = undefined;
                    console.log('dummyEndpoint(2)', computeResult.output);
                    if (computeResult.output) {
                      resolve({
                        result: computeResult.output,
                        output: computeResult.output,
                        stop: true,
                      });
                    } else {
                      resolve({
                        result: false,
                        output: '',
                        stop: true,
                      });
                    }
                    return;
                  }
                  result = computeResult.result;

                  followPath = computeResult.followPath;

                  resolve({
                    result: true,
                    output: computeResult.output ?? input,
                    followPathByName: followPath,
                    followThumb: computeResult.followThumb,
                  });
                }
              })
              .catch((error: any) => {
                lastConnectionExecutionHistory = undefined;
                reject(error);
              });
          });
        } else if (formInfo && formInfo.compute) {
          if (formInfo.decorators) {
            const decoratorInput = handleDecoratrs(
              formInfo.decorators,
              'before',
              input,
              payload,
              scopeId
            );
            if (decoratorInput === false) {
              return {
                result: false,
                output: undefined,
              };
            }
            input = decoratorInput;
          }
          const computeResult = formInfo.compute(
            input,
            runIndex,
            payload,
            connection?.endNodeThumb?.thumbName,
            scopeId,
            runCounter,
            connection
          );
          result = computeResult.result;

          followPath = computeResult.followPath;

          if (computeResult.stop) {
            if (lastConnectionExecutionHistory) {
              lastConnectionExecutionHistory.nextNodeStates =
                canvasApp.getNodeStates();
              lastConnectionExecutionHistory = undefined;
            }

            if (onStopped) {
              onStopped(computeResult.output ?? '', scopeId);
            }
            return {
              result: result,
              stop: true,
              output: result,
            };
          }
          if (formInfo.decorators) {
            if (formInfo.decorators) {
              const decoratorInput = handleDecoratrs(
                formInfo.decorators,
                'after',
                input,
                payload,
                scopeId
              );
              if (decoratorInput === false) {
                return {
                  result: false,
                  output: undefined,
                };
              }
              input = decoratorInput;
            }
          }
        } else {
          result = false;
          followPath = undefined;
        }
        if (result === undefined) {
          return {
            result: false,
            output: result,
          };
        }

        return {
          result: true,
          output: result ?? input,
          followPathByName: followPath,
        };
      }) as OnNextNodeFunction<NodeInfo>,
      (input: string | any[]) => {
        if (lastConnectionExecutionHistory) {
          lastConnectionExecutionHistory.nextNodeStates =
            canvasApp.getNodeStates();
          lastConnectionExecutionHistory = undefined;
        }

        if (onStopped) {
          onStopped(input, scopeId);
        }
      },
      result,
      followPath,
      undefined,
      offsetX,
      offsetY,
      undefined,
      undefined,
      undefined,
      scopeId,
      runCounter
    );
  } else {
    //console.log('expression result', result);
  }
};

let runIndex = 0;
export const resetRunIndex = () => {
  runIndex = 0;
};
export const increaseRunIndex = () => {
  runIndex++;
};
export const getRunIndex = () => {
  return runIndex;
};

export const runNode = (
  node: IRectNodeComponent<NodeInfo>,
  canvasApp: IFlowCanvasBase<NodeInfo>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string,
  offsetX?: number,
  offsetY?: number,
  loopIndex?: number,
  connection?: IConnectionNodeComponent<NodeInfo>,
  scopeId?: string,
  runCounter?: RunCounter,
  shouldClearExecutionHistory = false,
  inputPayload?: any
): void => {
  if (runCounter) {
    let thumbName = '';
    const endThumbs =
      node.thumbConnectors?.filter(
        (e) => e.thumbConnectionType === ThumbConnectionType.end
      ) ?? [];
    if (endThumbs.length === 1) {
      thumbName = endThumbs[0].thumbName;
    }

    if (
      node.nodeInfo?.isUINode &&
      hasNodeInputs(node) &&
      !runCounter.pushCallstack(`${scopeId}_${node.id}_${thumbName}`)
    ) {
      if (onStopped) {
        onStopped(input ?? '', scopeId);
      }
      return;
    }
  }

  const payload = inputPayload ?? getVariablePayload(node, canvasApp);
  if (shouldClearExecutionHistory) {
    console.log('runNode: clearing connectionExecuteHistory');
    connectionExecuteHistory = [];
  }
  const formInfo = node.nodeInfo as unknown as any;
  let result: any = false;
  let followPath: string | undefined = undefined;

  if (formInfo && formInfo?.computeAsync) {
    if (formInfo.decorators) {
      const decoratorInput = handleDecoratrs(
        formInfo.decorators,
        'before',
        input,
        payload,
        scopeId
      );
      if (decoratorInput === false) {
        return;
      }
      input = decoratorInput;
    }

    formInfo
      .computeAsync(
        input ?? '',
        loopIndex === undefined ? runIndex : loopIndex,
        payload,
        connection?.endNodeThumb?.thumbName,
        scopeId,
        runCounter,
        connection
      )
      .then((computeResult: any) => {
        result = computeResult.result;
        followPath = computeResult.followPath;

        if (computeResult.dummyEndpoint) {
          console.log('dummyEndpoint', computeResult.output);
          return;
        }
        if (computeResult.stop) {
          if (onStopped) {
            onStopped(computeResult.output ?? '', scopeId);
          }
          return;
        }
        triggerExecution(
          node,
          canvasApp,
          result,

          onStopped,
          followPath,
          offsetX,
          offsetY,
          scopeId,
          runCounter
        );
      });
  } else if (formInfo && formInfo?.compute) {
    if (formInfo.decorators) {
      const decoratorInput = handleDecoratrs(
        formInfo.decorators,
        'before',
        input,
        payload,
        scopeId
      );
      if (decoratorInput === false) {
        return;
      }
      input = decoratorInput;
    }
    const computeResult = formInfo.compute(
      input ?? '',
      loopIndex === undefined ? runIndex : loopIndex,
      payload,
      connection?.endNodeThumb?.thumbName,
      scopeId,
      runCounter,
      connection
    );

    result = computeResult.result;
    followPath = computeResult.followPath;
    if (computeResult.stop) {
      if (onStopped) {
        onStopped(computeResult.output ?? '', scopeId);
      }
      return;
    }

    if (formInfo.decorators) {
      const decoratorInput = handleDecoratrs(
        formInfo.decorators,
        'after',
        input,
        payload,
        scopeId
      );
      if (decoratorInput === false) {
        return;
      }
      input = decoratorInput;
    }

    triggerExecution(
      node,
      canvasApp,
      result,
      onStopped,
      followPath,
      offsetX,
      offsetY,
      scopeId,
      runCounter
    );
  } else {
    result = false;
    followPath = undefined;
  }
};

export const getStartNodes = (
  nodes: ElementNodeMap<NodeInfo>,
  includeFunctionNodes = false
) => {
  const startNodes: IRectNodeComponent<NodeInfo>[] = [];
  const nodeList = Array.from(nodes);
  nodes.forEach((node) => {
    const nodeComponent = node as unknown as IRectNodeComponent<NodeInfo>;
    const connectionsFromEndNode = nodeList.filter((e) => {
      const eNode = e[1] as INodeComponent<NodeInfo>;
      if (eNode.nodeType === NodeType.Connection) {
        const element = e[1] as IConnectionNodeComponent<NodeInfo>;
        return (
          element.endNode?.id === node.id &&
          !element.isData &&
          !element.isAnnotationConnection
        );
      }
      return false;
    });
    const nodeInfo = nodeComponent.nodeInfo as any;
    if (
      !(nodeComponent.nodeInfo as any)?.isVariable &&
      nodeComponent.nodeType !== NodeType.Connection &&
      (!connectionsFromEndNode || connectionsFromEndNode.length === 0) &&
      ((!includeFunctionNodes &&
        nodeInfo?.type !== 'node-trigger-target' &&
        nodeInfo?.type !== 'function') ||
        includeFunctionNodes)
    ) {
      startNodes.push(nodeComponent);
    }
  });
  return startNodes;
};

export const run = (
  nodes: ElementNodeMap<NodeInfo>,
  canvasApp: IFlowCanvasBase<NodeInfo>,
  onFinishRun?: (input: string | any[]) => void,
  input?: string,
  offsetX?: number,
  offsetY?: number,
  runCounter?: RunCounter,
  shouldResetConnectionSlider?: boolean
) => {
  /*
	TODO : simple flow engine to run the nodes

    .. get all nodes that have no input
    .. run these nodes using animatePath

    .. animatePath needs an event function which is called when a node is reached
    .. in that event run the expression for that node:
      .. it errors .. stop the flow

  */
  if (!canvasApp.isContextOnly && shouldResetConnectionSlider) {
    connectionExecuteHistory = [];
    console.log('run: clear connectionExecuteHistory');
  }

  let isRunning = false;
  const executeNodes: IRectNodeComponent<NodeInfo>[] = getStartNodes(nodes);

  executeNodes.forEach((nodeComponent) => {
    isRunning = true;

    let inputPayload: any = undefined;
    let useInput = input;
    if (nodeComponent.nodeInfo?.canBeStartedByTrigger) {
      inputPayload = {
        trigger: true,
      } as unknown as string;
      if (
        nodeComponent.nodeInfo?.readPropertyFromNodeInfoForInitialTrigger &&
        nodeComponent.nodeInfo?.formValues
      ) {
        useInput =
          nodeComponent.nodeInfo?.formValues[
            nodeComponent.nodeInfo.readPropertyFromNodeInfoForInitialTrigger
          ];
      }
    }

    runNode(
      nodeComponent,
      canvasApp,
      (input: string | any[]) => {
        if (runCounter?.runCounter !== undefined) {
          if (onFinishRun && runCounter?.runCounter <= 0) {
            onFinishRun(input);
          }
        }
      },
      useInput,
      offsetX,
      offsetY,
      undefined,
      undefined,
      undefined,
      runCounter,
      undefined,
      inputPayload
    );
  });
  if (!isRunning) {
    if (onFinishRun) {
      onFinishRun('');
    }
  }
  return true;
};

export const runNodeFromThumb = (
  nodeThumb: IThumbNodeComponent<NodeInfo>,
  canvasApp: IFlowCanvasBase<NodeInfo>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: any,
  _scopeNode?: IRectNodeComponent<NodeInfo>,
  loopIndex?: number,
  scopeId?: string,
  runCounter?: RunCounter,
  showCursorOnly = false
) => {
  //let result: any = false;
  let firstStoreNodeState = true;
  let followPath: string | undefined = undefined;
  let lastConnectionExecutionHistory: ConnectionExecute | undefined = undefined;
  const animateFunctions = canvasApp.getAnimationFunctions();
  animateFunctions?.animatePathFromThumbFunction(
    nodeThumb,
    'white',
    (
      _nodeId: string,
      nextNode: IRectNodeComponent<NodeInfo>,
      input: string | any[],
      connection: IConnectionNodeComponent<NodeInfo>,
      scopeId?: string
    ) => {
      const storeNodeStates = () => {
        if (!canvasApp.isContextOnly) {
          let inputToHistory: any = input;
          let inputAsObject: any = input;
          if (
            inputAsObject &&
            typeof inputAsObject === 'object' &&
            inputAsObject.connectionHistory === false
          ) {
            inputToHistory = undefined;
          }
          lastConnectionExecutionHistory = {
            connection:
              connection as unknown as IConnectionNodeComponent<NodeInfo>,
            connectionValue: inputToHistory,
            nodeStates: canvasApp.getNodeStates(),
            cursorOnly: firstStoreNodeState && showCursorOnly === true,
          };
          connectionExecuteHistory.push(lastConnectionExecutionHistory);
        }
      };
      storeNodeStates();
      firstStoreNodeState = false;

      if (runCounter) {
        if (
          nextNode.nodeInfo?.isUINode &&
          hasNodeInputs(nextNode) &&
          !runCounter.pushCallstack(
            `${scopeId}_${nextNode.id}_${
              connection.endNodeThumb?.thumbName ?? ''
            }`
          )
        ) {
          if (onStopped) {
            onStopped(input, scopeId);
          }
          return Promise.resolve({
            result: input as any,
            stop: true,
            output: input as any,
          });
        }
      }
      const payload = getVariablePayload(nextNode, canvasApp, scopeId);
      let result: any = false;
      const formInfo = nextNode.nodeInfo as unknown as any;
      //console.log('runNodeFromThumb', loopIndex, nextNode);
      if (formInfo && formInfo.computeAsync) {
        if (formInfo.decorators) {
          const decoratorInput = handleDecoratrs(
            formInfo.decorators,
            'before',
            input,
            payload,
            scopeId
          );
          if (decoratorInput === false) {
            return {
              result: false,
              output: undefined,
            };
          }
          input = decoratorInput;
        }
        return new Promise((resolve, reject) => {
          formInfo
            .computeAsync(
              input,
              loopIndex,
              payload,
              connection?.endNodeThumb?.thumbName,
              scopeId,
              runCounter,
              connection
            )
            .then((computeResult: any) => {
              result = computeResult.result;
              followPath = computeResult.followPath;
              if (computeResult.stop) {
                if (lastConnectionExecutionHistory) {
                  lastConnectionExecutionHistory.nextNodeStates =
                    canvasApp.getNodeStates();
                  lastConnectionExecutionHistory = undefined;
                }

                resolve({
                  result: result,
                  stop: true,
                  output: result,
                });
              } else {
                resolve({
                  result: true,
                  output: result ?? input,
                  followPathByName: followPath,
                });
              }
            })
            .catch((e: any) => {
              console.log('runNodeFromThumb error', e);
              reject();
            });
        });
      } else if (formInfo && formInfo.compute) {
        if (formInfo.decorators) {
          const decoratorInput = handleDecoratrs(
            formInfo.decorators,
            'before',
            input,
            payload,
            scopeId
          );
          if (decoratorInput === false) {
            return {
              result: false,
              output: undefined,
            };
          }
          input = decoratorInput;
        }

        const computeResult = formInfo.compute(
          input,
          loopIndex,
          payload,
          connection?.endNodeThumb?.thumbName,
          scopeId,
          runCounter,
          connection
        );
        result = computeResult.result;
        followPath = computeResult.followPath;

        //previousOutput = computeResult.previousOutput;
        if (computeResult.stop) {
          if (lastConnectionExecutionHistory) {
            lastConnectionExecutionHistory.nextNodeStates =
              canvasApp.getNodeStates();
            lastConnectionExecutionHistory = undefined;
          }

          return {
            result: result,
            stop: true,
            output: result,
          };
        }
      } else {
        result = false;
        followPath = undefined;
      }
      //console.log('expression result', result);
      if (result === undefined) {
        return {
          result: false,
          output: result,
        };
      }

      if (formInfo.decorators) {
        const decoratorInput = handleDecoratrs(
          formInfo.decorators,
          'after',
          input,
          undefined,
          scopeId
        );
        if (decoratorInput === false) {
          return {
            result: false,
            output: undefined,
          };
        }
        input = decoratorInput;
      }
      return {
        result: true,
        output: result ?? input,
        followPathByName: followPath,
      };
    },
    (input: string | any[]) => {
      if (lastConnectionExecutionHistory) {
        lastConnectionExecutionHistory.nextNodeStates =
          canvasApp.getNodeStates();
        lastConnectionExecutionHistory = undefined;
      }

      if (onStopped) {
        onStopped(input, scopeId);
      }
    },
    input,
    followPath,
    {
      cursorOnly: showCursorOnly,
    },
    undefined,
    undefined,
    undefined,
    undefined,
    scopeId,
    runCounter
  );
};
