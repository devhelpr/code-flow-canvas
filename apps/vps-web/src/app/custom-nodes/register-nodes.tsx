import {
  FlowEngine,
  RegisterNodeFactoryFunction,
  RunCounter,
} from '@devhelpr/web-flow-executor';
import { mermaidNodeName, getMermaidNode } from './mermaid';
import { getRectNode } from './rect-node';
import { OvalNode } from './classes/oval-node-class';
import { DrawGridNode } from './classes/draw-grid-node';
import {
  isBaseRectNode,
  isFactoryNode,
  NodeRegistration,
} from './utils/register-helpers';
import { createNodeClass, RectNode } from './classes/rect-node-class';
import { WebcamViewerNode } from './classes/webcam-node';
import { CanvasNode } from './classes/canvas-node-class';
import { PromptNode } from './classes/prompt-node-class';
import { PromptImageNode } from './classes/prompt-image-class';
import { pieChartDefinition } from '../custom-nodes-v2/pie-chart-definition';
import { pieChartVisual } from '../custom-nodes-v2/pie-chart-visual';
import { pieChartCompute } from '../custom-nodes-v2/pie-chart-compute';

const nodes: NodeRegistration[] = [
  () => ({
    factory: getMermaidNode,
    name: mermaidNodeName,
  }),
  RectNode,
  OvalNode,
  DrawGridNode,
  WebcamViewerNode,
  CanvasNode,
  PromptNode,
  PromptImageNode,
  createNodeClass(pieChartDefinition, pieChartVisual, pieChartCompute),
];

export const registerNodes = (
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
