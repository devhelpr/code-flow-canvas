import { connect } from 'http2';
import { transformCameraSpaceToWorldSpace } from '../camera';
import {
  paddingRect,
  thumbFontSizeClass,
  thumbHalfHeight,
  thumbHalfWidth,
  thumbHeight,
  thumbInnerCircleSizeClasses,
  thumbRadius,
  thumbTextBaseSizeClass,
  thumbWidth,
} from '../constants/measures';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { getSelectedNode } from '../reactivity';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createElement } from '../utils/create-element';
import { pointerDown, pointerMove, pointerUp } from './events/pointer-events';
import { CubicBezierConnection } from './qubic-bezier-connection';

export class ThumbNode<T> {
  nodeComponent?: IThumbNodeComponent<T>;
  interactionStateMachine: InteractionStateMachine<T>;
  disableInteraction = false;
  canvas: IElementNode<T> | undefined;
  parentRectNode?: IRectNodeComponent<T>;
  canvasElement: DOMElementNode;
  canvasElements?: ElementNodeMap<T>;
  pathHiddenElement?: IElementNode<T>;
  canvasUpdated?: () => void;
  circleElement: IElementNode<T> | undefined;
  interactionInfo: IPointerDownResult;
  containerNode?: IRectNodeComponent<T>;

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
    this.interactionStateMachine = interactionStateMachine;
    this.disableInteraction = disableInteraction ?? false;
    this.canvas = canvas;
    this.parentRectNode = parentRectNode;
    this.canvasElement = canvasElement;
    this.canvasElements = canvasElements;
    this.pathHiddenElement = pathHiddenElement;
    this.canvasUpdated = canvasUpdated;
    this.containerNode = containerNode;

    this.interactionInfo = {
      xOffsetWithinElementOnFirstClick: 0,
      yOffsetWithinElementOnFirstClick: 0,
    };

    const initialX =
      xInitial !== undefined ? xInitial : Math.floor(Math.random() * 1024);
    const initialY =
      yInitial !== undefined ? yInitial : Math.floor(Math.random() * 500);

    this.nodeComponent = createElement(
      'div',
      {
        // will-change-transform
        class: `thumb absolute transition-none pointer-events-none ${
          additionalClasses || ''
        }`,
        style: {
          transform: relativePositioned
            ? ''
            : `translate(${initialX}px, ${initialY}px)`,
          width: `${width ?? thumbWidth}px`,
          height: `${height ?? thumbHeight}px`,
          top: relativePositioned
            ? `calc(${initialY}px - ${(height ?? thumbHeight) / 2}px)`
            : `-${thumbHalfHeight}px`,
          left: relativePositioned
            ? `calc(${initialX}px - ${(width ?? thumbWidth) / 2}px)`
            : `-${thumbHalfWidth}px`,
        },
        width: width ?? thumbWidth,
        height: height ?? thumbHeight,
        contextmenu: (event) => {
          event.preventDefault();
          console.log('contextmenu');
          event.stopPropagation();
          interactionStateMachine.reset();
          return false;
        },
      },
      this.canvasElement
    ) as IThumbNodeComponent<T>;
  }

  setDisableInteraction = () => {
    if (!this.disableInteraction) {
      this.disableInteraction = true;
      const circleDomElement = this.circleElement
        ?.domElement as unknown as SVGElement;
      circleDomElement.classList.remove('pointer-events-auto');
      circleDomElement.classList.add('pointer-events-none');
    }
  };

  setEnableInteraction = () => {
    if (this.disableInteraction) {
      this.disableInteraction = false;
      const circleDomElement = this.circleElement
        ?.domElement as unknown as SVGElement;
      circleDomElement.classList.remove('pointer-events-none');
      circleDomElement.classList.add('pointer-events-auto');
    }
  };
}
