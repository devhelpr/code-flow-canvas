import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import { NodeInfo } from '../types/node-info';

import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { StateMachine, State, Transition } from '../state-machine';

export const createStateMachine = (
  canvasAppInstance: CanvasAppInstance<NodeInfo>,
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
    (
      stateMachine.currentState.nodeComponent.domElement as HTMLElement
    )?.classList.remove('state-active');
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
): State<NodeInfo> | false => {
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
          (
            stateMachine.currentState.nodeComponent.domElement as HTMLElement
          )?.classList.add('state-active');
          if (nextState.stateMachine) {
            initStateMachine(nextState.stateMachine);
          }
          return nextState;
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

export const createStateMachineNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  let input: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let output: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let stateMachine: StateMachine<NodeInfo> | undefined = undefined;
  let captionNodeComponent: INodeComponent<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    stateMachine = undefined;

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
  const compute = (input: string) => {
    if (!stateMachine && canvasAppInstance) {
      stateMachine = createStateMachine(canvasAppInstance);
      console.log('stateMachine', stateMachine);
      if (stateMachine && stateMachine.currentState) {
        (
          stateMachine.currentState.nodeComponent.domElement as HTMLElement
        )?.classList.add('state-active');
      }
    }
    if (stateMachine) {
      const stateEvent =
        typeof input === 'object' ? (input as any).stateEvent : input;
      const nextState = transitionToState(stateMachine, stateEvent);
      console.log('NEXTSTATE trigger', nextState);
      if (nextState) {
        if (typeof input === 'object' && (input as any).value) {
          const stateEvent = {
            state: nextState.name,
            value: (input as any).value,
          };
          return {
            result: stateEvent,
            followPath: undefined,
            output: stateEvent,
          };
        }

        return {
          result: nextState.name,
          followPath: undefined,
        };
      }
    }
    return {
      result: undefined,
      stop: true,
      followPath: undefined,
    };
  };

  return {
    name: 'state-machine',
    family: 'flow-canvas',
    isContainer: true,
    childNodeTasks: ['state', 'state-transition', 'state-compound'],
    getConnectionInfo: () => {
      if (!input || !output) {
        return { inputs: [], outputs: [] };
      }
      return { inputs: [input], outputs: [output] };
    },
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
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
        canvasAppInstance = createCanvasApp<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          false,
          true,
          '',
          canvasApp.interactionStateMachine,
          undefined,
          undefined,
          undefined,
          true
        );
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

        rect.addUpdateEventListener((target, x, y, initiator) => {
          console.log('rect update', target, x, y, initiator);
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
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.canvasAppInstance = canvasAppInstance;
        // node.nodeInfo.noCompositionAllowed = true;
      }
      return node;
    },
  };
};
