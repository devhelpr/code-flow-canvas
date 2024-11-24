import { MediaFileData, MediaLibrary } from '@devhelpr/media-library';
import { LineConnection } from '../components/line-connection';
import { NodeTransformer } from '../components/node-transformer';
import { QuadraticBezierConnection } from '../components/quadratic-bezier-connection';
import { CubicBezierConnection } from '../components/qubic-bezier-connection';
import { Rect } from '../components/rect';
import { RectThumb } from '../components/rect-thumb';
import { Compositions } from '../compositions/compositions';
import { CanvasAction } from '../enums/canvas-action';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  AnimatePathFunctions,
  ElementNodeMap,
  FlowChangeType,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
} from '../interfaces';
import { Composition } from '../interfaces/composition';
import { Theme } from '../interfaces/theme';
import { BaseNodeInfo } from '../types/base-node-info';

export interface IBaseFlow<T extends BaseNodeInfo> {
  elements: ElementNodeMap<T>;
  canvas: IElementNode<T>;
  rootElement: HTMLElement;
  interactionStateMachine: InteractionStateMachine<T>;
  nodeTransformer: NodeTransformer<BaseNodeInfo>;
  compositons: Compositions<T>;
  isContextOnly: boolean;
  isComposition: boolean;
  theme: Theme;
  setOnAddcomposition: (
    _onAddComposition: (
      composition: Composition<T>,
      connections: {
        thumbIdentifierWithinNode: string;
        connection: IConnectionNodeComponent<T>;
      }[]
    ) => void
  ) => void;
  addComposition: (composition: Composition<T>) => void;
  getIsCameraFollowingPaused: () => boolean;
  setIsCameraFollowingPaused: (paused: boolean) => void;
  getOnCanvasUpdated: () =>
    | ((
        shouldClearExecutionHistory?: boolean,
        _isStoreOnly?: boolean,
        _flowChangeType?: FlowChangeType
      ) => void)
    | undefined;
  setOnCanvasUpdated: (onCanvasUpdatedHandler: () => void) => void;
  setOnCanvasClick: (
    onClickCanvasHandler: (x: number, y: number) => void
  ) => void;
  setCanvasAction: (
    setCanvasActionHandler: (canvasAction: CanvasAction, payload?: any) => void
  ) => void;
  resetNodeTransform: () => void;

  destoyCanvasApp: () => void;
  setOnCameraChanged: (
    onCameraChangedHandler: (camera: {
      x: number;
      y: number;
      scale: number;
    }) => void
  ) => void;

  getCamera: () => {
    x: number;
    y: number;
    scale: number;
  };

  setCamera: (x: number, y: number, scale: number) => void;
  transformCameraSpaceToWorldSpace: (
    x: number,
    y: number
  ) => {
    x: number;
    y: number;
  };
  setDisableInteraction: (disable: boolean) => void;
  removeEvents: () => void;
  centerCamera: () => void;
  selectNode: (nodeComponent: IRectNodeComponent<T>) => void;
  deselectNode: () => void;

  createRect: (
    x: number,
    y: number,
    width: number,
    height: number,
    text?: string,
    thumbs?: IThumb[],
    markup?: string | INodeComponent<T> | HTMLElement,
    layoutProperties?: {
      classNames?: string;
      autoSizeToContentIfNodeHasNoThumbs?: boolean;
    },
    hasStaticWidthHeight?: boolean,
    disableInteraction?: boolean,
    disableManualResize?: boolean,
    id?: string,
    nodeInfo?: T,
    containerNode?: IRectNodeComponent<T>,
    isStaticPosition?: boolean,
    parentNodeClassNames?: string
  ) => Rect<T>;

  createRectThumb: (
    x: number,
    y: number,
    width: number,
    height: number,
    text?: string,
    thumbs?: IThumb[],
    markup?: string | INodeComponent<T> | undefined,
    layoutProperties?: {
      classNames?: string;
      autoSizeToContentIfNodeHasNoThumbs?: boolean;
    },
    hasStaticWidthHeight?: boolean,
    disableInteraction?: boolean,
    disableManualResize?: boolean,
    id?: string,
    nodeInfo?: T | undefined,
    containerNode?: IRectNodeComponent<T> | undefined,
    isStaticPosition?: boolean,
    isCircle?: boolean,
    createStraightLineConnection?: boolean
  ) => RectThumb<T>;

  createCubicBezier: (
    startX?: number,
    startY?: number,
    endX?: number,
    endY?: number,
    controlPointX1?: number,
    controlPointY1?: number,
    controlPointX2?: number,
    controlPointY2?: number,
    isControlled?: boolean,
    isDashed?: boolean,
    id?: string,
    containerNode?: IRectNodeComponent<T> | undefined
  ) => CubicBezierConnection<T>;

  createQuadraticBezier: (
    startX?: number | undefined,
    startY?: number | undefined,
    endX?: number | undefined,
    endY?: number | undefined,
    controlPointX?: number | undefined,
    controlPointY?: number | undefined,
    isControlled?: boolean | undefined,
    isDashed?: boolean,
    id?: string | undefined,
    containerNode?: IRectNodeComponent<T> | undefined
  ) => QuadraticBezierConnection<T>;

  createLine: (
    startX?: number | undefined,
    startY?: number | undefined,
    endX?: number | undefined,
    endY?: number | undefined,
    isControlled?: boolean | undefined,
    isDashed?: boolean,
    id?: string | undefined,
    containerNode?: IRectNodeComponent<T> | undefined
  ) => LineConnection<T>;

  editThumbNode: (thumb: IThumb, nodeComponent: IRectNodeComponent<T>) => void;
  deleteThumbNode: (
    thumb: IThumb,
    nodeComponent: IRectNodeComponent<T>
  ) => undefined;
  addThumbToNode: (
    thumb: IThumb,
    nodeComponent: IRectNodeComponent<T>
  ) => undefined;
  deleteElement: (id: string) => void;
  deleteElementFromNode: (
    element: INodeComponent<T>,
    child: INodeComponent<T>,
    noCanvasUpdated?: boolean
  ) => void;
  setOnWheelEvent: (
    onWheelEventHandler: (x: number, y: number, scale: number) => void
  ) => void;
  setonDragCanvasEvent: (
    onDragCanvasEventHandler: (x: number, y: number) => void
  ) => void;
  setMediaLibrary: (mediaLibrary: MediaLibrary) => void;
  getMediaLibrary: () =>
    | {
        storeFile: (codeFileName: string, file: MediaFileData) => void;
        getFile: (codeFileName: string) => false | MediaFileData;
        deleteFile: (codeFileName: string) => boolean;
      }
    | undefined;
  setAnimationFunctions: (
    newAnimationFunctions: AnimatePathFunctions<T>
  ) => void;
  getAnimationFunctions: () => AnimatePathFunctions<T> | undefined;
  getSelectedNodes: () => false | INodeComponent<T>[];
  resetNodeSelector: () => void;
  setApiUrlRoot: (apiUrlRoot: string) => void;
  getApiUrlRoot: () => string;

  setOnDroppedOnNode: (
    onDroppedOnNode?: (
      droppedNode: INodeComponent<T>,
      dropTarget: INodeComponent<T>
    ) => void
  ) => void;
}
