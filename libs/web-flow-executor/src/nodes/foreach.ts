import {
  IFlowCanvasBase,
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
import { RunCounter } from '../follow-path/run-counter';
import { getIteratorNodeFamilyCssClasses } from '../consts/iterator-node-family-css-classes';
import { isInputOfRangeValueType } from '../utils/is-range';
import { setIteratorLabel } from './iterator-utils/set-iterator-label';

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
    label: ' ',
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

const cssClasses = getIteratorNodeFamilyCssClasses();

export const getForEach = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let foreachComponent: INodeComponent<NodeInfo> | undefined = undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const title = 'foreach';

  function setNodeActiveColors() {
    if (foreachComponent && foreachComponent.domElement) {
      const forEachDomElement = foreachComponent?.domElement as HTMLElement;
      forEachDomElement.classList.remove(cssClasses.nodeActiveColorCssClass);
      forEachDomElement.classList.remove(cssClasses.backgroundColorCssClass);
      forEachDomElement.classList.add(cssClasses.nodeActiveColorCssClass);

      forEachDomElement.classList.remove(cssClasses.nodeActiveTextCssClass);
      forEachDomElement.classList.remove(cssClasses.textCssClass);
      forEachDomElement.classList.add(cssClasses.nodeActiveTextCssClass);
    }
  }

  function setNodeDefaultColors() {
    if (foreachComponent && foreachComponent.domElement) {
      const forEachDomElement = foreachComponent?.domElement as HTMLElement;
      forEachDomElement.classList.remove(cssClasses.nodeActiveColorCssClass);
      forEachDomElement.classList.remove(cssClasses.backgroundColorCssClass);
      forEachDomElement.classList.add(cssClasses.backgroundColorCssClass);

      forEachDomElement.classList.remove(cssClasses.nodeActiveTextCssClass);
      forEachDomElement.classList.remove(cssClasses.textCssClass);
      forEachDomElement.classList.add(cssClasses.textCssClass);
    }
  }

  let currentState = {
    startIndex: 0,
    iteratorLength: 0,
    loop: 0,
  };

  const initializeCompute = () => {
    currentState = {
      startIndex: 0,
      iteratorLength: 0,
      loop: 0,
    };
    if (foreachComponent && foreachComponent.domElement) {
      foreachComponent.domElement.textContent = `${title}`;

      setNodeDefaultColors();
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
    return new Promise((resolve, reject) => {
      if (
        !node.thumbConnectors ||
        node.thumbConnectors.length < 2 ||
        !canvasAppInstance
      ) {
        reject();
        return;
      }

      setNodeDefaultColors();

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
        rangeInput.min !== undefined
      ) {
        isRange = true;
        startIndex = rangeInput.min;
        step = rangeInput.step ?? 1;
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

      const runNext = (mapLoop: number) => {
        if (
          !node.thumbConnectors ||
          node.thumbConnectors.length < 2 ||
          !canvasAppInstance
        ) {
          reject();
          return;
        }

        currentState = {
          startIndex,
          iteratorLength: forEachLength,
          loop: mapLoop,
        };

        if (mapLoop < forEachLength) {
          setIteratorLabel(
            foreachComponent,
            title,
            startIndex,
            mapLoop,
            forEachLength
          );
          runNodeFromThumb(
            node.thumbConnectors[1],
            canvasAppInstance,
            (_inputFromFirstRun: string | any[]) => {
              if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                reject();
                return;
              }

              runNext(mapLoop + step);
            },
            isRange ? mapLoop : values[mapLoop],
            node,
            mapLoop,
            scopeId,
            runCounter
          );
        } else {
          setNodeDefaultColors();

          runNodeFromThumb(
            node.thumbConnectors[0],
            canvasAppInstance,
            (inputFromSecondRun: string | any[]) => {
              console.log('foreach inputFromSecondRun', inputFromSecondRun);
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
            scopeId,
            runCounter
          );
        }
      };

      setNodeActiveColors();
      runNext(startIndex);
      // resolve({
      //   result: input,
      //   stop: true,
      // });
    });
  };

  const getNodeStatedHandler = () => {
    return {
      data: { ...currentState },
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    currentState = { ...data };
    setIteratorLabel(
      foreachComponent,
      title,
      currentState.startIndex,
      currentState.loop,
      currentState.iteratorLength
    );
  };

  return {
    name: 'foreach',
    family: 'flow-canvas',
    isContainer: false,
    category: 'iterators',
    thumbs,
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
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
          class: `${cssClasses.mainCssClasses} ${cssClasses.backgroundColorCssClass}`,
          style: {
            'clip-path': cssClasses.clipPath,
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

        if (id) {
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        }

        node.nodeInfo.meta = [
          {
            propertyName: 'state',
            displayName: 'Iterate state',
            type: 'json',
            getData: () => {
              return currentState;
            },
          },
        ];
      }
      return node;
    },
  };
};
