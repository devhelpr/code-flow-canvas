import {
  FlowEngine,
  RegisterNodeFactoryFunction,
  RunCounter,
} from '@devhelpr/web-flow-executor';
import { mermaidNodeName, getMermaidNode } from './mermaid';

import { OvalNode } from './classes/oval-node-class';
import { DrawGridNode } from './classes/draw-grid-node';
import { WebcamViewerNode } from './classes/webcam-node';
import { CanvasNode } from './classes/canvas-node-class';
import { PromptNode } from './classes/prompt-node-class';
import { PromptImageNode } from './classes/prompt-image-class';
import { pieChartDefinition } from '../custom-nodes-v2/pie-chart-definition';
import { PieChartVisual } from '../custom-nodes-v2/pie-chart-visual';
import { PieChartCompute } from '../custom-nodes-v2/pie-chart-compute';
import { plotDefinition } from '../custom-nodes-v2/plot-definition';
import { PlotCompute } from '../custom-nodes-v2/plot-compute';
import { PlotVisual } from '../custom-nodes-v2/plot-visual';
import { formDefinition } from '../custom-nodes-v2/form-definition';
import { FormCompute } from '../custom-nodes-v2/form-compute';
import { FormVisual } from '../custom-nodes-v2/form-visual';
import {
  dummy2Definition,
  dummy3Definition,
  dummyDefinition,
} from '../custom-nodes-v2/dummy-definition';
import {
  renderTestNodeDefinition,
  RenderTestNodeVisual,
} from '../custom-nodes-v2/render-test-node-definition';
import {
  NodeRegistration,
  RectNode,
  createNodeClass,
  isFactoryNode,
  isBaseRectNode,
  getRectNode,
} from '@devhelpr/app-canvas';

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
  createNodeClass(pieChartDefinition, PieChartVisual, PieChartCompute),
  createNodeClass(plotDefinition, PlotVisual, PlotCompute),
  createNodeClass(formDefinition, FormVisual, FormCompute),
  createNodeClass(dummyDefinition),
  createNodeClass(dummy2Definition),
  createNodeClass(dummy3Definition),
  createNodeClass(renderTestNodeDefinition, RenderTestNodeVisual),
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
