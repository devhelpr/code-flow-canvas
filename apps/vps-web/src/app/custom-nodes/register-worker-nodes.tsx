import {
  FlowEngine,
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
