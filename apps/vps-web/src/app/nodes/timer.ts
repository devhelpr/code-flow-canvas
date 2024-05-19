import {
  CanvasAppInstance,
  createElement,
  IDOMElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { runNode } from '../simple-flow-engine/simple-flow-engine';
import { FormFieldType } from '../components/FormField';

export const getTimer = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divElement: IDOMElement;
  let interval: any = undefined;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const initialTimer = 1000;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if ((input as any)?.trigger === 'TIMER') {
      return {
        result: (input as any)?.input ?? true,
      };
    }
    const timer = () => {
      divElement.domElement.textContent =
        node?.nodeInfo?.formValues['timer'] || initialTimer.toString();
      (divElement.domElement as HTMLElement).classList.remove('loader');
      if (canvasAppInstance && node) {
        runNode(
          node,
          canvasAppInstance,
          undefined,
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
      clearTimeout(interval);
    }

    divElement.domElement.textContent = '';
    (divElement.domElement as HTMLElement).classList.add('loader');
    interval = setTimeout(
      timer,
      parseInt(node?.nodeInfo?.formValues['timer'] || initialTimer.toString())
    );

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
      canvasApp: CanvasAppInstance<NodeInfo>,
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
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              timer: value,
            };
            divElement.domElement.textContent =
              node.nodeInfo.formValues['timer'] || initialTimer.toString();

            if (updated) {
              updated();
            }
          },
        },
      ];

      const componentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-sky-900 p-4 rounded text-center`,
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
      divElement.domElement.textContent = timerInSeconds;

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
            clearTimeout(interval);
          }
          interval = undefined;
        };
      }
      return node;
    },
  };
};
