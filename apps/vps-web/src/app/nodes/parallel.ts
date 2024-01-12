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

export const getParallel =
  (
    _animatePath: AnimatePathFunction,
    animatePathFromThumb: AnimatePathFromThumbFunction
  ) =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
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
          node.thumbConnectors.length < 2 ||
          !canvasAppInstance
        ) {
          reject();
          return;
        }
        let seq1Ran = false;
        let seq2Ran = false;
        runNodeFromThumb(
          node.thumbConnectors[0],
          canvasAppInstance,
          animatePathFromThumb,
          (inputFromFirstRun: string | any[]) => {
            console.log('Parallel inputFromFirstRun', inputFromFirstRun);
            if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
              reject();
              return;
            }
            seq1Ran = true;
            if (seq2Ran) {
              resolve({
                result: inputFromFirstRun,
                output: inputFromFirstRun,
                stop: true,
              });
            }
          },
          input,
          node,
          loopIndex,
          scopeId
        );

        runNodeFromThumb(
          node.thumbConnectors[1],
          canvasAppInstance,
          animatePathFromThumb,
          (inputFromSecondRun: string | any[]) => {
            seq2Ran = true;
            console.log('Parallel inputFromSecondRun', inputFromSecondRun);

            if (seq1Ran) {
              resolve({
                result: inputFromSecondRun,
                output: inputFromSecondRun,
                stop: true,
              });
            }
          },
          input,
          node,
          loopIndex,
          scopeId
        );
      });
    };

    return {
      name: 'parallel',
      family: 'flow-canvas',
      category: 'flow-control',
      isContainer: false,
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        _initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        canvasAppInstance = canvasApp;
        const jsxComponentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-slate-500 p-4 pl-8 rounded flex flex-row justify-center items-center`,
            style: {
              'clip-path': 'polygon(0 50%, 100% 0, 100% 100%)',
            },
          },
          undefined,
          'parallel'
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
              label: ' ',
              name: 'output1',
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 1,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              name: 'output2',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: ' ',
            },
          ],
          jsxComponentWrapper,
          {
            classNames: `bg-slate-500 p-4 rounded`,
          },
          true,
          undefined,
          undefined,
          id,
          {
            type: 'parallel',
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
