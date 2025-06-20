import {
  FlowEngine,
  NodeInfo,
  RegisterNodeFactoryFunction,
  RunCounter,
} from '@devhelpr/web-flow-executor';
import { getRectNode } from './rect-node';
import {
  isBaseRectNode,
  isFactoryNode,
  NodeRegistration,
} from './utils/register-helpers';
import { drawGridNodeName, getDrawGridNode } from './draw-grid-worker';
import {
  webcamViewerNodeName,
  getWebcamViewerNode,
} from './webcam-viewer-worker';
import { getCanvasNode, canvasNodeName } from './canvas-node-worker';
import { promptNodeName, getPromptNode } from './prompt-worker';
import { promptImageNodeName, getPromptImageNode } from './prompt-image-worker';
import {
  FormField,
  InitialValues,
  NodeCompute,
  NodeDefinition,
  NodeTask,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { pieChartDefinition } from '../custom-nodes-v2/pie-chart-definition';
import { PieChartCompute } from '../custom-nodes-v2/pie-chart-compute';
import { PlotCompute } from '../custom-nodes-v2/plot-compute';
import { plotDefinition } from '../custom-nodes-v2/plot-definition';
import { formDefinition } from '../custom-nodes-v2/form-definition';
import { FormCompute } from '../custom-nodes-v2/form-compute';

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

const nodes: NodeRegistration[] = [
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
    } else if (isBaseRectNode(RegisterNodeInfo)) {
      const factory = getRectNode(
        RegisterNodeInfo,
        createRunCounterContext,
        flowEngine
      );
      return registerNodeFactory(RegisterNodeInfo.nodeTypeName, factory);
    }
  });
};
