import {
  thumbHalfHeight,
  thumbHalfWidth,
  thumbHeight,
  thumbWidth,
} from '../constants/measures';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  IDOMElement,
  IElementNode,
  IRectNodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { ConnectionControllerType, ThumbType } from '../types';
import { NodeType } from '../types/node-type';
import { createNodeElement } from '../utils/create-element';

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
  setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void;
  circleElement: IDOMElement | undefined;
  interactionInfo: IPointerDownResult;
  containerNode?: IRectNodeComponent<T>;

  constructor(
    canvasElement: DOMElementNode,
    canvas: IElementNode<T>,
    interactionStateMachine: InteractionStateMachine<T>,
    _elements: ElementNodeMap<T>,
    _thumbName: string,
    _thumbType: ThumbType,
    _connectionType?: ThumbConnectionType,
    _color?: string,
    xInitial?: string | number,
    yInitial?: string | number,
    _connectionControllerType?: ConnectionControllerType,
    _nodeType?: NodeType,
    additionalClasses?: string,
    width?: number,
    height?: number,
    _radius?: number,
    _isTransparent?: boolean,
    _borderColor?: string,
    _index?: number,
    relativePositioned?: boolean,

    canvasElements?: ElementNodeMap<T>,
    parentRectNode?: IRectNodeComponent<T>,
    pathHiddenElement?: IElementNode<T>,
    disableInteraction?: boolean,
    _label?: string,
    _thumbShape?: 'circle' | 'diamond',
    canvasUpdated?: () => void,
    containerNode?: IRectNodeComponent<T>,
    _thumbIdentifierWithinNode?: string,
    setCanvasAction?: (canvasAction: CanvasAction, payload?: any) => void
  ) {
    this.interactionStateMachine = interactionStateMachine;
    this.disableInteraction = disableInteraction ?? false;
    this.canvas = canvas;
    this.parentRectNode = parentRectNode;
    this.canvasElement = canvasElement;
    this.canvasElements = canvasElements;
    this.pathHiddenElement = pathHiddenElement;
    this.canvasUpdated = canvasUpdated;
    this.setCanvasAction = setCanvasAction;
    this.containerNode = containerNode;

    this.interactionInfo = {
      xOffsetWithinElementOnFirstClick: 0,
      yOffsetWithinElementOnFirstClick: 0,
    };

    const initialX =
      xInitial !== undefined ? xInitial : Math.floor(Math.random() * 1024);
    const initialY =
      yInitial !== undefined ? yInitial : Math.floor(Math.random() * 500);

    this.nodeComponent = createNodeElement(
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
      this.canvasElement,
      undefined
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
