import { INodeComponent } from '@devhelpr/visual-programming-system';

export abstract class NodeStrategy<T> {
  abstract createNode(node: string): INodeComponent<T>;
}
