import {
  ElementNodeMap,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
} from '../interfaces/element';
import { BaseNodeInfo } from '../types/base-node-info';
import { NodeType } from '../types/node-type';
import { createElementMap } from '../utils';

export class ContextConnection<T extends BaseNodeInfo> {
  nodeComponent?: IConnectionNodeComponent<T>;
  containerNode?: INodeComponent<T>;

  constructor(
    elements: ElementNodeMap<T>,
    id?: string,
    containerNode?: IRectNodeComponent<T>
  ) {
    this.containerNode = containerNode;

    this.nodeComponent = {
      id: id,
      domElement: undefined as unknown as HTMLElement,
      elements: createElementMap<T>(),
    } as unknown as IConnectionNodeComponent<T>;
    if (!this.nodeComponent) throw new Error('nodeComponent is undefined');
    this.nodeComponent.nodeType = NodeType.Connection;
    this.nodeComponent.controlPointNodes = [];
    this.nodeComponent.containerNode = containerNode;

    elements.set(this.nodeComponent.id, this.nodeComponent);
  }
}
