import {
  BaseNodeInfo,
  INodeComponent,
} from '@devhelpr/visual-programming-system';

export abstract class NodeStrategy<T extends BaseNodeInfo> {
  abstract createNode(node: string): INodeComponent<T>;
}
