import { getCamera, transformCameraSpaceToWorldSpace } from '../camera';
import { Compositions } from '../compositions/compositions';
import {
  InteractionEvent,
  InteractionStateMachine,
} from '../interaction-state-machine';
import {
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
import { GetNodeTaskFactory } from '../interfaces/node-task-registry';
import { NodeType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';
import { createElement } from '../utils';
import { getPointerPos } from '../utils/pointer-pos';
import {
  mapConnectionToFlowNode,
  mapShapeNodeToFlowNode,
} from '../utils/serialize';
import { getNodeSelectorCssClasses } from './css-classes/node-selector-css-classes';
import { standardTheme } from '../themes/standard';
import { IFlowCanvasBase } from '../canvas-app/flow-canvas';
import { getThumbNodeByName } from '../utils/thumbs';

const pointerCursor = 'pointer-events-auto';
const resizeThumbSize = 'w-[8px] h-[8px]';
const transformPosTL = '-translate-x-[50%] -translate-y-[50%]';
const transformPosTR = 'translate-x-[50%] -translate-y-[50%]';
const transformPosBL = '-translate-x-[50%] translate-y-[50%]';
const transformPosBR = 'translate-x-[50%] translate-y-[50%]';

export class NodeSelector<T extends BaseNodeInfo> {
  private canvas: IElementNode<T> | undefined;
  private rootElement: HTMLElement;

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
  selectedConnections: IConnectionNodeComponent<T>[] = [];
  elements: ElementNodeMap<T> = new Map();
  orgPositionMoveNodes: { [key: string]: { x: number; y: number } } = {};
  compositions: Compositions<T>;
  protected cssClasses: ReturnType<typeof getNodeSelectorCssClasses>;
  onAddComposition?: (
    composition: Composition<T>,
    connections: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<T>;
    }[]
  ) => void;

  onEditCompositionName: () => Promise<string | false>;
  getNodeTaskFactory: GetNodeTaskFactory<T> | undefined;
  canvasApp: IFlowCanvasBase<T>;
  constructor(
    canvasApp: IFlowCanvasBase<T>,
    canvas: IElementNode<T>,
    rootElement: HTMLElement,
    interactionStateMachine: InteractionStateMachine<T>,
    elements: ElementNodeMap<T>,
    canCreateComposition: boolean,
    compositions: Compositions<T>,
    onEditCompositionName: () => Promise<string | false>,
    isInContainer = false,
    getNodeTaskFactory?: GetNodeTaskFactory<T>
  ) {
    this.canvasApp = canvasApp;
    this.cssClasses = getNodeSelectorCssClasses();
    this.rootElement = rootElement;
    this.canvas = canvas;
    this.interactionStateMachine = interactionStateMachine;
    this.elements = elements;
    this.compositions = compositions;
    this.canCreateComposition = canCreateComposition;
    this.onEditCompositionName = onEditCompositionName;
    this.isInContainer = isInContainer;
    this.getNodeTaskFactory = getNodeTaskFactory;

    this.nodeSelectorElement = createElement(
      'div',
      {
        id: 'node-selector',
        class: this.cssClasses.nodeSelectorClasses,
        pointerdown: this.onPointerDownSelector,
        pointermove: this.onPointerMove,
      },
      canvas.domElement
    );

    this.leftTop = createElement(
      'div',
      {
        class: `${this.cssClasses.leftTopClasses} ${pointerCursor} ${resizeThumbSize} ${transformPosTL}`,
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
        class: `${this.cssClasses.rightTopClasses} ${pointerCursor} ${resizeThumbSize} ${transformPosTR}`,
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
        class: `${this.cssClasses.leftBottomClasses} ${pointerCursor} ${resizeThumbSize} ${transformPosBL}`,
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
        class: `${this.cssClasses.rightBottomClasses} ${pointerCursor} ${resizeThumbSize} ${transformPosBR}`,
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
          class: this.cssClasses.toolsPanelClasses,
        },
        this.nodeSelectorElement?.domElement
      );

      if (!this.toolsNodesPanel) {
        return;
      }

      this.createCompositionButtons = createElement(
        'button',
        {
          class: this.cssClasses.createCompositionButtonClasses,
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
    if (
      this.interactionStateMachine &&
      this.nodeSelectorElement &&
      this.canvas
    ) {
      this.visibilityResizeControls(true);
      this.resizeSameWidthAndHeight = event.shiftKey;

      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        event
      );

      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
      );
      this.selectedNodes = [];
      this.selectedConnections = [];

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
    if (
      this.interactionStateMachine &&
      this.nodeSelectorElement &&
      this.canvas
    ) {
      const { pointerXPos, pointerYPos } = getPointerPos(
        this.canvas.domElement as HTMLElement,
        this.rootElement,
        event
      );
      const { x, y } = transformCameraSpaceToWorldSpace(
        pointerXPos,
        pointerYPos
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
        } else if (nodeComponent.nodeType === NodeType.Connection) {
          const connection =
            nodeComponent as unknown as IConnectionNodeComponent<T>;
          if (
            connection.x > this.orgX &&
            connection.endX < this.orgX + this.orgWidth &&
            connection.y > this.orgY &&
            connection.endY < this.orgY + this.orgHeight
          ) {
            this.selectedConnections.push(connection);
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
    const reversScale = 1 / Math.sqrt(camera.scale);
    // TODO: also update padding and margin depending on the camera scale
    (
      this.nodeSelectorElement.domElement as HTMLElement
    ).style.borderWidth = `${reversScale}px`;

    if (this.rightBottom?.domElement) {
      const domElement = this.rightBottom?.domElement as HTMLElement;
      domElement.style.width = `${8 * reversScale}px`;
      domElement.style.height = `${8 * reversScale}px`;
    }
    if (this.createCompositionButtons) {
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.fontSize = `${12 * reversScale}px`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.padding = `${0.5 * reversScale}rem`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.margin = `${0.5 * reversScale}rem`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.borderRadius = `${0.15 * reversScale}rem`;
      (
        this.createCompositionButtons.domElement as HTMLElement
      ).style.borderWidth = `${reversScale}px`;
    }
    if (this.toolsNodesPanel) {
      (this.toolsNodesPanel.domElement as HTMLElement).style.bottom = `-${
        48 * reversScale
      }px`;
      (this.toolsNodesPanel.domElement as HTMLElement).style.height = `${
        48 * reversScale
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

    (this.rightBottom?.domElement as HTMLElement).classList.add(addClass);
    (this.rightBottom?.domElement as HTMLElement).classList.remove(removeClass);
  }

  removeSelector = () => {
    if (!this.selectionWasPlacedOrMoved) {
      this.visibilityResizeControls(false);
      this.selectedNodes = [];
      this.selectedConnections = [];
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
    if (!this.getNodeTaskFactory) {
      return;
    }
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

      let minX = -1;
      let minY = -1;
      let maxX = -1;
      let maxY = -1;
      this.elements.forEach((element) => {
        const nodeComponent = element as unknown as IRectNodeComponent<T>;
        if (nodeComponent.nodeType === NodeType.Shape) {
          const isNodeSelected = this.selectedNodes.find(
            (n) => n.id === nodeComponent.id
          );
          if (isNodeSelected) {
            if (nodeComponent.x < minX || minX === -1) {
              minX = nodeComponent.x;
            }
            if (nodeComponent.y < minY || minY === -1) {
              minY = nodeComponent.y;
            }
            if (
              nodeComponent.x + (nodeComponent.width ?? 0) > maxX ||
              maxX === -1
            ) {
              maxX = nodeComponent.x + (nodeComponent.width ?? 0);
            }
            if (
              nodeComponent.y + (nodeComponent.height ?? 0) > maxY ||
              maxY === -1
            ) {
              maxY = nodeComponent.y + (nodeComponent.height ?? 0);
            }
          }
        }
      });

      minX -= 300;
      maxX += 300;

      this.elements.forEach((element) => {
        const nodeComponent = element as unknown as IRectNodeComponent<T>;
        if (nodeComponent.nodeType === NodeType.Shape) {
          const isNodeSelected = this.selectedNodes.find(
            (n) => n.id === nodeComponent.id
          );
          if (isNodeSelected) {
            // search for connections that have the endNode outside the selection of nodes/connections
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
                    let thumbIdentifierWithinNode: string = crypto.randomUUID();
                    if (outputNodeThumb) {
                      const thumb: IThumb = {
                        thumbIndex: outputThumbIndex,
                        thumbType: 'StartConnectorRight',
                        connectionType: ThumbConnectionType.start,
                        prefixLabel: outputNodeThumb.prefixLabel,
                        name: `${outputNodeThumb.thumbName}_${outputThumbIndex}`,
                        internalName: outputNodeThumb.thumbName,
                        prefixIcon: outputNodeThumb.prefixIcon,
                        thumbConstraint: outputNodeThumb.thumbConstraint ?? '',
                        color: 'white',
                        label: outputNodeThumb.thumbLabel,
                        thumbIdentifierWithinNode: thumbIdentifierWithinNode,
                        nodeId: nodeComponent.id,
                      };
                      thumbs.push(thumb);

                      if (!this.getNodeTaskFactory) {
                        return;
                      }

                      const factory = this.getNodeTaskFactory('thumb-output');
                      if (factory && thumb.name) {
                        const nodeTask = factory(() => {
                          //
                        }, standardTheme);
                        nodeTask.setTitle?.(thumb.name);
                        const thumbOutput = nodeTask.createVisualNode(
                          this.canvasApp,
                          maxX + 100,
                          minY - 100 + outputThumbIndex * 200,
                          undefined,
                          {
                            valueType: thumb.thumbConstraint,
                            thumbName: thumb.prefixLabel,
                          }
                        );

                        thumbIdentifierWithinNode = thumbOutput.id;

                        if (thumbOutput.thumbConnectors?.[0]) {
                          thumbOutput.thumbConnectors[0].thumbConstraint =
                            thumb.thumbConstraint;
                        }
                        nodesInComposition.push(thumbOutput);

                        const thumbConnection =
                          this.canvasApp.createCubicBezier(
                            thumbOutput.x,
                            thumbOutput.y,
                            thumbOutput.x,
                            thumbOutput.y,
                            thumbOutput.x,
                            thumbOutput.y,
                            thumbOutput.x,
                            thumbOutput.y,
                            false,
                            undefined,
                            undefined,
                            undefined
                          );
                        if (
                          thumbConnection &&
                          thumbConnection.nodeComponent &&
                          thumb.internalName
                        ) {
                          // nodesIdsToIgnore.push(connection.nodeComponent.id);
                          thumbConnection.nodeComponent.isControlled = true;
                          thumbConnection.nodeComponent.nodeInfo = {} as T;
                          thumbConnection.nodeComponent.layer = 1;

                          thumbConnection.nodeComponent.endNode = thumbOutput;
                          thumbConnection.nodeComponent.endNodeThumb =
                            getThumbNodeByName<T>('input', thumbOutput, {
                              start: false,
                              end: true,
                            }) || undefined;

                          thumbConnection.nodeComponent.startNode =
                            connection.startNode;

                          thumbConnection.nodeComponent.startNodeThumb =
                            getThumbNodeByName<T>(
                              thumb.internalName,
                              connection.startNode,
                              {
                                start: true,
                                end: false,
                              }
                            ) || undefined;
                          console.log(
                            'thumb-input endThumb',
                            thumbConnection.nodeComponent.endNodeThumb
                          );

                          thumbOutput.connections?.push(
                            thumbConnection.nodeComponent
                          );
                          connection.startNode.connections?.push(
                            thumbConnection.nodeComponent
                          );
                          nodesInComposition.push(
                            thumbConnection.nodeComponent
                          );
                        }
                      }

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

              // search for connections that have the startNode outside the selection of nodes/connections
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
                    let thumbIdentifierWithinNode: string = crypto.randomUUID();
                    if (inputNodeThumb) {
                      const thumb: IThumb = {
                        thumbIndex: inputThumbIndex,
                        thumbType: 'EndConnectorLeft',
                        connectionType: ThumbConnectionType.end,
                        prefixLabel:
                          inputNodeThumb.prefixLabel ||
                          (connection.endNode.label ?? ''),
                        name: `${inputNodeThumb.thumbName}_${inputThumbIndex}`,
                        internalName: inputNodeThumb.thumbName,
                        prefixIcon: inputNodeThumb.prefixIcon,
                        thumbConstraint: inputNodeThumb.thumbConstraint ?? '',
                        color: 'white',
                        label: inputNodeThumb.thumbLabel,
                        thumbIdentifierWithinNode: thumbIdentifierWithinNode,
                        nodeId: nodeComponent.id,
                      };

                      thumbs.push(thumb);

                      if (!this.getNodeTaskFactory) {
                        return;
                      }

                      const factory = this.getNodeTaskFactory('thumb-input');
                      if (factory && thumb.name) {
                        const nodeTask = factory(() => {
                          //
                        }, standardTheme);
                        nodeTask.setTitle?.(thumb.name);
                        const thumbInput = nodeTask.createVisualNode(
                          this.canvasApp,
                          minX - 100,
                          minY - 100 + inputThumbIndex * 200,
                          undefined,
                          {
                            valueType: thumb.thumbConstraint,
                            thumbName: thumb.prefixLabel,
                          }
                        );
                        thumbIdentifierWithinNode = thumbInput.id;
                        if (thumbInput.thumbConnectors?.[0]) {
                          thumbInput.thumbConnectors[0].thumbConstraint =
                            thumb.thumbConstraint;
                        }
                        nodesInComposition.push(thumbInput);

                        const thumbConnection =
                          this.canvasApp.createCubicBezier(
                            thumbInput.x,
                            thumbInput.y,
                            thumbInput.x,
                            thumbInput.y,
                            thumbInput.x,
                            thumbInput.y,
                            thumbInput.x,
                            thumbInput.y,
                            false,
                            undefined,
                            undefined,
                            undefined
                          );
                        if (
                          thumbConnection &&
                          thumbConnection.nodeComponent &&
                          thumb.internalName
                        ) {
                          // nodesIdsToIgnore.push(connection.nodeComponent.id);
                          thumbConnection.nodeComponent.isControlled = true;
                          thumbConnection.nodeComponent.nodeInfo = {} as T;
                          thumbConnection.nodeComponent.layer = 1;

                          thumbConnection.nodeComponent.startNode = thumbInput;
                          thumbConnection.nodeComponent.startNodeThumb =
                            getThumbNodeByName<T>('output', thumbInput, {
                              start: true,
                              end: false,
                            }) || undefined;

                          thumbConnection.nodeComponent.endNode =
                            connection.endNode;

                          thumbConnection.nodeComponent.endNodeThumb =
                            getThumbNodeByName<T>(
                              thumb.internalName,
                              connection.endNode,
                              {
                                start: false,
                                end: true,
                              }
                            ) || undefined;
                          console.log(
                            'thumb-input endThumb',
                            thumbConnection.nodeComponent.endNodeThumb
                          );

                          thumbInput.connections?.push(
                            thumbConnection.nodeComponent
                          );
                          connection.endNode.connections?.push(
                            thumbConnection.nodeComponent
                          );
                          nodesInComposition.push(
                            thumbConnection.nodeComponent
                          );
                        }
                      }

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

  getSelectedNodes = () => {
    if (
      (this.nodeSelectorElement?.domElement as HTMLElement).classList.contains(
        'hidden'
      )
    ) {
      return false;
    }
    return [...this.selectedNodes, ...this.selectedConnections];
  };
}
