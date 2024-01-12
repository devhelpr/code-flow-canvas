import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

import { runNodeFromThumb } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues, NodeTask } from '../node-task-registry';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';

const activeWhileColor = 'bg-blue-500';

export const whileNodeName = 'while';
const whileTitle = 'while';
export const getWhile =
  (
    _animatePath: AnimatePathFunction,
    animatePathFromThumb: AnimatePathFromThumbFunction
  ) =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let whileComponent: INodeComponent<NodeInfo> | undefined = undefined;
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
    const title = whileTitle;
    const initializeCompute = () => {
      if (whileComponent && whileComponent.domElement) {
        whileComponent.domElement.textContent = `${title}`;

        const whileDomElement = whileComponent?.domElement as HTMLElement;
        whileDomElement.classList.add('bg-slate-500');
        whileDomElement.classList.remove(activeWhileColor);
      }
      return;
    };
    const computeAsync = (
      input: string,
      loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      scopeId?: string
    ) => {
      return new Promise((resolve, reject) => {
        if (
          !node.thumbConnectors ||
          node.thumbConnectors.length < 4 ||
          !canvasAppInstance
        ) {
          reject();
          return;
        }

        const whileDomElement = whileComponent?.domElement as HTMLElement;
        whileDomElement.classList.add('bg-slate-500');
        whileDomElement.classList.remove(activeWhileColor);

        const startIndex = 0;
        const step = 1;

        if (whileComponent && whileComponent.domElement) {
          (
            whileComponent.domElement as HTMLElement
          ).innerHTML = `${title}<br />${1}`;
        }
        const runNext = (mapLoop: number) => {
          if (
            !node.thumbConnectors ||
            node.thumbConnectors.length < 4 ||
            !canvasAppInstance
          ) {
            reject();
            return;
          }

          // perform test condition
          runNodeFromThumb(
            node.thumbConnectors[2],
            canvasAppInstance,
            animatePathFromThumb,
            (resultFromTestRun: string | any[]) => {
              if (
                !node.thumbConnectors ||
                node.thumbConnectors.length < 4 ||
                !canvasAppInstance
              ) {
                reject();
                return;
              }
              console.log(
                'runNext onstopped resultFromTestRun',
                mapLoop,
                resultFromTestRun
              );

              const test =
                (typeof resultFromTestRun === 'boolean' && resultFromTestRun) ||
                (typeof resultFromTestRun === 'number' &&
                  resultFromTestRun > 0) ||
                (typeof resultFromTestRun === 'string' &&
                  resultFromTestRun.toLowerCase() === 'true');

              if (test) {
                // run loop block if test has result of true

                if (whileComponent && whileComponent.domElement) {
                  (
                    whileComponent.domElement as HTMLElement
                  ).innerHTML = `${title}<br />${mapLoop + 1}`;
                }

                runNodeFromThumb(
                  node.thumbConnectors[3],
                  canvasAppInstance,
                  animatePathFromThumb,
                  (resultFromLoopBlock: string | any[]) => {
                    if (
                      !node.thumbConnectors ||
                      node.thumbConnectors.length < 2
                    ) {
                      reject();
                      return;
                    }
                    console.log(
                      'runNext onstopped resultFromLoopBlock',
                      mapLoop,
                      resultFromLoopBlock
                    );

                    runNext(mapLoop + step);
                  },
                  input,
                  node,
                  mapLoop,
                  scopeId
                );
              } else {
                // exit while loop and continue with next node

                whileDomElement.classList.add('bg-slate-500');
                whileDomElement.classList.remove(activeWhileColor);

                runNodeFromThumb(
                  node.thumbConnectors[1],
                  canvasAppInstance,
                  animatePathFromThumb,
                  (resultFromContinueNodeRun: string | any[]) => {
                    resolve({
                      result: resultFromContinueNodeRun,
                      output: resultFromContinueNodeRun,
                      followPath: undefined,
                      stop: true,
                    });
                  },
                  input,
                  node,
                  loopIndex,
                  scopeId
                );
              }
            },
            input,
            node,
            mapLoop,
            scopeId
          );
        };

        whileDomElement.classList.remove('bg-slate-500');
        whileDomElement.classList.add(activeWhileColor);
        runNext(startIndex);
      });
    };

    return {
      name: whileNodeName,
      family: 'flow-canvas',
      isContainer: false,
      category: 'iterators',
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        _initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        canvasAppInstance = canvasApp;
        whileComponent = createElement(
          'div',
          {
            class: `inner-node bg-slate-500 p-4 rounded-xl flex flex-row items-center justify-center text-center
            transition-colors duration-200`,
            style: {
              'clip-path':
                'polygon(20% 0%, 100% 0, 100% 100%, 20% 100%, 0% 80%, 0% 20%)',
            },
          },
          undefined,
          whileTitle
        ) as unknown as INodeComponent<NodeInfo>;

        const rect = canvasApp.createRect(
          x,
          y,
          140,
          110,
          undefined,
          [
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: ' ',
              name: 'input1',
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',

              name: 'output1',
            },

            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 1,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              prefixLabel: 'test',
              thumbConstraint: ['value'],
              name: 'test',
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 2,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: '#',
              name: 'output2',
              prefixIcon: 'icon icon-refresh',
            },
          ],
          whileComponent,
          {
            classNames: `bg-slate-500 p-4 rounded`,
          },
          true,
          undefined,
          undefined,
          id,
          {
            type: whileNodeName,
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
