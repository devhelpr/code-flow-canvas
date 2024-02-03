import { FlowNode, IThumb } from '.';

export interface Composition<T> {
  id: string;
  name: string;
  nodes: FlowNode<T>[];
  thumbs: IThumb[];
  inputNodes?: FlowNode<T>[];
  outputNodes?: FlowNode<T>[];
  connections?: FlowNode<T>[];
}
