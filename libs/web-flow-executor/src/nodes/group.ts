import {
  IFlowCanvasBase,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { getShowNodeFamilyCssClasses } from '../consts/show-node-family-css-classes';
const cssClasses = getShowNodeFamilyCssClasses();

export const getGroup: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    return;
  };
  const compute = (input: string | any[]) => {
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  return {
    name: 'group',
    family: 'flow-canvas',
    category: 'flow-canvas',
    thumbs: [],
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      _containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number,
      _nestedLevel?: number,
      nodeInfo?: NodeInfo
    ) => {
      const wrapper = createElement(
        'div',
        {
          class: `${cssClasses.wrapperGroupCssClasses} bg-purple-500`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        width ?? 120,
        height ?? 100,
        undefined,
        [],
        wrapper,
        {
          classNames: `p-4 rounded group-node`,
          customClassName: 'group-node',
        },
        true,
        false,
        true,
        id,
        {
          ...nodeInfo,
          type: 'group',
          formElements: [],
          formValues: {},
          isGroup: true,
        }
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.isGroup = true;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.isSettingsPopup = true;

        node.nodeInfo.formElements = [];
      }
      return node;
    },
  };
};
