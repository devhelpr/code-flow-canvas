import {
  IFlowCanvasBase,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createFlowCanvas,
  IRectNodeComponent,
  FormFieldType,
  InitialValues,
  NodeTask,
  IConnectionNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

import {
  StateMachine,
  State,
  Transition,
  StateTransition,
} from '../state-machine';
import { RunCounter } from '../follow-path/run-counter';
import {
  runNodeFromThumb,
  connectionExecuteHistory,
} from '../flow-engine/flow-engine';

// TODO : make example with state-compound and check if correct nodes are updated (classlist)

export const createStateMachine = (
  canvasAppInstance: IFlowCanvasBase<NodeInfo>,
  isCompound = false
): StateMachine<NodeInfo> => {
  let initialState: State<NodeInfo> | undefined = undefined;
  const states: State<NodeInfo>[] = [];
  const nodeList = Array.from(canvasAppInstance?.elements);
  const stateNodes = nodeList
    .filter(
      (n) =>
        (n[1] as unknown as INodeComponent<NodeInfo>).nodeInfo?.type ===
          'state' ||
        (n[1] as unknown as INodeComponent<NodeInfo>).nodeInfo?.type ===
          'state-compound'
    )
    .map((n) => n[1] as unknown as IRectNodeComponent<NodeInfo>);

  stateNodes.forEach((stateNode) => {
    const state: State<NodeInfo> = {
      name: stateNode.nodeInfo?.formValues?.caption ?? '',
      id: stateNode.id ?? '',
      transitions: [],
      isFinal: false,
      nodeComponent: stateNode as unknown as IRectNodeComponent<NodeInfo>,
    };

    (stateNode.domElement as HTMLElement)?.classList.remove('state-active');

    if (
      stateNode.nodeInfo?.canvasAppInstance &&
      stateNode.nodeInfo?.type === 'state-compound'
    ) {
      const compoundState = createStateMachine(
        stateNode.nodeInfo.canvasAppInstance,
        true
      );
      stateNode.nodeInfo.stateMachine = compoundState;
      state.stateMachine = compoundState;
    }

    stateNode.connections?.forEach((connection) => {
      if (connection.startNode && connection.startNode.id === stateNode.id) {
        if (
          connection.endNode &&
          connection.endNode.nodeInfo?.type === 'state-transition'
        ) {
          // TODO : get connections from endNode to next state
          // TODO : support for max limit connections on thumbs (transition should have max 1 output and 1 input)
          const nextStates = connection.endNode.connections?.filter(
            (c) =>
              c.startNode &&
              c.startNode?.id === connection.endNode?.id &&
              c.endNode &&
              (c.endNode?.nodeInfo?.type === 'state' ||
                c.endNode?.nodeInfo?.type === 'state-compound')
          );
          if (connection.endNode && nextStates && nextStates.length >= 1) {
            nextStates.forEach((nextState) => {
              if (connection.endNode && nextState && nextState.endNode) {
                const transition: Transition<NodeInfo> = {
                  name: connection.endNode.nodeInfo?.formValues?.caption ?? '',
                  from: stateNode.id,
                  to: nextState.endNode.id,
                  nodeComponent:
                    connection.endNode as unknown as IRectNodeComponent<NodeInfo>,
                  connectionIn: connection,
                  connectionOut: nextState,
                };
                state.transitions.push(transition);
              }
            });
          }
        }
      }
    });
    states.push(state);

    initialState = isCompound ? undefined : states[0] ?? undefined;
  });
  return { states, initialState, currentState: initialState };
};

export const resetStateMachine = (stateMachine: StateMachine<NodeInfo>) => {
  if (stateMachine.currentState) {
    if (stateMachine.currentState.stateMachine) {
      resetStateMachine(stateMachine.currentState.stateMachine);
    }
  }
};

export const initStateMachine = (stateMachine: StateMachine<NodeInfo>) => {
  if (!stateMachine.currentState) {
    stateMachine.initialState = stateMachine.states[0];
    stateMachine.currentState = stateMachine.initialState;
  }
  (
    stateMachine.currentState.nodeComponent.domElement as HTMLElement
  )?.classList.add('state-active');
};

export const transitionToState = (
  stateMachine: StateMachine<NodeInfo>,
  transitionName: string
): StateTransition<NodeInfo> | false => {
  if (stateMachine.currentState) {
    console.log(
      'transitionToState, currentState:',
      stateMachine.currentState,
      'transition:',
      transitionName
    );
    if (stateMachine.currentState.transitions.length > 0) {
      const transition = stateMachine.currentState.transitions.find(
        (transition) => transition.name === transitionName
      );
      if (transition) {
        resetStateMachine(stateMachine);

        const nextStateId = transition.to;
        console.log('nextStateName', nextStateId);
        const nextState = stateMachine.states.find((s) => s.id === nextStateId);
        if (nextState) {
          stateMachine.currentState = nextState;

          if (nextState.stateMachine) {
            initStateMachine(nextState.stateMachine);
          }
          return { transition, nextState };
        }
      } else {
        if (stateMachine.currentState.stateMachine) {
          return transitionToState(
            stateMachine.currentState.stateMachine,
            transitionName
          );
        }
      }
    }
  }

  return false;
};

export const createStateMachineNode = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let input: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let output: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let stateMachine: StateMachine<NodeInfo> | undefined = undefined;
  let captionNodeComponent: INodeComponent<NodeInfo> | undefined = undefined;
  let rootCanvasApp: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    stateMachine = undefined;
    removeAllActiveStates();
    if (canvasAppInstance?.elements && !stateMachine) {
      stateMachine = undefined;
      stateMachine = createStateMachine(canvasAppInstance);
      console.log('stateMachine', stateMachine);
      if (stateMachine && stateMachine.currentState) {
        (
          stateMachine.currentState.nodeComponent.domElement as HTMLElement
        )?.classList.add('state-active');
      }
    }
    return;
  };
  const computeAsync = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter,
    connection?: IConnectionNodeComponent<NodeInfo>
  ) => {
    return new Promise((resolve, _reject) => {
      let flow1Ran = false;
      let flow2Ran = false;
      let runFlows = false;
      if (!stateMachine && canvasAppInstance) {
        stateMachine = createStateMachine(canvasAppInstance);
      }
      if (connection?.startNode?.nodeInfo?.type === 'start-node') {
        // Is this enough !??? should runNode be called?
        console.log(
          'statemachine started by start-node',
          stateMachine?.currentState
        );
        resolve({
          result: stateMachine?.currentState?.name,
          output: stateMachine?.currentState?.name,
          followPath: undefined,
        });
        return;
      }
      if (stateMachine && rootCanvasApp) {
        const stateEvent =
          typeof input === 'object' ? (input as any).stateEvent : input;
        const nextStateTransition = transitionToState(stateMachine, stateEvent);

        console.log('NEXTSTATE trigger', nextStateTransition);
        if (
          nextStateTransition &&
          nextStateTransition.transition.connectionIn?.startNode &&
          nextStateTransition.transition.connectionIn?.endNode
        ) {
          //rootCanvasApp
          const animateFunctions = rootCanvasApp.getAnimationFunctions();

          animateFunctions?.animatePathFromConnectionPairFunction(
            canvasAppInstance!,
            [
              {
                start: nextStateTransition.transition.connectionIn?.startNode,
                connection: nextStateTransition.transition.connectionIn,
                end: nextStateTransition.transition.connectionIn?.endNode,
              },
            ],
            'white',
            (_nodeId, _node, _input, _connection) => {
              if (
                nextStateTransition &&
                nextStateTransition.transition.connectionOut?.startNode &&
                nextStateTransition.transition.connectionOut?.endNode
              ) {
                const animateFunctions = rootCanvasApp!.getAnimationFunctions();
                animateFunctions?.animatePathFromConnectionPairFunction(
                  canvasAppInstance!,
                  [
                    {
                      start:
                        nextStateTransition.transition.connectionOut?.startNode,
                      connection: nextStateTransition.transition.connectionOut,
                      end: nextStateTransition.transition.connectionOut
                        ?.endNode,
                    },
                  ],
                  'white',
                  (_nodeId, _node, _input, _connection) => {
                    removeAllActiveStates();
                    if (stateMachine && stateMachine.currentState) {
                      (
                        stateMachine.currentState.nodeComponent
                          .domElement as HTMLElement
                      )?.classList.add('state-active');
                    }

                    runFlows = true;
                    const eventName = `${nextStateTransition.transition.name}-${nextStateTransition.nextState.name}`;
                    if (node && rootCanvasApp && node.thumbConnectors?.[1]) {
                      runNodeFromThumb(
                        node.thumbConnectors[1],
                        rootCanvasApp,
                        (inputFromSecondRun: string | any[]) => {
                          flow1Ran = true;

                          if (flow1Ran && flow2Ran) {
                            resolve({
                              result: inputFromSecondRun,
                              output: inputFromSecondRun,
                              stop: true,
                              dummyEndpoint: true,
                            });
                          }
                        },
                        eventName,
                        node,
                        0,
                        scopeId,
                        runCounter
                      );
                    }
                    if (
                      canvasAppInstance &&
                      nextStateTransition.transition.connectionIn
                    ) {
                      connectionExecuteHistory.push({
                        connection: nextStateTransition.transition.connectionIn,
                        connectionValue: input,
                        nodeStates: canvasAppInstance.getNodeStates(),
                        cursorOnly: true,
                      });
                    }

                    if (
                      canvasAppInstance &&
                      nextStateTransition.transition.connectionOut
                    ) {
                      connectionExecuteHistory.push({
                        connection:
                          nextStateTransition.transition.connectionOut,
                        connectionValue: input,
                        nodeStates: canvasAppInstance.getNodeStates(),
                        cursorOnly: true,
                      });
                    }

                    let mainOutputNodeRan = false;
                    if (typeof input === 'object' && (input as any).value) {
                      const stateEvent = {
                        state: nextStateTransition.nextState.name,
                        value: (input as any).value,
                      };
                      if (rootCanvasApp && node.thumbConnectors?.[0]) {
                        runNodeFromThumb(
                          node.thumbConnectors[0],
                          rootCanvasApp,
                          (inputFromSecondRun: string | any[]) => {
                            flow2Ran = true;

                            if (flow1Ran && flow2Ran) {
                              resolve({
                                result: inputFromSecondRun,
                                output: inputFromSecondRun,
                                stop: true,
                                dummyEndpoint: true,
                              });
                            }
                          },
                          stateEvent,
                          node,
                          0,
                          scopeId,
                          runCounter
                        );
                        mainOutputNodeRan = true;
                      }
                    }

                    if (
                      !mainOutputNodeRan &&
                      rootCanvasApp &&
                      node.thumbConnectors?.[0]
                    ) {
                      runNodeFromThumb(
                        node.thumbConnectors[0],
                        rootCanvasApp,
                        (inputFromSecondRun: string | any[]) => {
                          flow2Ran = true;
                          if (flow1Ran && flow2Ran) {
                            resolve({
                              result: inputFromSecondRun,
                              output: inputFromSecondRun,
                              stop: true,
                              dummyEndpoint: true,
                            });
                          }
                        },
                        nextStateTransition.nextState.name,
                        node,
                        0,
                        scopeId,
                        runCounter
                      );
                    }
                    return {
                      result: false,
                      stop: true,
                      output: '',
                      followPathByName: undefined,
                    };
                  },
                  () => {
                    //
                  },
                  input,
                  undefined,
                  {
                    cursorOnly: true,
                  },
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  scopeId,
                  runCounter
                );
              }
              return {
                result: false,
                stop: true,
                output: '',
                followPathByName: undefined,
              };
            },
            () => {
              //
            },
            input,
            undefined,
            {
              cursorOnly: true,
            },
            undefined,
            undefined,
            undefined,
            undefined,
            scopeId,
            runCounter
          );

          return;
        } else {
          removeAllActiveStates();
          if (stateMachine.currentState) {
            (
              stateMachine.currentState.nodeComponent.domElement as HTMLElement
            )?.classList.add('state-active');
          }
        }
      }
      if (!runFlows) {
        //reject();
        resolve({
          result: false,
          output: false,
          stop: true,
        });
      }
    });
  };

  const getNodeStatedHandler = () => {
    return {
      data: stateMachine?.currentState ?? '',
      id: node.id,
    };
  };

  const removeAllActiveStates = () => {
    canvasAppInstance?.rootElement
      .querySelectorAll('.state-active')
      .forEach((el) => {
        el.classList.remove('state-active');
      });
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    //updateVisual(data);
    removeAllActiveStates();
    if (
      stateMachine &&
      data &&
      data.nodeComponent &&
      data.nodeComponent.domElement
    ) {
      (data.nodeComponent.domElement as HTMLElement)?.classList.add(
        'state-active'
      );
    }
  };

  const updateVisual = (_data: any) => {
    //
  };

  return {
    name: 'state-machine',
    family: 'flow-canvas',
    isContainer: true,
    category: 'state-machine',
    childNodeTasks: ['state', 'state-transition', 'state-compound'],
    getConnectionInfo: () => {
      if (!input || !output) {
        return { inputs: [], outputs: [] };
      }
      return { inputs: [input], outputs: [output] };
    },
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number,
      nestedLevel?: number
    ) => {
      const initialValue = initalValues?.['caption'] ?? 'State';
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'caption',
          value: initialValue ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              caption: value,
            };
            if (captionNodeComponent) {
              captionNodeComponent.domElement.textContent =
                node.nodeInfo.formValues['caption'] ?? 'State';
            }

            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];

      htmlNode = createElement(
        'div',
        {
          class: 'w-full h-full overflow-hidden',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      let background = 'bg-slate-500';
      if ((nestedLevel ?? 0) % 2 === 0) {
        background = 'bg-slate-600';
      }
      const wrapper = createElement(
        'div',
        {
          class: ` rounded ${
            containerNode ? background + ' border border-white' : 'bg-slate-400'
          }`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        width ?? 600,
        height ?? 400,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            name: 'output',
            label: nestedLevel ?? 0 > 0 ? ' ' : '#',
            thumbConstraint: nestedLevel ?? 0 > 0 ? 'transition' : 'value',
            color: 'white',
            maxConnections: -1,
            prefixLabel: 'state',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            name: 'event',
            label: nestedLevel ?? 0 > 0 ? ' ' : '#',
            thumbConstraint: nestedLevel ?? 0 > 0 ? 'event' : 'value',
            color: 'white',
            maxConnections: -1,
            prefixLabel: 'event',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            name: 'input',
            label: nestedLevel ?? 0 > 0 ? ' ' : '#',
            thumbConstraint: nestedLevel ?? 0 > 0 ? 'transition' : 'value',
            color: 'white',
            maxConnections: -1,
          },
        ],
        wrapper,
        {
          //classNames: `p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          formElements: nestedLevel === 0 ? [] : formElements,
          type: 'state-machine',
          taskType: 'state-machine',
          formValues: {
            caption: initialValue ?? '',
          },
        },
        containerNode,
        undefined,
        'rect-node container-node'
      );
      // rect.nodeComponent.nodeInfo = {};
      // rect.nodeComponent.nodeInfo.formElements = [];
      // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      rect.nodeComponent.nestedLevel = nestedLevel ?? 0;

      if ((nestedLevel ?? 0) > 0) {
        captionNodeComponent = createElement(
          'div',
          {
            class: `bg-black text-white absolute top-0 left-0 w-full px-4 py-2 z-[1050]`,
          },
          rect.nodeComponent.domElement as unknown as HTMLElement,
          `${initialValue} (${nestedLevel ?? 0})`
        ) as unknown as INodeComponent<NodeInfo>;
      }

      if (htmlNode.domElement) {
        // TODO : fix why this inner cointainer canvas sends
        // double mouse events to the parent canvas/outer rect and causes
        // bad coordinate transform on mouseup
        canvasAppInstance = createFlowCanvas<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          false, //disableInteraction
          true,
          canvasApp.interactionStateMachine,
          undefined,
          undefined,
          undefined,
          true
        );
        console.log('canvasAppInstance', canvasAppInstance.canvas.id);
        rect.nodeComponent.canvasAppInstance = canvasAppInstance;

        const inputInstance = canvasAppInstance.createRect(
          -1,
          0,
          1,
          1,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              //hidden: true,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
            },
            {
              thumbType: ThumbType.EndConnectorLeft,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
              hidden: true,
            },
          ],
          '',
          {
            classNames: `pointer-events-auto z-[1150]`,
          },
          true,
          false,
          undefined,
          id + '_input',
          undefined,
          rect.nodeComponent,
          true
        );
        input = inputInstance.nodeComponent;

        const outputInstance = canvasAppInstance.createRect(
          width ?? 600,
          0,
          1,
          1,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              hidden: true,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
            },
            {
              thumbType: ThumbType.EndConnectorLeft,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              thumbConstraint: 'value',
              color: 'white',
              label: '#',
            },
          ],
          '',
          {
            classNames: `pointer-events-auto z-[1150]`,
          },
          true,
          false,
          undefined,
          id + '_output',
          undefined,
          rect.nodeComponent,
          true
        );
        output = outputInstance.nodeComponent;

        canvasAppInstance.setOnCanvasUpdated(() => {
          updated?.();
          stateMachine = undefined;
        });

        rect.addUpdateEventListener((target, _x, _y, _initiator) => {
          //console.log('rect update', target, x, y, initiator);
          if (target) {
            outputInstance.nodeComponent?.update?.(
              outputInstance.nodeComponent,
              target?.width,
              0,
              rect?.nodeComponent
            );
          }
        });

        (canvasAppInstance.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-auto'
        );
      }

      node = rect.nodeComponent;

      if (node.nodeInfo) {
        if (nestedLevel ?? 0 > 0) {
          node.nodeInfo.formElements = formElements;
        }
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.canvasAppInstance = canvasAppInstance;

        node.nodeInfo.updateVisual = updateVisual;

        rootCanvasApp = canvasApp;

        if (id) {
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        }

        // node.nodeInfo.noCompositionAllowed = true;
      }
      return node;
    },
  };
};
