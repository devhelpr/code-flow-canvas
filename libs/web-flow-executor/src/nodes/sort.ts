import {
  IFlowCanvasBase,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { runNodeFromThumb } from '../flow-engine/flow-engine';
import { RunCounter } from '../follow-path/run-counter';

const activeSortColor = 'bg-blue-300';
export const mapNodeName = 'map';

export const sortNodeName = 'sort';
const title = 'sort';

export const getSort = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let foreachComponent: INodeComponent<NodeInfo> | undefined = undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    if (foreachComponent && foreachComponent.domElement) {
      foreachComponent.domElement.textContent = `${title}`;

      const forEachDomElement = foreachComponent?.domElement as HTMLElement;
      forEachDomElement.classList.add('bg-slate-500');
      forEachDomElement.classList.remove(activeSortColor);
    }

    return;
  };
  const computeAsync = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => {
    const forEachDomElement = foreachComponent?.domElement as HTMLElement;
    forEachDomElement.classList.add('bg-slate-500');
    forEachDomElement.classList.remove(activeSortColor);

    return new Promise((resolve, reject) => {
      if (
        !node.thumbConnectors ||
        node.thumbConnectors.length < 2 ||
        !canvasAppInstance
      ) {
        reject();
        return;
      }

      let values: any[] = [];
      values = input as unknown as any[];
      let forEachLength = 0;
      const startIndex = 0;
      const step = 1;
      if (!Array.isArray(input)) {
        values = [input];
      }
      forEachLength = values.length;
      if (foreachComponent && foreachComponent.domElement) {
        foreachComponent.domElement.textContent = `${title} 1/${values.length}`;
      }
      const output: any[] = [];
      const runNext = (mapLoop: number) => {
        if (
          !node.thumbConnectors ||
          node.thumbConnectors.length < 2 ||
          !canvasAppInstance
        ) {
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
            canvasAppInstance,
            (outputFromMap: string | any[]) => {
              if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                reject();
                return;
              }
              output.push({
                index: mapLoop,
                sortValue: outputFromMap,
              });
              console.log('map runNext onstopped', mapLoop, outputFromMap);

              runNext(mapLoop + step);
            },
            { ...values[mapLoop] } as unknown as any,
            node,
            mapLoop,
            scopeId,
            runCounter
          );
        } else {
          forEachDomElement.classList.add('bg-slate-500');
          forEachDomElement.classList.remove(activeSortColor);

          const sortedOutputList = (output as any).toSorted(
            (a: any, b: any) => {
              if (a.sortValue < b.sortValue) {
                return -1;
              } else if (a.sortValue > b.sortValue) {
                return 1;
              }
              return 0;
            }
          );
          const sortedList = sortedOutputList.map(
            (item: any) => values[item.index]
          );
          runNodeFromThumb(
            node.thumbConnectors[0],
            canvasAppInstance,
            (inputFromSecondRun: string | any[]) => {
              resolve({
                result: inputFromSecondRun,
                output: inputFromSecondRun,
                // result: output,
                // output: output,
                followPath: undefined,

                stop: true,
                dummyEndpoint: true,
              });
            },
            sortedList,
            node,
            loopIndex,
            scopeId,
            runCounter
          );
        }
      };

      forEachDomElement.classList.remove('bg-slate-500');
      forEachDomElement.classList.add(activeSortColor);

      runNext(startIndex);
    });
  };

  return {
    name: sortNodeName,
    family: 'flow-canvas',
    isContainer: false,
    category: 'iterators',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      foreachComponent = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded flex flex-row items-center justify-center text-center
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
          type: sortNodeName,
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
