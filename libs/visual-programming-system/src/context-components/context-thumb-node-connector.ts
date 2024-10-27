import {
  ElementNodeMap,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { ConnectionControllerType, ThumbType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { NodeType } from '../types/node-type';
import { createElementMap } from '../utils';

export class ContextThumbNodeConnector<T extends BaseNodeInfo> {
  nodeComponent: IThumbNodeComponent<T>;
  constructor(
    thumb: IThumb,
    elements: ElementNodeMap<T>,
    thumbName: string,
    thumbType: ThumbType,
    _connectionType?: ThumbConnectionType,
    connectionControllerType?: ConnectionControllerType,
    nodeType?: NodeType,
    index?: number,
    _canvasElements?: ElementNodeMap<T>,
    _containerNode?: IRectNodeComponent<T>
  ) {
    this.nodeComponent = {
      id: crypto.randomUUID(),
      domElement: undefined as unknown as HTMLElement,
      elements: createElementMap<T>(),
    } as unknown as IThumbNodeComponent<T>;

    this.nodeComponent.thumbName = thumbName;
    this.nodeComponent.x = 0;
    this.nodeComponent.y = 0;
    this.nodeComponent.thumbIdentifierWithinNode =
      thumb?.thumbIdentifierWithinNode;

    elements.set(this.nodeComponent.id, this.nodeComponent);
    this.nodeComponent.connectionControllerType = connectionControllerType;

    this.nodeComponent.nodeType = nodeType;
    this.nodeComponent.thumbIndex = index ?? 0;
    this.nodeComponent.thumbType = thumbType;
  }
}
