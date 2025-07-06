import { NodeInfo } from '@devhelpr/web-flow-executor';
import {
  FactoryNodeRegistration,
  NodeTask,
} from '@devhelpr/visual-programming-system';
import { BaseRectNode } from './base-rect-node-class';

export type NodeRegistration =
  | typeof BaseRectNode
  | FactoryNodeRegistration<NodeInfo>;

export function isFactoryNode(
  node:
    | typeof BaseRectNode
    | (() => {
        factory: () => (_updated: () => void) => NodeTask<NodeInfo>;
        name: string;
      })
): node is () => {
  factory: () => (_updated: () => void) => NodeTask<NodeInfo>;
  name: string;
} {
  return typeof node === 'function' && !(node as any).nodeTypeName;
}

export function isBaseRectNode(
  node:
    | typeof BaseRectNode
    | (() => {
        factory: () => (_updated: () => void) => NodeTask<NodeInfo>;
        name: string;
      })
): node is typeof BaseRectNode {
  return typeof node === 'function' && (node as any).nodeTypeName;
}
