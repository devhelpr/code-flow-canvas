import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  IRectNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { ThumbNode } from './thumb';

export class ThumbConnectionController<T> extends ThumbNode<T> {
  constructor(
    canvasElement: DOMElementNode,
    canvas: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    thumbName: string,
    thumbType: ThumbType,
    connectionType?: ThumbConnectionType,
    color?: string,
    xInitial?: string | number,
    yInitial?: string | number,
    connectionControllerType?: ConnectionControllerType,
    nodeType?: NodeType,
    additionalClasses?: string,
    width?: number,
    height?: number,
    radius?: number,
    isTransparent?: boolean,
    borderColor?: string,
    index?: number,
    relativePositioned?: boolean,

    canvasElements?: ElementNodeMap<T>,
    parentRectNode?: IRectNodeComponent<T>,
    pathHiddenElement?: IElementNode<T>,
    disableInteraction?: boolean,
    label?: string,
    thumbShape?: 'circle' | 'diamond',
    canvasUpdated?: () => void,
    containerNode?: IRectNodeComponent<T>
  ) {
    super(
      canvasElement,
      canvas,
      interactionStateMachine,
      elements,
      thumbName,
      thumbType,
      connectionType,
      color,
      xInitial,
      yInitial,
      connectionControllerType,
      nodeType,
      additionalClasses,
      width,
      height,
      radius,
      isTransparent,
      borderColor,
      index,
      relativePositioned,
      canvasElements,
      parentRectNode,
      pathHiddenElement,
      disableInteraction,
      label,
      thumbShape,
      canvasUpdated,
      containerNode
    );
  }

  override connectConnection = () => {
    (this.nodeComponent?.domElement as HTMLElement).setAttribute(
      'connection-id',
      this.nodeComponent?.parent?.id ?? ''
    );
  };
}
