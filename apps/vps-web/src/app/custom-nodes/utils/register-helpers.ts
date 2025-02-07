import { NodeInfo } from '@devhelpr/web-flow-executor';
import { NodeTask } from '@devhelpr/visual-programming-system';
import { BaseRectNode } from '../classes/rect-node-class';

export type NodeRegistration =
  | typeof BaseRectNode
  | (() => {
      factory: () => (_updated: () => void) => NodeTask<NodeInfo>;
      name: string;
    });

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
