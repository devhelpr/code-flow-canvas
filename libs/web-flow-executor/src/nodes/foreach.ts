import {
  CanvasAppInstance,
  createNodeElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { runNodeFromThumb } from '../flow-engine/flow-engine';
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

const thumbs = [
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
    name: 'input',
    thumbConstraint: ['array', 'range'],
  },
];

const activeForeachColor = 'bg-blue-500';
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

export const getForEach = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let foreachComponent: INodeComponent<NodeInfo> | undefined = undefined;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const title = 'foreach';
  const initializeCompute = () => {
    if (foreachComponent && foreachComponent.domElement) {
      foreachComponent.domElement.textContent = `${title}`;

      const forEachDomElement = foreachComponent?.domElement as HTMLElement;
      forEachDomElement.classList.add('bg-slate-500');
      forEachDomElement.classList.remove(activeForeachColor);
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
        node.thumbConnectors.length < 2 ||
        !canvasAppInstance
      ) {
        reject();
        return;
      }

      const forEachDomElement = foreachComponent?.domElement as HTMLElement;
      forEachDomElement.classList.add('bg-slate-500');
      forEachDomElement.classList.remove(activeForeachColor);

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
            (inputFromFirstRun: string | any[]) => {
              if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                reject();
                return;
              }
              console.log('runNext onstopped', mapLoop, inputFromFirstRun);

              runNext(mapLoop + step);
            },
            isRange ? mapLoop : values[mapLoop],
            node,
            mapLoop,
            scopeId
          );
        } else {
          forEachDomElement.classList.add('bg-slate-500');
          forEachDomElement.classList.remove(activeForeachColor);

          runNodeFromThumb(
            node.thumbConnectors[0],
            canvasAppInstance,
            (inputFromSecondRun: string | any[]) => {
              resolve({
                result: inputFromSecondRun,
                output: inputFromSecondRun,
                // result: isRange ? [] : input,
                // output: isRange ? [] : input,
                followPath: undefined,
                stop: true,
                dummyEndpoint: true,
              });
            },
            isRange ? [] : input,
            node,
            loopIndex,
            scopeId
          );
        }
      };

      forEachDomElement.classList.remove('bg-slate-500');
      forEachDomElement.classList.add(activeForeachColor);
      runNext(startIndex);
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
    category: 'iterators',
    thumbs,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      foreachComponent = createNodeElement(
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
        'foreach'
      ) as unknown as INodeComponent<NodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        110,
        110,
        undefined,
        thumbs,
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
