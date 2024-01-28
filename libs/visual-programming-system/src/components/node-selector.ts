import { getCamera, transformCameraSpaceToWorldSpace } from '../camera';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  IDOMElement,
  IElementNode,
  INodeComponent,
  IPointerDownResult,
} from '../interfaces';
import { createElement } from '../utils';

const pointerCursor = 'pointer-events-auto';
const resizeThumbSize = 'w-[8px] h-[8px]';
const transformPosTL = '-translate-x-[50%] -translate-y-[50%]';
const transformPosTR = 'translate-x-[50%] -translate-y-[50%]';
const transformPosBL = '-translate-x-[50%] translate-y-[50%]';
const transformPosBR = 'translate-x-[50%] translate-y-[50%]';

export class NodeSelector<T> {
  nodeSelectorElement: IDOMElement | undefined;
  interactionStateMachine: InteractionStateMachine<T> | undefined;

  leftTop: IDOMElement | undefined;
  rightTop: IDOMElement | undefined;
  leftBottom: IDOMElement | undefined;
  rightBottom: IDOMElement | undefined;

  resizeMode = 'right-bottom';

  constructor(
    rootElement: DOMElementNode,
    interactionStateMachine: InteractionStateMachine<T>
  ) {
    this.interactionStateMachine = interactionStateMachine;
    this.nodeSelectorElement = createElement(
      'div',
      {
        id: 'node-selector',
        class:
          'hidden absolute top-0 left-0 z-[1000] border-white border-2 pointer-events-auto',
        pointerdown: this.onPointerDownSelector,
        pointermove: this.onPointerMove,
      },
      rootElement
    );

    this.leftTop = createElement(
      'div',
      {
        class: `hidden absolute ${pointerCursor} cursor-nwse-resize  top-0 left-0 origin-top-left ${resizeThumbSize} bg-white ${transformPosTL}`,
        ['data-ResizeMode']: 'left-top',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeSelectorElement?.domElement
    );

    this.rightTop = createElement(
      'div',
      {
        class: `hidden absolute ${pointerCursor} cursor-nesw-resize top-0 right-0  origin-top-right ${resizeThumbSize} bg-white ${transformPosTR}`,
        ['data-ResizeMode']: 'right-top',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeSelectorElement?.domElement
    );

    this.leftBottom = createElement(
      'div',
      {
        class: `hidden absolute ${pointerCursor} cursor-nesw-resize bottom-0 left-0 origin-bottom-left ${resizeThumbSize} bg-white ${transformPosBL}`,
        ['data-ResizeMode']: 'left-bottom',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDown,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeSelectorElement?.domElement
    );

    this.rightBottom = createElement(
      'div',
      {
        class: `absolute ${pointerCursor} cursor-nwse-resize bottom-0 right-0 origin-bottom-right ${resizeThumbSize} bg-white ${transformPosBR}`,
        ['data-ResizeMode']: 'right-bottom',
        pointerover: this.onPointerOver,
        pointerleave: this.onPointerLeave,
        pointerdown: this.onPointerDownCorner,
        pointermove: this.onPointerMove,
        pointerup: this.onPointerUp,
      },
      this.nodeSelectorElement?.domElement
    );
  }

  onPointerOver = (_event: PointerEvent) => {
    //
  };

  onPointerLeave = (_event: PointerEvent) => {
    //this.detachNode();
  };

  orgX = 0;
  orgY = 0;
  orgWidth = 0;
  orgHeight = 0;
  resizeSameWidthAndHeight = false;

  onPointerDown = (event: PointerEvent) => {
    if (this.interactionStateMachine && this.nodeSelectorElement) {
      this.visibilityResizeControls(true);
      this.resizeSameWidthAndHeight = event.shiftKey;
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
      );

      this.resizeMode = 'right-bottom';
      this.orgX = x;
      this.orgY = y;
      this.orgWidth = 0;
      this.orgHeight = 0;
      const domElement = this.nodeSelectorElement.domElement as HTMLElement;
      domElement.style.width = `${this.orgWidth}px`;
      domElement.style.height = `${this.orgHeight}px`;
      domElement.style.transform = `translate(${this.orgX}px, ${this.orgY}px)`;

      this.selectionWasPlacedOrMoved = true;
      this.interactionStateMachine.interactionEventState(
        InteractionEvent.PointerDown,
        {
          id: this.nodeSelectorElement?.id,
          type: 'Select',
          interactionInfo: {
            xOffsetWithinElementOnFirstClick: x,
            yOffsetWithinElementOnFirstClick: y,
          },
          pointerMove: this.onPointerMoveHelper,
          pointerUp: this.onPointerUpHelper,
        },
        this.nodeSelectorElement as INodeComponent<T>
      );
      event.stopPropagation();
      return false;
    }
    return true;
  };

  onPointerDownCorner = (event: PointerEvent) => {
    if (this.interactionStateMachine && this.nodeSelectorElement) {
      this.selectionWasPlacedOrMoved = true;

      this.resizeMode = 'right-bottom';

      this.interactionStateMachine.interactionEventState(
        InteractionEvent.PointerDown,
        {
          id: this.nodeSelectorElement?.id,
          type: 'Select',
          interactionInfo: {
            xOffsetWithinElementOnFirstClick: this.orgX,
            yOffsetWithinElementOnFirstClick: this.orgY,
          },
          pointerMove: this.onPointerMoveHelper,
          pointerUp: this.onPointerUpHelper,
        },
        this.nodeSelectorElement as INodeComponent<T>
      );
      event.stopPropagation();
    }
  };

  onPointerDownSelector = (event: PointerEvent) => {
    console.log('onPointerDownSelector');
    if (this.interactionStateMachine && this.nodeSelectorElement) {
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
      );
      this.selectionWasPlacedOrMoved = true;

      this.resizeMode = 'move';

      this.interactionStateMachine.interactionEventState(
        InteractionEvent.PointerDown,
        {
          id: this.nodeSelectorElement?.id,
          type: 'Select',
          interactionInfo: {
            xOffsetWithinElementOnFirstClick: x,
            yOffsetWithinElementOnFirstClick: y,
          },
          pointerMove: this.onPointerMoveHelper,
          pointerUp: this.onPointerUpHelper,
        },
        this.nodeSelectorElement as INodeComponent<T>
      );
      event.stopPropagation();
    }
  };

  onPointerMoveHelper = <T>(
    x: number,
    y: number,
    _element: INodeComponent<T>,
    _canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    _interactionStateMachine: InteractionStateMachine<T>
  ) => {
    // console.log(
    //   'onPointerMoveHelper',
    //   this.orgX,
    //   this.orgY,
    //   x,
    //   y,
    //   interactionInfo.xOffsetWithinElementOnFirstClick,
    //   interactionInfo.yOffsetWithinElementOnFirstClick
    // );

    if (this.nodeSelectorElement) {
      if (this.resizeMode == 'move') {
        const domElement = this.nodeSelectorElement.domElement as HTMLElement;
        domElement.style.transform = `translate(${
          this.orgX + x - interactionInfo.xOffsetWithinElementOnFirstClick
        }px, ${
          this.orgY + y - interactionInfo.yOffsetWithinElementOnFirstClick
        }px)`;
      } else if (this.resizeMode == 'right-bottom') {
        const newWidth = x - interactionInfo.xOffsetWithinElementOnFirstClick;
        const newHeight = y - interactionInfo.yOffsetWithinElementOnFirstClick;
        this.orgWidth = newWidth;
        this.orgHeight = newHeight;
        const domElement = this.nodeSelectorElement.domElement as HTMLElement;
        domElement.style.width = `${this.orgWidth}px`;
        domElement.style.height = `${this.orgHeight}px`;
        domElement.style.transform = `translate(${this.orgX}px, ${this.orgY}px)`;
      }
    }
  };

  selectionWasPlacedOrMoved = false;
  onPointerUpHelper = <T>(
    x: number,
    y: number,
    _element: INodeComponent<T>,
    _canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    interactionStateMachine: InteractionStateMachine<T>
  ) => {
    interactionStateMachine.reset();
    this.selectionWasPlacedOrMoved = true;

    if (this.resizeMode == 'move') {
      this.orgX =
        this.orgX + x - interactionInfo.xOffsetWithinElementOnFirstClick;
      this.orgY =
        this.orgY + y - interactionInfo.yOffsetWithinElementOnFirstClick;
    }
  };

  onPointerMove = (event: PointerEvent) => {
    console.log(
      'pointerMove nodetransformer',
      (event.target as HTMLElement).getAttribute('data-ResizeMode')
    );
  };

  onPointerUp = (_event: PointerEvent) => {
    //
  };

  updateCamera() {
    if (!this.nodeSelectorElement) {
      return;
    }
    const camera = getCamera();

    (this.nodeSelectorElement.domElement as HTMLElement).style.borderWidth = `${
      1 / camera.scale
    }px`;

    if (this.rightBottom?.domElement) {
      const domElement = this.rightBottom?.domElement as HTMLElement;
      domElement.style.width = `${8 / camera.scale}px`;
      domElement.style.height = `${8 / camera.scale}px`;
    }
  }

  visibilityResizeControls(visible: boolean) {
    const addClass = visible ? 'block' : 'hidden';
    const removeClass = visible ? 'hidden' : 'block';

    (this.nodeSelectorElement?.domElement as HTMLElement).classList.add(
      addClass
    );
    (this.nodeSelectorElement?.domElement as HTMLElement).classList.remove(
      removeClass
    );

    // (this.leftTop?.domElement as HTMLElement).classList.add(addClass);
    // (this.leftTop?.domElement as HTMLElement).classList.remove(removeClass);

    // (this.rightTop?.domElement as HTMLElement).classList.add(addClass);
    // (this.rightTop?.domElement as HTMLElement).classList.remove(removeClass);

    // (this.leftBottom?.domElement as HTMLElement).classList.add(addClass);
    // (this.leftBottom?.domElement as HTMLElement).classList.remove(removeClass);

    (this.rightBottom?.domElement as HTMLElement).classList.add(addClass);
    (this.rightBottom?.domElement as HTMLElement).classList.remove(removeClass);
  }

  removeSelector = () => {
    if (!this.selectionWasPlacedOrMoved) {
      this.visibilityResizeControls(false);
    }
    this.selectionWasPlacedOrMoved = false;
  };
}
