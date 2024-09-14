import {
  IFlowCanvasBase,
  createElement,
  FormFieldType,
  IDOMElement,
  IElementNode,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { runNode } from '../flow-engine/flow-engine';

export const getNodeTrigger = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divElement: IDOMElement | undefined = undefined;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    _input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    const nodeName = node?.nodeInfo?.formValues['node'] || '';
    if (canvasAppInstance && nodeName) {
      let triggerNode: IElementNode<NodeInfo> | undefined = undefined;
      for (const element of canvasAppInstance.elements.values()) {
        if (element?.nodeInfo?.type === 'node-trigger-target') {
          if (element.nodeInfo.formValues['node'] === nodeName) {
            triggerNode = element;
            break;
          }
        }
      }
      if (triggerNode) {
        runNode(
          triggerNode as IRectNodeComponent<NodeInfo>,
          canvasAppInstance,
          undefined,
          'TRIGGER',
          undefined,
          undefined,
          undefined,
          undefined,
          scopeId
        );
      }
    }
    return {
      result: false,
      stop: true,
    };
  };

  return {
    name: 'node-trigger',
    family: 'flow-canvas',
    isContainer: false,
    category: 'flow-control',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      const initialValue = initalValues?.['node'] || '';

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'node',
          value: initialValue,
          onChange: (value: string) => {
            if (!node.nodeInfo || !divElement) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              node: value,
            };
            divElement.domElement.textContent =
              node.nodeInfo.formValues['node'] || '';

            if (updated) {
              updated();
            }
          },
        },
      ];

      const componentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-sky-900 p-4 rounded flex flex-row justify-center items-center`,
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
      if (divElement) {
        divElement.domElement.textContent = initialValue || '';
      }
      const rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,

        [
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
          type: 'node-trigger',
          formValues: {
            node: initialValue || '',
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
      }
      return node;
    },
  };
};
