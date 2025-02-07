import {
  createJSXElement,
  FlowNode,
  FormField,
  InitialValues,
  IRectNodeComponent,
  NodeTask,
  Rect,
  renderElement,
  Theme,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo, RunCounter } from '@devhelpr/web-flow-executor';
import {
  BaseRectNode,
  CreateRunCounterContext,
} from './classes/rect-node-class';

const familyName = 'flow-canvas';

export const createNodeFactoryInstance = (
  NodeClass: typeof BaseRectNode,
  createRunCounterContext: CreateRunCounterContext
) => {
  return {
    name: NodeClass.nodeTypeName,
    factory: getRectNode(NodeClass, createRunCounterContext),
  };
};

export const getRectNode =
  (
    NodeClass: typeof BaseRectNode,
    createRunCounterContext: CreateRunCounterContext
  ) =>
  (
    updated: () => void,
    _theme?: Theme,
    flowNode?: FlowNode<NodeInfo>
  ): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let rect: Rect<NodeInfo> | undefined;
    let rectNode: BaseRectNode;
    let nodeRenderElement: HTMLElement | null = null;
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (input: string, loopIndex?: number, payload?: any) => {
      return rectNode.compute(input, loopIndex, payload).then((result) => {
        if (rect && rect.resize) {
          rect.resize(
            undefined,
            true,
            '.child-node-wrapper > *:first-child',
            true
          );
        }
        return result;
      });
    };

    return visualNodeFactory(
      NodeClass.nodeTypeName,
      NodeClass.nodeTitle,
      familyName,
      NodeClass.nodeTypeName,
      computeAsync,
      initializeCompute,
      false,
      flowNode?.width ?? 200,
      flowNode?.height ?? 100,
      [
        {
          thumbType: ThumbType.Center,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.startOrEnd,
          color: 'white',
          label: ' ',
          name: 'input-output',
          hidden: true,
          maxConnections: -1,
        },
      ],
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        const fillColorDefault = 'black';
        const strokeColorDefault = 'white';
        const strokeWidthDefault = 2;

        const flowNodeInstance: FlowNode<NodeInfo> = flowNode ?? {
          id: nodeInstance.node.id,
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          nodeInfo: {
            fillColor: fillColorDefault,
            strokeColor: strokeColorDefault,
            strokeWidth: strokeWidthDefault,
            text: NodeClass.text,
          } as any,
        };
        if (!flowNodeInstance) {
          return;
        }
        rect = nodeInstance.rect;
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        if (!flowNode) {
          if (!node.nodeInfo) {
            node.nodeInfo = {} as any;
          }
          (node.nodeInfo as any).fillColor = fillColorDefault;
          (node.nodeInfo as any).strokeColor = strokeColorDefault;
          (node.nodeInfo as any).strokeWidth = strokeWidthDefault;
          (node.nodeInfo as any).text = 'rect';
        }

        rectNode = new NodeClass(node.id, updated, node);
        rectNode.rectInstance = rect;
        rectNode.canvasAppInstance = nodeInstance.contextInstance;
        rectNode.createRunCounterContext = createRunCounterContext;
        if (rectNode.getSettingsPopup) {
          if (!node.nodeInfo) {
            node.nodeInfo = {} as any;
          }
          (node.nodeInfo as any).getSettingsPopup = rectNode.getSettingsPopup;
          if (node.nodeInfo) {
            node.nodeInfo.showFormOnlyInPopup = true;
            node.nodeInfo.isSettingsPopup = true;
          }
        }

        const childNodeWrapper = (nodeRenderElement = (
          rect?.nodeComponent?.domElement as HTMLElement
        ).querySelector('.child-node-wrapper'));
        const childNodeInstance =
          childNodeWrapper?.querySelector('.child-instance');
        if (childNodeInstance) {
          childNodeInstance.remove();
        }

        renderElement(rectNode.render(flowNodeInstance), childNodeWrapper);
        nodeRenderElement = (
          rect?.nodeComponent?.domElement as HTMLElement
        ).querySelector('.child-node-wrapper > *:first-child');
        if (nodeRenderElement) {
          rectNode.nodeRenderElement = nodeRenderElement;
          const resizeObserver = new ResizeObserver(() => {
            if (rect && rect.resize) {
              console.log('RECT RESIZE via observer');
              // problem with manual resizing is partially solved when this is commented
              // node content is not resized though...
              if (node.isSettingSize) {
                node.isSettingSize = false;
                rectNode.setSize(node.width ?? 10, node.height ?? 10);
                return;
              }
              rect.resize(
                undefined,
                true,
                '.child-node-wrapper > *:first-child',
                true
              );
            }
          });
          resizeObserver.observe(nodeRenderElement);

          const mutationObserver = new MutationObserver(() => {
            if (rect && rect.resize) {
              console.log('RECT RESIZE via MutationObserver');
              // problem with manual resizing is partially solved when this is commented
              // node content is not resized though...
              if (node.isSettingSize) {
                node.isSettingSize = false;
                rectNode.setSize(node.width ?? 10, node.height ?? 10);
                return;
              }

              const result: { width: number; height: number } | undefined =
                rect.resize(
                  undefined,
                  true,
                  '.child-node-wrapper > *:first-child',
                  true
                );
              if (result) {
                nodeInstance.contextInstance?.nodeTransformer.resizeNodeTransformer(
                  result.width,
                  result.height
                );
              }
            }
          });
          mutationObserver.observe(nodeRenderElement, {
            childList: true,
            subtree: true,
            characterData: true,
          });
          if (node?.nodeInfo) {
            node.nodeInfo.delete = () => {
              if (nodeRenderElement) {
                resizeObserver.unobserve(nodeRenderElement);
              }
              resizeObserver.disconnect();
            };
          }
        }
        // if (rect && rect.resize) {
        //   rect.resize(undefined, undefined, undefined, true);
        // }
      },
      {
        category: NodeClass.category,
        hasStaticWidthHeight: true,
        hasCustomStyling: true,
        customClassName: 'custom-rect-node',
        childNodeWrapperClass: 'child-node-wrapper',
        centerToYPositionThumb: false,
        skipDetermineSizeOnInit: true,

        isRectThumb: true,
        rectThumbWithStraightConnections: true,
      },
      <div class="child-instance"></div>,
      true
    );
  };
