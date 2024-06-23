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
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    label: ' ',
    //thumbConstraint: '',
    name: 'output',
    color: 'white',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    label: ' ',
    //thumbConstraint: 'array',
    name: 'input',
    color: 'white',
  },
];
export const getShowInput: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let inputValues: any;
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = '';
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

      if (inputValues && typeof inputValues === 'object') {
        htmlNode.domElement.textContent = JSON.stringify(inputValues, null, 2);
      } else if (inputValues && Array.isArray(inputValues)) {
        let output = '';
        inputValues.forEach((item) => {
          if (typeof item === 'object') {
            output += JSON.stringify(item, null, 2) + '\n';
          } else {
            output += item + '\n';
          }
        });
        htmlNode.domElement.textContent = output;
      } else {
        htmlNode.domElement.textContent = (inputValues || '-').toString();
      }
      if (rect) {
        rect.resize(240);
      }
    }
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  const getNodeStatedHandler = () => {
    return {
      data: structuredClone(inputValues),
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    updateVisual(data);
  };

  const updateVisual = (data: any) => {
    if (htmlNode) {
      if (data && typeof data === 'object') {
        htmlNode.domElement.textContent = JSON.stringify(data, null, 2);
      } else if (data && Array.isArray(data)) {
        let output = '';
        data.forEach((item) => {
          if (typeof item === 'object') {
            output += JSON.stringify(item, null, 2) + '\n';
          } else {
            output += item + '\n';
          }
        });
        htmlNode.domElement.textContent = output;
      } else {
        htmlNode.domElement.textContent = (data || '-').toString();
      }
    }
  };
  return {
    name: 'show-input',
    family: 'flow-canvas',
    category: 'debug',
    thumbs,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: 'break-words text-center',
          style: {
            display: '-webkit-box',
            '-webkit-line-clamp': '10',
            '-webkit-box-orient': 'vertical',
            overflow: 'hidden',
          },
        },
        undefined,
        'Input'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-fuchsia-500 p-4 rounded max-w-[120px] max-h-[500px] text-white`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        120,
        100,
        undefined,
        thumbs,
        wrapper,
        {
          classNames: `p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'show-input',
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
