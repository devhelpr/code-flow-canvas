import {
  FlowEngine,
  NodeInfo,
  RegisterNodeFactoryFunction,
  RunCounter,
} from '@devhelpr/web-flow-executor';
import { drawGridNodeName, getDrawGridNode } from './draw-grid-worker';
import {
  webcamViewerNodeName,
  getWebcamViewerNode,
} from './webcam-viewer-worker';
import { getCanvasNode, canvasNodeName } from './canvas-node-worker';
import { promptNodeName, getPromptNode } from './prompt-worker';
import { promptImageNodeName, getPromptImageNode } from './prompt-image-worker';
import {
  createJSXElement,
  FactoryNodeRegistration,
  FlowNode,
  FormField,
  IConnectionNodeComponent,
  InitialValues,
  IRectNodeComponent,
  IRunCounter,
  isFactoryNode,
  NodeCompute,
  NodeDefinition,
  NodeTask,
  Rect,
  renderElement,
  Theme,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { pieChartDefinition } from '../custom-nodes-v2/pie-chart-definition';
import { PieChartCompute } from '../custom-nodes-v2/pie-chart-compute';
import { PlotCompute } from '../custom-nodes-v2/plot-compute';
import { plotDefinition } from '../custom-nodes-v2/plot-definition';
import { formDefinition } from '../custom-nodes-v2/form-definition';
import { FormCompute } from '../custom-nodes-v2/form-compute';
import {
  BaseRectNode,
  CreateRunCounterContext,
} from '../ai-flow-engine-worker/worker-base-rect-node-class';

const familyName = 'flow-canvas';

const getWorkerRectNode =
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
      flowNode?.width ?? 0,
      flowNode?.height ?? 0,
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
          width: 0,
          height: 0,
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

        rectNode.initNode(node, flowEngine);

        rectNode.onResize = (width: number, height: number) => {
          node.restrictHeight = height;

          // if (
          //   node.nodeInfo?.updatesVisualAfterCompute &&
          //   node.nodeInfo.updateVisual
          // ) {
          //   console.log('onresize updatesVisualAfterCompute', width, height);
          //   node.nodeInfo.updateVisual(undefined);
          // }
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

          // if (
          //   node.nodeInfo?.updatesVisualAfterCompute &&
          //   node.nodeInfo.updateVisual
          // ) {
          //   node.nodeInfo.updateVisual(undefined);
          // }
        };
        rectNode.createRunCounterContext = createRunCounterContext;

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

          if (node?.nodeInfo) {
            node.nodeInfo.delete = () => {
              if (rectNode?.destroy) {
                rectNode.destroy();
              }
            };
          }
        }
      },
      {
        category: NodeClass.category,
        hasStaticWidthHeight: false,
        hasCustomStyling: true,
        additionalClassNames: '',
        customClassName: 'custom-rect-node',
        childNodeWrapperClass: ``,
        centerToYPositionThumb: false,
        skipDetermineSizeOnInit: true,
        disableManualResize: NodeClass.disableManualResize,
        isRectThumb: true,
        rectThumbWithStraightConnections: true,
        hasFormInPopup: true,
        hasSettingsPopup: !NodeClass.getFormFields,
      },
      <div class={`child-instance`}></div>,
      true
    );
  };

function createWorker(
  nodeDefinition: NodeDefinition,
  Compute: typeof NodeCompute<NodeInfo>
) {
  return () => ({
    factory:
      () =>
      (_updated: () => void): NodeTask<NodeInfo> => {
        const compute = new Compute();
        return visualNodeFactory(
          webcamViewerNodeName,
          nodeDefinition.nodeTypeName,
          nodeDefinition.category ?? 'default',
          nodeDefinition.description,
          compute.compute,
          compute.initializeCompute,
          false,
          200,
          100,
          [],
          (_values?: InitialValues): FormField[] => {
            return [];
          },
          (nodeInstance: any) => {
            if (!nodeInstance.node.nodeInfo) {
              nodeInstance.node.nodeInfo = {};
            }
            nodeInstance.node.nodeInfo.shouldNotSendOutputFromWorkerToMainThread =
              false;
          },
          {
            category: 'default',
          },
          undefined,
          true
        );
      },
    name: nodeDefinition.nodeTypeName,
  });
}

const nodes: FactoryNodeRegistration<NodeInfo>[] = [
  () => ({
    factory: getDrawGridNode,
    name: drawGridNodeName,
  }),
  () => ({
    factory: getWebcamViewerNode,
    name: webcamViewerNodeName,
  }),
  () => ({
    factory: getCanvasNode,
    name: canvasNodeName,
  }),
  () => ({
    factory: getPromptNode,
    name: promptNodeName,
  }),
  () => ({
    factory: getPromptImageNode,
    name: promptImageNodeName,
  }),
  createWorker(pieChartDefinition, PieChartCompute),
  createWorker(plotDefinition, PlotCompute),
  createWorker(formDefinition, FormCompute),
];

export const registerWorkerNodes = (
  registerNodeFactory: RegisterNodeFactoryFunction,
  createRunCounterContext: (
    isRunViaRunButton: boolean,
    shouldResetConnectionSlider: boolean,
    onFlowFinished?: () => void
  ) => RunCounter,
  flowEngine?: FlowEngine
) => {
  nodes.forEach((RegisterNodeInfo) => {
    if (isFactoryNode(RegisterNodeInfo)) {
      const helper = RegisterNodeInfo();
      return registerNodeFactory(helper.name, helper.factory());
    } else if ((RegisterNodeInfo as any).nodeTypeName) {
      const factory = getWorkerRectNode(
        RegisterNodeInfo as any,
        createRunCounterContext,
        flowEngine
      );
      return registerNodeFactory(
        (RegisterNodeInfo as any).nodeTypeName,
        factory
      );
    }
  });
};
