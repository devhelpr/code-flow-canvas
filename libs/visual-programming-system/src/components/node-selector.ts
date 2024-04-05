import { getCamera, transformCameraSpaceToWorldSpace } from '../camera';
import { Compositions } from '../compositions/compositions';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../interaction-state-machine';
import {
  DOMElementNode,
  ElementNodeMap,
  FlowNode,
  IConnectionNodeComponent,
  IDOMElement,
  IElementNode,
  INodeComponent,
  IPointerDownResult,
  IRectNodeComponent,
  IThumb,
  ThumbConnectionType,
} from '../interfaces';
import { Composition } from '../interfaces/composition';
import { NodeType } from '../types';
import { createElement } from '../utils';
import {
  mapConnectionToFlowNode,
  mapShapeNodeToFlowNode,
} from '../utils/serialize';

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
  createCompositionButtons: IDOMElement | undefined;
  toolsNodesPanel: IDOMElement | undefined;

  resizeMode = 'right-bottom';

  canCreateComposition = false;
  isInContainer = false;
  selectedNodes: INodeComponent<T>[] = [];
  elements: ElementNodeMap<T> = new Map();
  orgPositionMoveNodes: { [key: string]: { x: number; y: number } } = {};
  compositions: Compositions<T>;

  onAddComposition?: (
    composition: Composition<T>,
    connections: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<T>;
    }[]
  ) => void;

  onEditCompositionName: () => Promise<string | false>;

  constructor(
    rootElement: DOMElementNode,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    canCreateComposition: boolean,
    compositions: Compositions<T>,
    onEditCompositionName: () => Promise<string | false>,
    isInContainer = false
  ) {
    this.interactionStateMachine = interactionStateMachine;
    this.elements = elements;
    this.compositions = compositions;
    this.canCreateComposition = canCreateComposition;
    this.onEditCompositionName = onEditCompositionName;
    this.isInContainer = isInContainer;

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

    if (this.canCreateComposition) {
      this.toolsNodesPanel = createElement(
        'div',
        {
          class: `absolute -bottom-[48px] left-[50%] flex justify-center items-center        
       
        origin-bottom-center
        w-[96px] h-[32px] 
        -translate-x-[50%] gap-[8px] flex-grow flex-shrink-0`,
        },
        this.nodeSelectorElement?.domElement
      );

      this.createCompositionButtons = createElement(
        'div',
        {
          class: `rounded-md bg-transparant border border-white border-solid text-white p-2 m-2 hover:bg-white hover:text-slate-600 select-none whitespace-nowrap 
          disabled:border-slate-700 disabled:hover:border-slate-700 disabled:text-border-slate-700`,
          click: this.onCreateComposition,
        },
        this.toolsNodesPanel.domElement,
        'Create Composition'
      );
    }
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
    if (this.isInContainer) {
      // for now... no selections in containers (positioning is incorrect)
      return;
    }
    if (this.interactionStateMachine && this.nodeSelectorElement) {
      this.visibilityResizeControls(true);
      this.resizeSameWidthAndHeight = event.shiftKey;
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
      );
      this.selectedNodes = [];

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
    if (this.interactionStateMachine && this.nodeSelectorElement) {
      const { x, y } = transformCameraSpaceToWorldSpace(
        event.clientX,
        event.clientY
      );
      this.selectionWasPlacedOrMoved = true;

      this.resizeMode = 'move';

      this.orgPositionMoveNodes = {};
      this.selectedNodes.forEach((node) => {
        this.orgPositionMoveNodes[node.id] = {
          x: node.x,
          y: node.y,
        };
      });

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

  onPointerMoveHelper = (
    x: number,
    y: number,
    _element: INodeComponent<T>,
    _canvasNode: IElementNode<T>,
    interactionInfo: IPointerDownResult,
    _interactionStateMachine: InteractionStateMachine<T>
  ) => {
    if (this.nodeSelectorElement) {
      if (this.resizeMode == 'move') {
        const domElement = this.nodeSelectorElement.domElement as HTMLElement;

        const offsetX = x - interactionInfo.xOffsetWithinElementOnFirstClick;
        const offsetY = y - interactionInfo.yOffsetWithinElementOnFirstClick;

        domElement.style.transform = `translate(${this.orgX + offsetX}px, ${
          this.orgY + offsetY
        }px)`;

        this.selectedNodes.forEach((node) => {
          node.x = this.orgPositionMoveNodes[node.id].x + offsetX;
          node.y = this.orgPositionMoveNodes[node.id].y + offsetY;
          node.update?.(node, node.x, node.y, node);
        });
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
  onPointerUpHelper = (
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
      const offsetX = x - interactionInfo.xOffsetWithinElementOnFirstClick;
      const offsetY = y - interactionInfo.yOffsetWithinElementOnFirstClick;

      this.orgX = this.orgX + offsetX;
      this.orgY = this.orgY + offsetY;

      this.selectedNodes.forEach((node) => {
        node.x = this.orgPositionMoveNodes[node.id].x + offsetX;
        node.y = this.orgPositionMoveNodes[node.id].y + offsetY;
        node.update?.(node, node.x, node.y, node);
      });

      this.selectedNodes[0]?.updateEnd?.();
    } else {
      this.elements.forEach((element) => {
        const nodeComponent = element as unknown as IRectNodeComponent<T>;
        if (nodeComponent.nodeType === NodeType.Shape) {
          if (
            nodeComponent.x > this.orgX &&
            nodeComponent.x + (nodeComponent.width ?? 0) <
              this.orgX + this.orgWidth &&
            nodeComponent.y > this.orgY &&
            nodeComponent.y + (nodeComponent.height ?? 0) <
              this.orgY + this.orgHeight
          ) {
            this.selectedNodes.push(nodeComponent);
          }
        }
      });
    }
  };

  onPointerMove = (_event: PointerEvent) => {
    //
  };

  onPointerUp = (_event: PointerEvent) => {
    //
  };

  updateCamera() {
    if (!this.nodeSelectorElement) {
      return;
    }
    const camera = getCamera();

    // TODO: also update padding and margin depending on the camera scale
    (this.nodeSelectorElement.domElement as HTMLElement).style.borderWidth = `${
      1 / camera.scale
    }px`;

    if (this.rightBottom?.domElement) {
      const domElement = this.rightBottom?.domElement as HTMLElement;
      domElement.style.width = `${8 / camera.scale}px`;
      domElement.style.height = `${8 / camera.scale}px`;
    }
    if (this.createCompositionButtons) {
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.fontSize = `${12 / camera.scale}px`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.padding = `${0.5 / camera.scale}rem`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.margin = `${0.5 / camera.scale}rem`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.borderRadius = `${0.15 / camera.scale}rem`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.borderWidth = `${1 / camera.scale}px`;
    }
    if (this.toolsNodesPanel) {
      (this.toolsNodesPanel.domElement as HTMLElement).style.bottom = `-${
        48 / camera.scale
      }px`;
      (this.toolsNodesPanel.domElement as HTMLElement).style.height = `${
        48 / camera.scale
      }px`;
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
      this.selectedNodes = [];
    }
    this.selectionWasPlacedOrMoved = false;
  };

  /*
    TODO : for Flow-canvas when a selection contains certain nodes or combination of nodes a 
       composition can not be created:
       - if a selection contains a function-node and is called from nodes outside the selection
       - if a selection contains a call-function node and the function is defined outside the selection
       - variables
       - accessing variables
       
       in general:
       - compositions should be able to run standalone or with the help of various input nodes
       - multiple copies of the same composition should be able to run at the same time

  */
  onCreateComposition = () => {
    const thumbs: IThumb[] = [];
    let outputThumbIndex = 0;
    let inputThumbIndex = 0;

    const connectionsToCompositions: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<T>;
    }[] = [];

    const inputNodes: FlowNode<T>[] = [];
    const outputNodes: FlowNode<T>[] = [];

    const nodesInComposition = [...this.selectedNodes];

    this.onEditCompositionName().then((name) => {
      if (!name) {
        return;
      }

      this.elements.forEach((element) => {
        const nodeComponent = element as unknown as IRectNodeComponent<T>;
        if (nodeComponent.nodeType === NodeType.Shape) {
          const isNodeSelected = this.selectedNodes.find(
            (n) => n.id === nodeComponent.id
          );
          if (isNodeSelected) {
            nodeComponent.connections.forEach((connection) => {
              if (connection.startNode?.id === nodeComponent.id) {
                if (connection.endNode) {
                  const isEndNodeSelected =
                    this.selectedNodes.find(
                      (n) => n.id === connection.endNode?.id
                    ) !== undefined;
                  if (!isEndNodeSelected) {
                    // create output thumb

                    // todo : after adding composition : create composition-node and connect to endNode
                    //const endNode = connection.endNode;
                    outputNodes.push(mapShapeNodeToFlowNode(nodeComponent));
                    const outputNodeThumb = connection.startNodeThumb;
                    const thumbIdentifierWithinNode: string =
                      crypto.randomUUID();
                    if (outputNodeThumb) {
                      thumbs.push({
                        thumbIndex: outputThumbIndex,
                        thumbType: 'StartConnectorRight',
                        connectionType: ThumbConnectionType.start,
                        prefixLabel: outputNodeThumb.prefixLabel,
                        name: outputNodeThumb.thumbName,
                        prefixIcon: outputNodeThumb.prefixIcon,
                        thumbConstraint: outputNodeThumb.thumbConstraint,
                        color: 'white',
                        label: outputNodeThumb.thumbLabel,
                        thumbIdentifierWithinNode: thumbIdentifierWithinNode,
                        nodeId: nodeComponent.id,
                      });
                      outputThumbIndex++;
                    }

                    if (
                      !connectionsToCompositions.find(
                        (c) => c.connection.id === connection.id
                      )
                    ) {
                      connection.startNode = undefined;
                      connection.startNodeThumb;
                      connectionsToCompositions.push({
                        thumbIdentifierWithinNode: thumbIdentifierWithinNode,
                        connection,
                      });
                    }
                  } else {
                    // include connection
                    if (
                      !nodesInComposition.find((n) => n.id === connection.id)
                    ) {
                      nodesInComposition.push(connection);
                    }
                  }
                }
              }

              if (connection.endNode?.id === nodeComponent.id) {
                if (connection.startNode) {
                  const isStartNodeSelected =
                    this.selectedNodes.find(
                      (n) => n.id === connection.startNode?.id
                    ) !== undefined;
                  if (!isStartNodeSelected) {
                    // create input thumb

                    // todo : after adding composition : create composition-node and connect to startNode
                    //const startNode = connection.startNode;
                    inputNodes.push(mapShapeNodeToFlowNode(nodeComponent));
                    const inputNodeThumb = connection.endNodeThumb;
                    const thumbIdentifierWithinNode: string =
                      crypto.randomUUID();
                    if (inputNodeThumb) {
                      thumbs.push({
                        thumbIndex: inputThumbIndex,
                        thumbType: 'EndConnectorLeft',
                        connectionType: ThumbConnectionType.end,
                        prefixLabel:
                          inputNodeThumb.prefixLabel ||
                          (connection.endNode.label ?? ''),
                        name: inputNodeThumb.thumbName,
                        prefixIcon: inputNodeThumb.prefixIcon,
                        thumbConstraint: inputNodeThumb.thumbConstraint,
                        color: 'white',
                        label: inputNodeThumb.thumbLabel,
                        thumbIdentifierWithinNode: thumbIdentifierWithinNode,
                        nodeId: nodeComponent.id,
                      });
                      inputThumbIndex++;
                    }

                    if (
                      !connectionsToCompositions.find(
                        (c) => c.connection.id === connection.id
                      )
                    ) {
                      connection.endNode = undefined;
                      connection.endNodeThumb = undefined;
                      connectionsToCompositions.push({
                        thumbIdentifierWithinNode: thumbIdentifierWithinNode,
                        connection,
                      });
                    }
                  } else {
                    // include connection
                    if (
                      !nodesInComposition.find((n) => n.id === connection.id)
                    ) {
                      nodesInComposition.push(connection);
                    }
                  }
                }
              }
            });
          }
        }
      });

      const composition: Composition<T> = {
        id: crypto.randomUUID(),
        name: name,
        nodes: nodesInComposition.map((node) => {
          if (node.nodeType === NodeType.Connection) {
            return mapConnectionToFlowNode(node as IConnectionNodeComponent<T>);
          } else {
            return mapShapeNodeToFlowNode(node as IRectNodeComponent<T>);
          }
        }),
        thumbs: thumbs,
        inputNodes,
        outputNodes,
      };
      this.compositions.addComposition(composition);

      // remove all selected nodes from the canvas
      nodesInComposition.forEach((node) => {
        this.elements.delete(node.id);
        node.domElement?.remove();
      });

      // add composition node to the canvas with reference to the composition
      if (this.onAddComposition) {
        this.onAddComposition(composition, connectionsToCompositions);
      }

      this.selectedNodes[0]?.updateEnd?.();
      this.selectedNodes = [];
      this.selectionWasPlacedOrMoved = false;
      this.removeSelector();
    });
  };
}
