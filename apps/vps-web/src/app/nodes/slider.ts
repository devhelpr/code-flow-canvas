import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { runNode } from '../simple-flow-engine/simple-flow-engine';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { RunCounter } from '../follow-path/run-counter';

export const getSlider =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    createRunCounterContext: () => RunCounter
  ) =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let currentValue = 0;
    let triggerButton = false;
    let runCounter: RunCounter | undefined = undefined;
    const initializeCompute = () => {
      currentValue = 0;
      return;
    };
    const compute = (input: string) => {
      try {
        currentValue = parseFloat(input) || 0;
      } catch {
        currentValue = 0;
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
      name: 'slider',
      family: 'flow-canvas',
      isContainer: false,
      category: 'UI',
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        canvasAppInstance = canvasApp;
        const initialValue = initalValues?.['expression'] ?? '';

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-sky-900 p-4 rounded`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        createElement(
          'input',
          {
            type: 'range',
            class: `w-full block`,
            pointerdown: (event) => {
              event.stopPropagation();
            },
            change: (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!canvasAppInstance) {
                return;
              }
              triggerButton = true;
              runCounter = createRunCounterContext();
              currentValue = parseInt((event.target as HTMLInputElement).value);
              runNode(
                node as unknown as IRectNodeComponent<NodeInfo>,
                canvasAppInstance,
                animatePath,
                undefined,
                currentValue.toString(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                runCounter,
                true
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
              label: '#',
              thumbConstraint: 'value',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: '#',
              thumbConstraint: 'value',
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
            type: 'slider',
            formValues: {
              expression: initialValue ?? '',
            },
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
