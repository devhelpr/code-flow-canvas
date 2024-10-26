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

const cssClasses = getIteratorNodeFamilyCssClasses();

export const getMap = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let foreachComponent: INodeComponent<NodeInfo> | undefined = undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

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

  const initializeCompute = () => {
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
    const forEachDomElement = foreachComponent?.domElement as HTMLElement;
    if (forEachDomElement) {
      setNodeDefaultColors();
    }
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
      } else {
        if (!Array.isArray(input)) {
          values = [input];
        }
        forEachLength = values.length;
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

        if (mapLoop < forEachLength) {
          if (foreachComponent && foreachComponent.domElement) {
            (
              foreachComponent.domElement as HTMLElement
            ).innerHTML = `<div class="flex flex-col"><span class="block text-nowrap">${title}</span><span class="block text-nowrap">${startIndex} <= ${mapLoop} < ${forEachLength}</span></div>`;
          }
          runNodeFromThumb(
            node.thumbConnectors[1],
            canvasAppInstance,
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
            node,
            mapLoop,
            scopeId,
            runCounter
          );
        } else {
          if (forEachDomElement) {
            setNodeDefaultColors();
          }

          runNodeFromThumb(
            node.thumbConnectors[0],
            canvasAppInstance,
            (inputFromSecondRun: string | any[]) => {
              resolve({
                result: inputFromSecondRun,
                output: inputFromSecondRun,
                followPath: undefined,

                stop: true,
                dummyEndpoint: true,
              });
            },
            output,
            node,
            loopIndex,
            scopeId,
            runCounter
          );
        }
      };
      if (forEachDomElement) {
        setNodeActiveColors();
      }
      runNext(startIndex);
    });
  };

  return {
    name: mapNodeName,
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
        'map'
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
          classNames: ``,
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
