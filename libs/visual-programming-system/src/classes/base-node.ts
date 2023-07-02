import { DOMElementNode } from '../interfaces';

export type NodeMap<T> = Map<string, BaseNode<T>>;

export abstract class BaseNode<T> {
  abstract id: string;
  //abstract domElement: DOMElementNode;
  abstract elements: NodeMap<T>;
  abstract nodeInfo?: T;
  abstract parent?: BaseNode<T>;
  //abstract canvas?: BaseNode<T>;
  abstract disableInteraction?: boolean;
  abstract update(): void;
}
