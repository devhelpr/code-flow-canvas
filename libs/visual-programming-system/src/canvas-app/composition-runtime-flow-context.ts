import { MediaLibrary } from '@devhelpr/media-library';
import { LineConnection } from '../components/line-connection';
import { NodeSelector } from '../components/node-selector';
import { NodeTransformer } from '../components/node-transformer';
import { QuadraticBezierConnection } from '../components/quadratic-bezier-connection';
import { CubicBezierConnection } from '../components/qubic-bezier-connection';
import { Rect } from '../components/rect';
import { RectThumb } from '../components/rect-thumb';
import { Compositions } from '../compositions/compositions';
import { ContextConnection } from '../context-components/context-connection';
import { ContextRect } from '../context-components/context-rect';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  AnimatePathFunctions,
  ElementNodeMap,
  ICommandHandler,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
} from '../interfaces';
import { Composition } from '../interfaces/composition';
import { Theme } from '../interfaces/theme';
import { standardTheme } from '../themes/standard';
import { BaseNodeInfo } from '../types/base-node-info';
import { createElementMap } from '../utils';
import { IFlowCanvasBase } from './flow-canvas';
import { FlowCore } from './flow-core';
import {
  GetNodeStatedHandler,
  SetNodeStatedHandler,
} from '../interfaces/node-state-handlers';

export const createCompositionRuntimeFlowContext = <T extends BaseNodeInfo>(
  canvasApp: IFlowCanvasBase<T>,
  _canvasId?: string
): IFlowCanvasBase<T> => {
  return new CompositionRuntimeFlowContext<T>(canvasApp);
};

export class CompositionRuntimeFlowContext<T extends BaseNodeInfo>
  extends FlowCore
  implements IFlowCanvasBase<T>
{
  public theme: Theme;
  public interactionStateMachine: InteractionStateMachine<T>;
  public canvas: IElementNode<T>;
  public elements: ElementNodeMap<T>;
  public rootElement: HTMLElement;
  public nodeTransformer: NodeTransformer<BaseNodeInfo>;
  public compositons: Compositions<T>;
  public nodeSelector: NodeSelector<T>;
  public isContextOnly = true;
  public isComposition = false;

  private animationFunctions: undefined | AnimatePathFunctions<T>;
  private canvasApp: IFlowCanvasBase<T>;
  constructor(canvasApp: IFlowCanvasBase<T>) {
    super();
    this.theme = standardTheme;
    this.canvasApp = canvasApp;
    this.elements = createElementMap<T>();
    // TODO
    this.interactionStateMachine =
      undefined as unknown as InteractionStateMachine<T>;
    this.canvas = undefined as unknown as IElementNode<T>;
    this.rootElement = undefined as unknown as HTMLElement;
    this.nodeTransformer =
      undefined as unknown as NodeTransformer<BaseNodeInfo>;
    this.compositons = this.canvasApp?.compositons ?? new Compositions<T>();
    this.nodeSelector = undefined as unknown as NodeSelector<T>;
    // END TODO
  }

  setOnAddcomposition = (
    _onAddComposition: (
      composition: Composition<T>,
      connections: {
        thumbIdentifierWithinNode: string;
        connection: IConnectionNodeComponent<T>;
      }[]
    ) => void
  ) => {
    //
  };

  addComposition = (_composition: Composition<T>) => {
    //
  };
  getIsCameraFollowingPaused = () => {
    return false;
  };
  setIsCameraFollowingPaused = (_paused: boolean) => {
    //
  };

  getOnCanvasUpdated = () => {
    return () => {
      //
    };
  };
  setOnCanvasUpdated = (_onCanvasUpdatedHandler: () => void) => {
    //
  };
  setOnCanvasClick = (
    _onClickCanvasHandler: (x: number, y: number) => void
  ) => {
    //
  };

  setCanvasAction = (
    _setCanvasActionHandler: (canvasAction: CanvasAction) => void
  ) => {
    //
  };

  resetNodeTransform = () => {
    //
  };

  destoyCanvasApp = () => {
    //
  };

  setOnCameraChanged = (
    _onCameraChangedHandler: (camera: {
      x: number;
      y: number;
      scale: number;
    }) => void
  ) => {
    //
  };

  getCamera = () => {
    return {
      x: 0,
      y: 0,
      scale: 1,
    };
  };

  setCamera = (_x: number, _y: number, _scale: number) => {
    //
  };

  transformCameraSpaceToWorldSpace = (_x: number, _y: number) => {
    return {
      x: 0,
      y: 0,
    };
  };

  setDisableInteraction = (_disable: boolean) => {
    //
  };

  removeEvents = () => {
    //
  };

  centerCamera = () => {
    //
  };

  selectNode = (_nodeComponent: IRectNodeComponent<T>) => {
    //
  };

  deselectNode = () => {
    //
  };

  createRect = (
    _x: number,
    _y: number,
    _width: number,
    _height: number,
    _text?: string,
    thumbs?: IThumb[],
    _markup?: string | INodeComponent<T> | HTMLElement,
    _layoutProperties?: {
      classNames?: string;
      autoSizeToContentIfNodeHasNoThumbs?: boolean;
    },
    _hasStaticWidthHeight?: boolean,
    _disableInteraction?: boolean,
    _disableManualResize?: boolean,
    id?: string,
    nodeInfo?: T,
    containerNode?: IRectNodeComponent<T>,
    _isStaticPosition?: boolean
  ) => {
    const instance = new ContextRect<T>(
      this.elements,
      thumbs,
      id,
      containerNode
    );
    if (!instance || !instance.nodeComponent) {
      throw new Error('rectInstance is undefined');
    }
    instance.nodeComponent.nodeInfo = nodeInfo;
    return instance as unknown as Rect<T>;
  };

  createRectThumb = (
    _x: number,
    _y: number,
    _width: number,
    _height: number,
    _text?: string,
    thumbs?: IThumb[],
    _markup?: string | INodeComponent<T>,
    _layoutProperties?: {
      classNames?: string;
      autoSizeToContentIfNodeHasNoThumbs?: boolean;
    },
    _hasStaticWidthHeight?: boolean,
    _disableInteraction?: boolean,
    _disableManualResize?: boolean,
    id?: string,
    nodeInfo?: T,
    containerNode?: IRectNodeComponent<T>,
    _isStaticPosition?: boolean,
    _isCircle?: boolean,
    _createStraightLineConnection?: boolean
  ) => {
    const instance = new ContextRect<T>(
      this.elements,
      thumbs,
      id,
      containerNode
    );
    if (!instance || !instance.nodeComponent) {
      throw new Error('rectThumbInstance is undefined');
    }
    instance.nodeComponent.nodeInfo = nodeInfo;
    return instance as unknown as RectThumb<T>;
  };

  createCubicBezier = (
    _startX?: number,
    _startY?: number,
    _endX?: number,
    _endY?: number,
    _controlPointX1?: number,
    _controlPointY1?: number,
    _controlPointX2?: number,
    _controlPointY2?: number,
    _isControlled?: boolean,
    _isDashed = false,
    _id?: string,
    _containerNode?: IRectNodeComponent<T>
  ) => {
    return new ContextConnection<T>(
      this.elements,
      _id,
      _containerNode
    ) as unknown as CubicBezierConnection<T>;
  };

  createQuadraticBezier = (
    _startX?: number,
    _containerNodestartY?: number,
    _endX?: number,
    _endY?: number,
    _controlPointX?: number,
    _controlPointY?: number,
    _isControlled?: boolean,
    _isDashed = false,
    _id?: string,
    _containerNode?: IRectNodeComponent<T>
  ) => {
    return new ContextConnection<T>(
      this.elements,
      _id,
      _containerNode
    ) as unknown as QuadraticBezierConnection<T>;
  };

  createLine = (
    _startX?: number,
    _startY?: number,
    _endX?: number,
    _endY?: number,
    _isControlled?: boolean,
    _isDashed = false,
    _id?: string,
    _containerNode?: IRectNodeComponent<T>
  ) => {
    return new ContextConnection<T>(
      this.elements,
      _id,
      _containerNode
    ) as unknown as LineConnection<T>;
  };
  editThumbNode = (_thumb: IThumb, _nodeComponent: IRectNodeComponent<T>) => {
    //
  };

  deleteThumbNode = (_thumb: IThumb, _nodeComponent: IRectNodeComponent<T>) => {
    return undefined;
  };

  addThumbToNode = (_thumb: IThumb, _node: INodeComponent<T>) => {
    return undefined;
  };

  deleteElement = (id: string) => {
    this.elements?.delete(id);
  };

  deleteElementFromNode = (
    element: INodeComponent<T>,
    child: INodeComponent<T>,
    _noCanvasUpdated = false
  ) => {
    if (element && child) {
      if (element.elements) {
        element.elements.delete(child.id);
      }
      element.domElement.removeChild(child.domElement);
    }
  };

  setOnWheelEvent = (
    _onWheelEventHandler: (x: number, y: number, scale: number) => void
  ) => {
    //;
  };

  setonDragCanvasEvent = (
    _onDragCanvasEventHandler: (x: number, y: number) => void
  ) => {
    //
  };

  setMediaLibrary = (_mediaLibrary: MediaLibrary) => {
    //
  };

  getMediaLibrary = () => {
    return undefined;
  };

  setAnimationFunctions = (newAnimationFunctions: AnimatePathFunctions<T>) => {
    this.animationFunctions = newAnimationFunctions;
  };

  getAnimationFunctions = () => {
    return this.animationFunctions;
  };

  getSelectedNodes = (): false | INodeComponent<T>[] => {
    return false;
  };

  resetNodeSelector = () => {
    //
  };

  setApiUrlRoot = (_apiUrlRoot: string) => {
    //
  };

  getApiUrlRoot = () => {
    return '';
  };

  setOnDroppedOnNode = (
    _onDroppedOnNode?: (
      droppedNode: INodeComponent<T>,
      dropTarget: INodeComponent<T>
    ) => void
  ) => {
    //
  };

  setOnDraggingOverNode = (
    _onDraggingOverNode?: (
      draggingNode: INodeComponent<T>,
      dragTarget: INodeComponent<T>,
      isCancelling: boolean
    ) => void
  ) => {
    //
  };

  override setOnNodeMessage = (
    event: (keyName: string, value: any) => void
  ) => {
    this.canvasApp.setOnNodeMessage(event);
  };

  override sendMessageFromNode = (key: string, value: any) => {
    this.canvasApp.sendMessageFromNode(key, value);
  };

  override sendMessageToNode = (key: string, value: any) => {
    this.canvasApp.sendMessageToNode(key, value);
  };

  override registerNodeKeyListener = (
    key: string,
    listener: (key: string, value: any) => void
  ) => {
    this.canvasApp.registerNodeKeyListener(key, listener);
  };
  override removeNodeKeyListener = (
    key: string,
    listener: (key: string, value: any) => void
  ) => {
    this.canvasApp.removeNodeKeyListener(key, listener);
  };

  override registerVariable = (
    variableName: string,
    variable: {
      id: string;
      getData: () => any;
      setData: (data: any) => boolean;
      initializeDataStructure?: (structureInfo: any) => void;
      removeScope: (scopeId: string) => void;
      resetVariable: () => boolean;
    }
  ) => {
    this.canvasApp.registerVariable(variableName, variable);
  };

  override registerTempVariable = (
    variableName: string,
    data: any,
    scopeId: string
  ) => {
    this.canvasApp.registerTempVariable(variableName, data, scopeId);
  };

  override unregisterVariable = (variableName: string, id: string) => {
    this.canvasApp.unregisterVariable(variableName, id);
  };

  override getVariable = (
    variableName: string,
    parameter?: any,
    scopeId?: string
  ) => {
    return this.canvasApp.getVariable(variableName, parameter, scopeId);
  };

  override getVariableInfo = (variableName: string, scopeId?: string) => {
    return this.canvasApp.getVariableInfo(variableName, scopeId);
  };

  override setVariable = (
    variableName: string,
    data: any,
    scopeId?: string,
    runCounter?: any,
    isInitializing?: boolean
  ) => {
    return this.canvasApp.setVariable(
      variableName,
      data,
      scopeId,
      runCounter,
      isInitializing
    );
  };

  override getVariables = (scopeId?: string) => {
    return this.canvasApp.getVariables(scopeId);
  };

  override deleteVariables = () => {
    this.canvasApp.deleteVariables();
  };

  override getVariableNames = (scopeId?: string) => {
    return this.canvasApp.getVariableNames(scopeId);
  };

  override resetVariable = (
    variableName: string,
    scopeId?: string,
    runCounter?: any
  ) => {
    return this.canvasApp.resetVariable(variableName, scopeId, runCounter);
  };

  override initializeVariableDataStructure = (
    variableName: string,
    structureInfo: any,
    scopeId?: string
  ) => {
    this.canvasApp.initializeVariableDataStructure(
      variableName,
      structureInfo,
      scopeId
    );
  };

  override observeVariable = (
    nodeId: string,
    variableName: string,
    updated: (data: any, runCounter?: any) => Promise<void>
  ) => {
    this.canvasApp.observeVariable(nodeId, variableName, updated);
  };

  override removeObserveVariable = (nodeId: string, variableName: string) => {
    this.canvasApp.removeObserveVariable(nodeId, variableName);
  };
  override removeScope = (scopeId: string) => {
    this.canvasApp.removeScope(scopeId);
  };

  override registerCommandHandler = (
    name: string,
    handler: ICommandHandler
  ) => {
    this.canvasApp.registerCommandHandler(name, handler);
  };

  override unregisterCommandHandler = (name: string) => {
    this.canvasApp.unregisterCommandHandler(name);
  };

  override registeGetNodeStateHandler = (
    name: string,
    handler: GetNodeStatedHandler
  ) => {
    this.canvasApp.registeGetNodeStateHandler(name, handler);
  };

  override unRegisteGetNodeStateHandler = (name: string) => {
    this.canvasApp.unRegisteGetNodeStateHandler(name);
  };

  override registeSetNodeStateHandler = (
    name: string,
    handler: SetNodeStatedHandler
  ) => {
    this.canvasApp.registeSetNodeStateHandler(name, handler);
  };

  override unRegisteSetNodeStateHandler = (name: string) => {
    this.canvasApp.unRegisteSetNodeStateHandler(name);
  };

  override getNodeStates = () => {
    return this.canvasApp.getNodeStates();
  };

  override getNodeState = (id: string) => {
    return this.canvasApp.getNodeState(id);
  };

  override setNodeStates = (nodeStates: Map<string, any>) => {
    this.canvasApp.setNodeStates(nodeStates);
  };

  override executeCommandOnCommandHandler = (
    name: string,
    commandName: string,
    data: any
  ) => {
    this.canvasApp.executeCommandOnCommandHandler(name, commandName, data);
  };

  override setTempData = (key: string, value: any) => {
    this.canvasApp.setTempData(key, value);
  };
  override getTempData = (key: string) => {
    return this.canvasApp.getTempData(key);
  };

  setOnDebugInfoHandler = (
    _event: (debugInfo: Record<string, string | number | boolean>) => void
  ) => {
    //
  };

  sendDebugInfo = (_debugInfo: Record<string, string | number | boolean>) => {
    //
  };

  getDebugInfoHandler = () => {
    return undefined;
  };
}
