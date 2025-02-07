import {
  RegisterNodeFactoryFunction,
  RunCounter,
} from '@devhelpr/web-flow-executor';
import { mermaidNodeName, getMermaidNode } from './mermaid';
import { getRectNode } from './rect-node';
import { BaseRectNode } from './classes/rect-node-class';
import { OvalNode } from './classes/oval-node-class';
import { DrawGridNode } from './classes/draw-grid-node';
import {
  isBaseRectNode,
  isFactoryNode,
  NodeRegistration,
} from './utils/register-helpers';

const nodes: NodeRegistration[] = [
  () => ({
    factory: getMermaidNode,
    name: mermaidNodeName,
  }),
  BaseRectNode,
  OvalNode,
  DrawGridNode,
];

export const registerNodes = (
  registerNodeFactory: RegisterNodeFactoryFunction,
  createRunCounterContext: (
    isRunViaRunButton: boolean,
    shouldResetConnectionSlider: boolean,
    onFlowFinished?: () => void
  ) => RunCounter
) => {
  nodes.forEach((RegisterNodeInfo) => {
    if (isFactoryNode(RegisterNodeInfo)) {
      const helper = RegisterNodeInfo();
      return registerNodeFactory(helper.name, helper.factory());
    } else if (isBaseRectNode(RegisterNodeInfo)) {
      const factory = getRectNode(RegisterNodeInfo, createRunCounterContext);
      return registerNodeFactory(RegisterNodeInfo.nodeTypeName, factory);
    }
  });
};
