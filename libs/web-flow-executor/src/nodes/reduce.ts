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

const thumbs = [
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

export const reduceNodeName = 'reduce';
const title = 'reduce';

// function getFractionalLength(value: number) {
//   const roundedNumStr = value.toFixed(15); // Round to 15 decimal places to mitigate floating-point artifacts
//   if (roundedNumStr.includes('.')) {
//     const [, fractionalPart] = roundedNumStr.split('.');
//     return fractionalPart.replace(/0+$/, '').length; // Remove trailing zeroes before counting
//   }
//   return 0;
// }

function getCleanFloatValue(value: number) {
  return parseFloat(value.toFixed(15));
}

const cssClasses = getIteratorNodeFamilyCssClasses();

export const getReduce = (_updated: () => void): NodeTask<NodeInfo> => {
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
        rangeInput.min !== undefined
      ) {
        isRange = true;
        startIndex = rangeInput.min;
        step = rangeInput.step ?? 1;
        forEachLength = rangeInput.max;
      } else {
        if (!Array.isArray(input)) {
          values = [input];
        }
        forEachLength = values.length;
      }

      let accumulator: any = undefined;
      if (isRange) {
        accumulator = 0;
      } else {
        accumulator = typeof values[0] === 'number' ? 0 : '';
      }

      const runNext = (filterLoop: number) => {
        if (
          !node.thumbConnectors ||
          node.thumbConnectors.length < 2 ||
          !canvasAppInstance
        ) {
          reject();
          return;
        }

        if (filterLoop < forEachLength) {
          if (foreachComponent && foreachComponent.domElement) {
            (
              foreachComponent.domElement as HTMLElement
            ).innerHTML = `<div class="flex flex-col"><span class="block text-nowrap">${title}</span><span class="block text-nowrap">${startIndex} <= ${getCleanFloatValue(
              filterLoop
            )} < ${forEachLength}</span></div>`;
          }
          runNodeFromThumb(
            node.thumbConnectors[1],
            canvasAppInstance,
            (outputFromMap: string | any[]) => {
              if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                reject();
                return;
              }
              if (outputFromMap) {
                //output.push(isRange ? filterLoop : values[filterLoop]);
                accumulator = outputFromMap;
              }
              console.log(
                'filter runNext onstopped',
                filterLoop,
                outputFromMap
              );

              runNext(getCleanFloatValue(filterLoop + step));
            },
            {
              value: isRange ? filterLoop : values[filterLoop],
              index: filterLoop,
              accumulator: accumulator,
            },

            node,
            filterLoop,
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
            accumulator,
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
    name: reduceNodeName,
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
        reduceNodeName
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
          type: reduceNodeName,
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
