import {
  FlowCanvas,
  createElement,
  FormFieldType,
  IDOMElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode } from '../flow-engine/flow-engine';

export const getTimer = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divElement: IDOMElement | undefined = undefined;
  let interval: any = undefined;
  let canvasAppInstance: FlowCanvas<NodeInfo> | undefined = undefined;
  const initialTimer = 1000;
  let timerIsBusy = false;
  const initializeCompute = () => {
    if (interval) {
      clearInterval(interval);
    }
    interval = undefined;
    timerIsBusy = false;
    if (!divElement) {
      return;
    }
    (divElement?.domElement as HTMLElement).classList.remove('loader');
    divElement.domElement.textContent =
      node?.nodeInfo?.formValues['timer'] || initialTimer.toString();
  };

  let initTimer: undefined | (() => void) = undefined;
  const compute = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    _runCounter?: RunCounter
  ) => {
    if ((input as any)?.trigger === 'TIMER') {
      return {
        result: (input as any)?.input ?? true,
      };
    }
    const timer = () => {
      if (timerIsBusy) {
        return;
      }
      timerIsBusy = true;
      // divElement.domElement.textContent =
      //   node?.nodeInfo?.formValues['timer'] || initialTimer.toString();
      //(divElement.domElement as HTMLElement).classList.remove('loader');

      if (canvasAppInstance && node) {
        runNode(
          node,
          canvasAppInstance,
          () => {
            timerIsBusy = false;
          },
          {
            trigger: 'TIMER',
            input,
          } as unknown as string,
          undefined,
          undefined,
          loopIndex,
          undefined,
          scopeId
        );
      }
    };

    if (interval) {
      clearInterval(interval);
    }

    initTimer = () => {
      if (divElement) {
        divElement.domElement.textContent = '';
        (divElement.domElement as HTMLElement).style.setProperty(
          '--timer',
          `${
            parseInt(
              node?.nodeInfo?.formValues['timer'] || initialTimer.toString()
            ) / 50
          }s`
        );
        (divElement.domElement as HTMLElement).classList.add('loader');
      }
      interval = setInterval(
        timer,
        parseInt(node?.nodeInfo?.formValues['timer'] || initialTimer.toString())
      );
    };
    initTimer();

    return {
      result: false,
      stop: true,
    };
  };

  return {
    name: 'timer',
    family: 'flow-canvas',
    isContainer: false,
    category: 'flow-control',
    createVisualNode: (
      canvasApp: FlowCanvas<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      console.log('initalValues timer', initalValues);
      const initialValue = initalValues?.['timer'] || initialTimer.toString();

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'timer',
          value: initialValue,
          onChange: (value: string) => {
            if (!node.nodeInfo || !divElement) {
              return;
            }
            if (interval) {
              clearInterval(interval);
              interval = 0;
            } else {
              divElement.domElement.textContent =
                node.nodeInfo.formValues['timer'] || initialTimer.toString();
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              timer: value,
            };

            if (initTimer) {
              initTimer();
            }

            if (updated) {
              updated();
            }
          },
        },
      ];

      const componentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-sky-900 p-4 rounded text-center flex justify-center`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      divElement = createElement(
        'div',
        {
          class: `text-center block text-white font-bold`,
        },
        componentWrapper.domElement
      );

      const timerInSeconds = initialValue || initialTimer.toString();
      if (divElement) {
        divElement.domElement.textContent = timerInSeconds;
      }
      const rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,

        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
          },
        ],
        componentWrapper,
        {
          classNames: `bg-sky-900 py-4 px-2 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: 'timer',
          formValues: {
            timer: initialValue || initialTimer.toString(),
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;

      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.delete = () => {
          if (interval) {
            clearInterval(interval);
          }
          interval = undefined;
        };
        node.nodeInfo.isSettingsPopup = true;
      }
      return node;
    },
  };
};
