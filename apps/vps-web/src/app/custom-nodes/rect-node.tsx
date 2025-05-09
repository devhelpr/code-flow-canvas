import {
  createJSXElement,
  FlowNode,
  FormField,
  IConnectionNodeComponent,
  InitialValues,
  IRectNodeComponent,
  IRunCounter,
  NodeTask,
  Rect,
  renderElement,
  Theme,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { FlowEngine, NodeInfo } from '@devhelpr/web-flow-executor';
import {
  BaseRectNode,
  CreateRunCounterContext,
} from './classes/base-rect-node-class';

const familyName = 'flow-canvas';

export const createNodeFactoryInstance = (
  NodeClass: typeof BaseRectNode,
  createRunCounterContext: CreateRunCounterContext,
  flowEngine?: FlowEngine
) => {
  return {
    name: NodeClass.nodeTypeName,
    factory: getRectNode(NodeClass, createRunCounterContext, flowEngine),
  };
};

export const getRectNode =
  (
    NodeClass: typeof BaseRectNode,
    createRunCounterContext: CreateRunCounterContext,
    flowEngine?: FlowEngine
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
      if (rectNode.initializeCompute) {
        rectNode.initializeCompute();
      }
      return;
    };
    const computeAsync = (
      input: unknown,
      loopIndex?: number,
      payload?: unknown,
      portName?: string,
      scopeId?: string,
      runCounter?: IRunCounter,
      connection?: IConnectionNodeComponent<NodeInfo>
    ) => {
      return rectNode
        .compute(
          input,
          loopIndex,
          payload,
          portName,
          scopeId,
          runCounter,
          connection
        )
        .then((result) => {
          // if (rect && rect.resize) {
          //   rect.resize(
          //     undefined,
          //     true,
          //     rectNode.childElementSelector,
          //     true,
          //     undefined,
          //     undefined,
          //     true
          //   );
          // }
          return result;
        });
    };
    console.log('rect node width/height', flowNode?.width, flowNode?.height);

    return visualNodeFactory(
      NodeClass.nodeTypeName,
      NodeClass.nodeTitle,
      familyName,
      NodeClass.nodeTypeName,
      computeAsync,
      initializeCompute,
      false,
      flowNode?.width ?? NodeClass.initialWidth ?? 200,
      flowNode?.height ?? NodeClass.intialHeight ?? 100,
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
      (values?: InitialValues): FormField[] => {
        if (NodeClass.getFormFields) {
          return NodeClass.getFormFields(() => node, updated, values);
        }
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
          width: NodeClass.initialWidth ?? 200,
          height: NodeClass.intialHeight ?? 100,
          nodeInfo: {
            isOCIFNode: true,
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

        if (!node.nodeInfo) {
          node.nodeInfo = {} as any;
        }

        if (!flowNode) {
          if (node.nodeInfo) {
            (node.nodeInfo as any).fillColor = fillColorDefault;
            (node.nodeInfo as any).strokeColor = strokeColorDefault;
            (node.nodeInfo as any).strokeWidth = strokeWidthDefault;
            (node.nodeInfo as any).text = 'rect';
          }
        }

        if (node.nodeInfo) {
          node.nodeInfo.isOCIFNode = true;
        }

        rectNode = new NodeClass(node.id, updated, node, flowEngine);

        rectNode.rectInstance = rect;
        rectNode.canvasAppInstance = nodeInstance.contextInstance;

        rectNode.initNode(node);

        rectNode.onResize = (width: number, height: number) => {
          node.restrictHeight = height;
          if (height < (node?.height ?? 0)) {
            return;
          }
          // TODO : fix this... when changing the height, the node content is not resized
          const newHeight = height;
          //height > (node.height ?? 10) ? height : node.height ?? 10;
          console.log('RECT RESIZE via onResize', width, newHeight);
          //node.width = width;
          node.height = newHeight;
          node.isSettingSize = true;
          //rectNode.setSize(width, newHeight);

          rect?.resize(
            width,
            true,
            rectNode.childElementSelector,
            true,
            newHeight,
            true
            // true,
            // newHeight
          );
          nodeInstance.contextInstance?.nodeTransformer.resizeNodeTransformer(
            width,
            newHeight
          );
        };
        rectNode.createRunCounterContext = createRunCounterContext;
        if (rectNode.getSettingsPopup && !NodeClass.getFormFields) {
          if (!node.nodeInfo) {
            node.nodeInfo = {} as any;
          }
          (node.nodeInfo as any).getSettingsPopup = rectNode.getSettingsPopup;
          if (node.nodeInfo) {
            node.nodeInfo.showFormOnlyInPopup = true;
            node.nodeInfo.isSettingsPopup = true;
          }
        }
        if (NodeClass.getFormFields) {
          if (!node.nodeInfo) {
            node.nodeInfo = {} as any;
          }
          if (node?.nodeInfo) {
            node.nodeInfo.showFormOnlyInPopup = true;
            node.nodeInfo.isSettingsPopup = true;
          }
        }
        if (rectNode.updateVisual && node.nodeInfo) {
          node.nodeInfo.updateVisual = rectNode.updateVisual;
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
        ).querySelector(rectNode.childElementSelector);
        console.log('rect-node nodeRenderElement', nodeRenderElement);
        if (nodeRenderElement) {
          rectNode.nodeRenderElement = nodeRenderElement;
          // const resizeObserver = new ResizeObserver(() => {
          //   if (rect && rect.resize) {
          //     console.log('RECT RESIZE via observer');
          //     // problem with manual resizing is partially solved when this is commented
          //     // node content is not resized though...
          //     if (node.isSettingSize) {
          //       node.isSettingSize = false;
          //       rectNode.setSize(node.width ?? 10, node.height ?? 10);
          //       return;
          //     }
          //     if (rect && rect.resize) {
          //       rect.resize(
          //         undefined,
          //         true,
          //         rectNode.childElementSelector,
          //         true
          //       );
          //     }
          //   }
          // });
          //resizeObserver.observe(nodeRenderElement);

          // const mutationObserver = new MutationObserver(() => {
          //   if (rect && rect.resize) {
          //     console.log('RECT RESIZE via MutationObserver');
          //     // problem with manual resizing is partially solved when this is commented
          //     // node content is not resized though...
          //     if (node.isSettingSize) {
          //       node.isSettingSize = false;
          //       rectNode.setSize(node.width ?? 10, node.height ?? 10);
          //       return;
          //     }

          //     const result: { width: number; height: number } | undefined =
          //       rect.resize(
          //         undefined,
          //         true,
          //         rectNode.childElementSelector,
          //         true
          //       );
          //     if (result) {
          //       nodeInstance.contextInstance?.nodeTransformer.resizeNodeTransformer(
          //         result.width,
          //         result.height
          //       );
          //     }
          //   }
          // });
          // mutationObserver.observe(nodeRenderElement, {
          //   childList: true,
          //   subtree: true,
          //   characterData: true,
          // });
          if (node?.nodeInfo) {
            node.nodeInfo.delete = () => {
              // if (nodeRenderElement) {
              //   resizeObserver.unobserve(nodeRenderElement);
              // }
              // resizeObserver.disconnect();
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
        additionalClassNames: 'h-full w-full',
        customClassName: 'custom-rect-node',
        childNodeWrapperClass: 'child-node-wrapper h-full w-full',
        centerToYPositionThumb: false,
        skipDetermineSizeOnInit: true,
        disableManualResize: NodeClass.disableManualResize,
        isRectThumb: true,
        rectThumbWithStraightConnections: true,
        hasFormInPopup: true,
        hasSettingsPopup: !NodeClass.getFormFields,
      },
      <div class="child-instance h-full w-full"></div>,
      true
    );
  };
