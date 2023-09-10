import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  IRectNodeComponent,
  thumbRadius,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { stat } from 'fs';

export interface Transition {
  name: string;
  from: string;
  to: string;
  nodeComponent: IRectNodeComponent<NodeInfo>;
}
export interface State {
  id: string;
  name: string;
  transitions: Transition[];
  isFinal: boolean;
  nodeComponent: IRectNodeComponent<NodeInfo>;
}

interface StateMachine {
  states: State[];
  initialState: State | undefined;
  currentState?: State;
}

const createStateMachine = (
  canvasAppInstance: CanvasAppInstance,
  visitedStates: string[] = []
): StateMachine => {
  let initialState: State | undefined = undefined;
  const states: State[] = [];
  const nodeList = Array.from(canvasAppInstance?.elements);
  const stateNodes = nodeList
    .filter(
      (n) =>
        (n[1] as unknown as INodeComponent<NodeInfo>).nodeInfo?.type === 'state'
    )
    .map((n) => n[1] as unknown as IRectNodeComponent<NodeInfo>);
  const transitions = nodeList
    .filter(
      (n) =>
        (n[1] as unknown as INodeComponent<NodeInfo>).nodeInfo?.type ===
        'state-transition'
    )
    .map((n) => n[1] as unknown as IRectNodeComponent<NodeInfo>);
  stateNodes.forEach((stateNode) => {
    const state: State = {
      name: stateNode.nodeInfo?.formValues?.caption ?? '',
      id: stateNode.id ?? '',
      transitions: [],
      isFinal: false,
      nodeComponent: stateNode as unknown as IRectNodeComponent<NodeInfo>,
    };
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
              c.endNode?.nodeInfo?.type === 'state'
          );
          if (
            connection.endNode &&
            nextStates &&
            nextStates.length >= 1 &&
            nextStates[0].endNode
          ) {
            const transition: Transition = {
              name: connection.endNode.nodeInfo?.formValues?.caption ?? '',
              from: stateNode.id,
              to: nextStates[0].endNode.id,
              nodeComponent:
                connection.endNode as unknown as IRectNodeComponent<NodeInfo>,
            };
            state.transitions.push(transition);
            if (visitedStates.indexOf(nextStates[0].endNode.id) < 0) {
              const { states: statesList } = createStateMachine(
                canvasAppInstance,
                [...visitedStates, nextStates[0].endNode.id]
              );
              states.push(...statesList);
            }
          }
        }
      }
    });
    states.push(state);

    initialState = states[0] ?? undefined;
  });
  return { states, initialState, currentState: initialState };
};

export const createStateMachineNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let canvasAppInstance: CanvasAppInstance | undefined = undefined;
  let input: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let output: IRectNodeComponent<NodeInfo> | undefined = undefined;
  let stateMachine: StateMachine | undefined = undefined;

  let currentValue = 0;
  const initializeCompute = () => {
    stateMachine = undefined;
    currentValue = 0;

    if (canvasAppInstance?.elements && !stateMachine) {
      stateMachine = undefined;
      stateMachine = createStateMachine(canvasAppInstance);
      if (stateMachine && stateMachine.currentState) {
        (
          stateMachine.currentState.nodeComponent.domElement as HTMLElement
        )?.classList.add('state-active');
      }
    }
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number
  ) => {
    if (!stateMachine && canvasAppInstance) {
      stateMachine = createStateMachine(canvasAppInstance);
      if (stateMachine && stateMachine.currentState) {
        (
          stateMachine.currentState.nodeComponent.domElement as HTMLElement
        )?.classList.add('state-active');
      }
    }
    if (stateMachine) {
      if (stateMachine.currentState) {
        console.log(
          'stateMachine.currentState',
          stateMachine.currentState,
          input
        );
        if (stateMachine.currentState.transitions.length > 0) {
          const transition = stateMachine.currentState.transitions.find(
            (transition) => transition.name === input
          );
          if (transition) {
            (
              stateMachine.currentState.nodeComponent.domElement as HTMLElement
            )?.classList.remove('state-active');
            const nextStateId = transition.to;
            console.log('nextStateName', nextStateId);
            const nextState = stateMachine.states.find(
              (s) => s.id === nextStateId
            );
            if (nextState) {
              stateMachine.currentState = nextState;
              (
                stateMachine.currentState.nodeComponent
                  .domElement as HTMLElement
              )?.classList.add('state-active');

              return {
                result: nextState.name,
                followPath: undefined,
              };
            }
          }
        }
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
    childNodeTasks: ['state', 'state-transition', 'state-machine'],
    getConnectionInfo: () => {
      if (!input || !output) {
        return { inputs: [], outputs: [] };
      }
      return { inputs: [input], outputs: [output] };
    },
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      initalValue?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number,
      nestedLevel?: number
    ) => {
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
            label: '#',
            thumbConstraint: 'value',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            name: 'input',
            label: '#',
            thumbConstraint: 'value',
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
          FormElements: [],
          type: 'state-machine',
          taskType: 'state-machine',
        },
        containerNode
      );
      // rect.nodeComponent.nodeInfo = {};
      // rect.nodeComponent.nodeInfo.formElements = [];
      // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      rect.nodeComponent.nestedLevel = nestedLevel ?? 0;

      if ((nestedLevel ?? 0) > 0) {
        createElement(
          'div',
          {
            class: `bg-black text-white absolute top-0 left-0 w-full px-4 py-2 z-[1050]`,
          },
          rect.nodeComponent.domElement as unknown as HTMLElement,
          `State Machine ${nestedLevel ?? 0}`
        ) as unknown as INodeComponent<NodeInfo>;
      }

      if (htmlNode.domElement) {
        canvasAppInstance = createCanvasApp<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          false,
          true,
          '',
          canvasApp.interactionStateMachine
        );

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
          600,
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
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.canvasAppInstance = canvasAppInstance;

      return node;
    },
  };
};
