import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getShowObject: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let inputValues = {};
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = {};
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Input';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    inputValues = input;
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      console.log('visualize object', inputValues);
      updateVisual(inputValues);
      // htmlNode.domElement.textContent = JSON.stringify(
      //   inputValues,
      //   null,
      //   2
      // ).toString();
      // if (rect) {
      //   rect.resize(240);
      // }
    }
    return {
      result: { ...inputValues },
      followPath: undefined,
    };
  };

  const getNodeStatedHandler = () => {
    return {
      data: inputValues,
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    updateVisual(data);
  };

  const updateVisual = (data: any) => {
    if (htmlNode) {
      htmlNode.domElement.textContent = JSON.stringify(
        data,
        null,
        2
      ).toString();

      if (rect) {
        rect.resize(240);
      }
    }
  };

  return {
    name: 'show-object',
    family: 'flow-canvas',
    category: 'debug',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: 'break-words whitespace-pre-line',
        },
        undefined,
        'Input'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-fuchsia-500 p-4 rounded max-w-[240px] text-white`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: '{}',
            thumbConstraint: 'object',
            name: 'output',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: '{}',
            thumbConstraint: 'object',
            name: 'input',
            color: 'white',
          },
        ],
        wrapper,
        {
          classNames: `p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'show-object',
          formElements: [],
        }
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.updateVisual = updateVisual;

        if (id) {
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        }
      }
      return node;
    },
  };
};
