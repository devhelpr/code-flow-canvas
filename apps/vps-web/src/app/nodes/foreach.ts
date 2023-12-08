import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

import {
  RunNodeResult,
  runNodeFromThumb,
} from '../simple-flow-engine/simple-flow-engine';
import { InitialValues, NodeTask } from '../node-task-registry';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';

export const getForEach =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let foreachComponent: INodeComponent<NodeInfo> | undefined = undefined;
    const title = 'foreach';
    const initializeCompute = () => {
      if (foreachComponent && foreachComponent.domElement) {
        foreachComponent.domElement.textContent = `${title}`;
      }
      return;
    };
    const computeAsync = (
      input: string,
      pathExecution?: RunNodeResult<NodeInfo>[],
      loopIndex?: number,
      payload?: any
    ) => {
      return new Promise((resolve, reject) => {
        if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
          reject();
          return;
        }

        let values: any[] = [];
        values = input as unknown as any[];
        if (!Array.isArray(input)) {
          values = [input];
        }
        if (foreachComponent && foreachComponent.domElement) {
          foreachComponent.domElement.textContent = `${title} 1/${values.length}`;
        }
        const runNext = (mapLoop: number) => {
          if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
            reject();
            return;
          }
          if (foreachComponent && foreachComponent.domElement) {
            foreachComponent.domElement.textContent = `${title} ${mapLoop}/${values.length}`;
          }
          if (mapLoop < values.length) {
            console.log('runNext', mapLoop, values[mapLoop]);
            runNodeFromThumb(
              node.thumbConnectors[1],
              animatePathFromThumb,
              (inputFromFirstRun: string | any[]) => {
                if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                  reject();
                  return;
                }
                console.log('runNext onstopped', mapLoop, inputFromFirstRun);

                runNext(mapLoop + 1);
              },
              values[mapLoop],
              pathExecution,
              node,
              mapLoop
            );
          } else {
            runNodeFromThumb(
              node.thumbConnectors[0],
              animatePathFromThumb,
              (inputFromSecondRun: string | any[]) => {
                resolve({
                  result: input,
                  stop: true,
                });
              },
              input,
              pathExecution,
              node,
              loopIndex
            );
          }
        };

        runNext(0);
        // resolve({
        //   result: input,
        //   stop: true,
        // });
      });
    };

    return {
      name: 'foreach',
      family: 'flow-canvas',
      isContainer: false,
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        foreachComponent = createElement(
          'div',
          {
            class: `inner-node bg-slate-500 p-4 rounded-xl flex flex-row items-center justify-center text-center`,
            style: {
              'clip-path':
                'polygon(20% 0%, 100% 0, 100% 100%, 20% 100%, 0% 80%, 0% 20%)',
            },
          },
          undefined,
          'foreach'
        ) as unknown as INodeComponent<NodeInfo>;

        const rect = canvasApp.createRect(
          x,
          y,
          110,
          110,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: '[]',
              thumbConstraint: 'array',
              name: 'output1',
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 1,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: '#',
              thumbConstraint: 'value',
              name: 'output2',
              prefixIcon: 'icon icon-refresh',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: '[]',
              thumbConstraint: 'array',
            },
          ],
          foreachComponent,
          {
            classNames: `bg-slate-500 p-4 rounded`,
          },
          true,
          undefined,
          undefined,
          id,
          {
            type: 'foreach',
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
          node.nodeInfo.computeAsync = computeAsync;
          node.nodeInfo.initializeCompute = initializeCompute;
        }
        return node;
      },
    };
  };
