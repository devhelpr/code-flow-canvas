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
import { StateMachine, createStateMachine } from './state-machine-node';

export const createStateCompound: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let canvasAppInstance: CanvasAppInstance | undefined = undefined;

  let stateMachine: StateMachine | undefined = undefined;
  let captionNodeComponent: INodeComponent<NodeInfo> | undefined = undefined;

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
    name: 'state-compound',
    family: 'flow-canvas',
    isContainer: true,
    childNodeTasks: ['state', 'state-transition', 'state-compound'],
    getConnectionInfo: () => {
      return { inputs: [], outputs: [] };
      // if (!input || !output) {
      //   return { inputs: [], outputs: [] };
      // }
      // return { inputs: [input], outputs: [output] };
    },
    createVisualNode: (
      canvasApp: canvasAppReturnType,
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

      rect = canvasApp.createRectThumb(
        x,
        y,
        width ?? 600,
        height ?? 400,
        undefined,
        [
          {
            thumbType: ThumbType.Center,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.startOrEnd,
            color: 'white',
            label: '#',
            thumbConstraint: 'transition',
            name: 'state',
            hidden: true,
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
          type: 'state-compound',
          taskType: 'state-compound',
          formValues: {
            caption: initialValue ?? '',
          },
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
          canvasApp.interactionStateMachine
        );

        canvasAppInstance.setOnCanvasUpdated(() => {
          updated?.();
          stateMachine = undefined;
        });

        rect.addUpdateEventListener((target, x, y, initiator) => {
          if (target) {
            // outputInstance.nodeComponent?.update?.(
            //   outputInstance.nodeComponent,
            //   target?.width,
            //   0,
            //   rect?.nodeComponent
            // );
          }
        });

        (canvasAppInstance.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-auto'
        );
      }

      node = rect.nodeComponent;
      if (nestedLevel ?? 0 > 0) {
        rect.nodeComponent.nodeInfo.formElements = formElements;
      }
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.canvasAppInstance = canvasAppInstance;

      return node;
    },
  };
};
