import {
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import {
  runNode,
  RunNodeResult,
} from '../simple-flow-engine/simple-flow-engine';
import { AnimatePathFunction } from '../follow-path/animate-path';

export const getCheckbox =
  (animatePath: AnimatePathFunction<NodeInfo>) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let currentValue = false;
    let triggerButton = false;
    const initializeCompute = () => {
      currentValue = false;
      return;
    };
    const compute = (input: string) => {
      try {
        currentValue = Boolean(input) || false;
      } catch {
        currentValue = false;
      }
      if (triggerButton) {
        triggerButton = false;
        return {
          result: currentValue,
        };
      }
      return {
        result: false,
        stop: true,
      };
    };

    return {
      name: 'checkbox',
      family: 'flow-canvas',
      isContainer: false,
      createVisualNode: (
        canvasApp: canvasAppReturnType,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-sky-900 py-4 px-8 rounded text-center`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        const checkboxInput = createElement(
          'input',
          {
            type: 'checkbox',
            class: `inline-block`,
            pointerdown: (event) => {
              event.stopPropagation();
            },
            change: (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              triggerButton = true;
              currentValue =
                Boolean((event.target as HTMLInputElement).value) || false;
              runNode<NodeInfo>(
                node,
                canvasApp,
                animatePath,
                undefined,
                currentValue.toString(),
                []
              );
              return false;
            },
          },
          componentWrapper.domElement
        );
        const rect = canvasApp.createRect(
          x,
          y,
          200,
          100,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: '01',
              thumbConstraint: 'boolean',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: '01',
              thumbConstraint: 'boolean',
            },
          ],
          componentWrapper,
          {
            classNames: `bg-sky-900 p-4 rounded`,
          },
          undefined,
          undefined,
          undefined,
          id,
          {
            type: 'checkbox',
            formValues: {},
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;
        if (node.nodeInfo) {
          node.nodeInfo.formElements = [];
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;
        }
        return node;
      },
    };
  };
