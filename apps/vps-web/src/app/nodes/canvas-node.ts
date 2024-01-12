import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  IRectNodeComponent,
  ElementNodeMap,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

import { InitialValues, NodeTask } from '../node-task-registry';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { run } from '../simple-flow-engine/simple-flow-engine';

export interface ComputeResult {
  result: string | any[];
  output?: string | any[];
  followPath?: string;
  stop?: boolean;
}
export const getCanvasNode =
  (animatePath: AnimatePathFunction) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
    let rect:
      | ReturnType<CanvasAppInstance<NodeInfo>['createRect']>
      | undefined = undefined;
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
    let input: IRectNodeComponent<NodeInfo> | undefined = undefined;
    let output: IRectNodeComponent<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      return;
    };

    const computePromise = <_T>(input: string) => {
      return (
        resolve: (result: ComputeResult) => void,
        reject: (error: string) => void
      ) => {
        if (!canvasAppInstance) {
          reject('canvasAppInstance is not defined');
          return;
        }
        run(
          canvasAppInstance?.elements as ElementNodeMap<NodeInfo>,
          canvasAppInstance,
          animatePath,
          (input) => {
            resolve({ result: input, output: input });
          },
          input,
          node.x,
          node.y
        );
      };
    };
    const computeAsync = (input: string) => {
      return new Promise<ComputeResult>(computePromise<NodeInfo>(input));
    };

    return {
      name: 'canvas-node',
      family: 'flow-canvas',
      isContainer: true,
      childNodeTasks: ['expression', 'array', 'sum', 'fetch', 'if-condition'],
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
        _initalValue?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>,
        width?: number,
        height?: number
      ) => {
        htmlNode = createElement(
          'div',
          {
            class: 'w-full h-full overflow-hidden',
          },
          undefined,
          ''
        ) as unknown as INodeComponent<NodeInfo>;

        const wrapper = createElement(
          'div',
          {
            class: `bg-slate-400 rounded opacity-90 relative z-[1151]`,
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
            },
          ],
          wrapper,
          undefined,
          true,
          undefined,
          undefined,
          id,
          {
            formElements: [],
            type: 'canvas-node',
            taskType: 'canvas-node',
          },
          containerNode
        );
        // rect.nodeComponent.nodeInfo = {};
        // rect.nodeComponent.nodeInfo.formElements = [];
        // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        if (htmlNode.domElement) {
          canvasAppInstance = createCanvasApp<NodeInfo>(
            htmlNode.domElement as HTMLElement,
            false,
            true,
            '',
            canvasApp.interactionStateMachine
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
              classNames: `pointer-events-auto`,
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

          if (input) {
            input.nodeInfo = {
              compute: (input: string | any[]) => {
                return {
                  result: input,
                };
              },
            };
          }

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
              classNames: `pointer-events-auto`,
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
          if (output) {
            output.nodeInfo = {
              compute: (input: string | any[]) => {
                return {
                  result: input,
                };
              },
            };
          }
          canvasAppInstance.setOnCanvasUpdated(() => {
            updated?.();
          });

          rect.addUpdateEventListener((target) => {
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
          node.nodeInfo.computeAsync = computeAsync;
          node.nodeInfo.initializeCompute = initializeCompute;
          node.nodeInfo.canvasAppInstance = canvasAppInstance;
        }

        return node;
      },
    };
  };
