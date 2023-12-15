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
import { RangeValueType } from '../types/value-type';

/*

needed when we want to implement a base-iterator from which foreach/map/filter/sort can be derived

  export const SubOutputActionType = {
  pushToResult: 'pushToResult',
  filterFromResult: 'filterFromResult',
  keepInput: 'keepInput',
} as const;

export type SubOutputActionType =
  (typeof SubOutputActionType)[keyof typeof SubOutputActionType];


*/

const activeMapColor = 'bg-blue-400';
export const mapNodeName = 'map';
const title = 'map';

const isInputOfRangeValueType = (input: RangeValueType) => {
  if (typeof input === 'object' && input) {
    return (
      input.min !== undefined &&
      input.max !== undefined &&
      input.step !== undefined &&
      typeof input.min === 'number' &&
      typeof input.max === 'number' &&
      typeof input.step === 'number' &&
      !isNaN(input.min) &&
      !isNaN(input.max) &&
      !isNaN(input.step)
    );
  }
  return false;
};

export const getMap =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let foreachComponent: INodeComponent<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      if (foreachComponent && foreachComponent.domElement) {
        foreachComponent.domElement.textContent = `${title}`;
        const forEachDomElement = foreachComponent?.domElement as HTMLElement;
        forEachDomElement.classList.add('bg-slate-500');
        forEachDomElement.classList.remove(activeMapColor);
      }
      return;
    };
    const computeAsync = (
      input: string,
      pathExecution?: RunNodeResult<NodeInfo>[],
      loopIndex?: number,
      payload?: any,
      thumbName?: string,
      scopeId?: string
    ) => {
      const forEachDomElement = foreachComponent?.domElement as HTMLElement;
      forEachDomElement.classList.add('bg-slate-500');
      forEachDomElement.classList.remove(activeMapColor);

      return new Promise((resolve, reject) => {
        if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
          reject();
          return;
        }

        let values: any[] = [];
        values = input as unknown as any[];
        let isRange = false;
        let forEachLength = 0;
        let startIndex = 0;
        let step = 1;
        const rangeInput = input as unknown as RangeValueType;
        if (
          isInputOfRangeValueType(rangeInput) &&
          rangeInput.max !== undefined &&
          rangeInput.min !== undefined &&
          rangeInput.step !== undefined
        ) {
          isRange = true;
          startIndex = rangeInput.min;
          step = rangeInput.step;
          forEachLength = rangeInput.max;

          /*Math.floor(
            (rangeInput.max - rangeInput.min) / rangeInput.step
          );
          */
        } else {
          if (!Array.isArray(input)) {
            values = [input];
          }
          forEachLength = values.length;
        }
        if (foreachComponent && foreachComponent.domElement) {
          foreachComponent.domElement.textContent = `${title} 1/${values.length}`;
        }
        const output: any[] = [];
        const runNext = (mapLoop: number) => {
          if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
            reject();
            return;
          }
          if (foreachComponent && foreachComponent.domElement) {
            foreachComponent.domElement.textContent = `${title} ${mapLoop}/${forEachLength}`;
          }
          if (mapLoop < forEachLength) {
            //console.log('runNext', mapLoop, values[mapLoop]);
            runNodeFromThumb(
              node.thumbConnectors[1],
              animatePathFromThumb,
              (outputFromMap: string | any[]) => {
                if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                  reject();
                  return;
                }
                output.push(outputFromMap);
                console.log('map runNext onstopped', mapLoop, outputFromMap);

                runNext(mapLoop + step);
              },
              isRange ? mapLoop : values[mapLoop],
              pathExecution,
              node,
              mapLoop,
              scopeId
            );
          } else {
            forEachDomElement.classList.add('bg-slate-500');
            forEachDomElement.classList.remove(activeMapColor);

            runNodeFromThumb(
              node.thumbConnectors[0],
              animatePathFromThumb,
              (inputFromSecondRun: string | any[]) => {
                resolve({
                  result: inputFromSecondRun,
                  output: inputFromSecondRun,
                  // result: output,
                  // output: output,
                  followPath: undefined,

                  stop: true,
                });
              },
              output,
              pathExecution,
              node,
              loopIndex,
              scopeId
            );
          }
        };

        forEachDomElement.classList.remove('bg-slate-500');
        forEachDomElement.classList.add(activeMapColor);
        runNext(startIndex);
        // resolve({
        //   result: input,
        //   stop: true,
        // });
      });
    };

    return {
      name: mapNodeName,
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
            class: `inner-node bg-slate-500 p-4 rounded-xl flex flex-row items-center justify-center text-center
            transition-colors duration-200`,
            style: {
              'clip-path':
                'polygon(20% 0%, 100% 0, 100% 100%, 20% 100%, 0% 80%, 0% 20%)',
            },
          },
          undefined,
          'map'
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
              thumbConstraint: ['array', 'range'],
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
            type: mapNodeName,
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
