import { LineConnection } from '../components/line-connection';
import { QuadraticBezierConnection } from '../components/quadratic-bezier-connection';
import { CubicBezierConnection } from '../components/qubic-bezier-connection';
import { Rect } from '../components/rect';
import { RectThumb } from '../components/rect-thumb';
import { InteractionStateMachine } from '../interaction-state-machine';
import {
  ICommandHandler,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
} from '../interfaces';
import { createElementMap } from '../utils';
import {
  SetNodeStatedHandler,
  GetNodeStatedHandler,
} from '../interfaces/node-state-handlers';
import { Composition } from '../interfaces/composition';
import { CanvasAppInstance } from './CanvasAppInstance';
import { Compositions } from '../compositions/compositions';
import { NodeTransformer } from '../components/node-transformer';
import { ContextRect } from '../context-components/context-rect';
import { ContextConnection } from '../context-components/context-connection';
import { standardTheme } from '../themes/standard';

export const createContextInstanceApp = <T>(
  _canvasId?: string
): CanvasAppInstance<T> => {
  const compositons = new Compositions<T>();
  const variables: Record<
    string,
    {
      id: string;
      getData: (parameter?: any, scopeId?: string) => any;
      setData: (data: any, scopeId?: string) => void;
      initializeDataStructure?: (structureInfo: any, scopeId?: string) => void;
      removeScope: (scopeId: string) => void;
    }
  > = {};
  const variableObservers: Map<
    string,
    Map<string, (data: any) => void>
  > = new Map();

  const commandHandlers: Record<string, ICommandHandler> = {};
  const nodeSetStateHandlers: Record<string, SetNodeStatedHandler> = {};
  const nodeGetStateHandlers: Record<string, GetNodeStatedHandler> = {};

  const tempVariables: Record<string, any> = {};

  const elements = createElementMap<T>();
  const canvas = undefined as unknown as IElementNode<T>;
  const rootElement = undefined as unknown as HTMLElement;
  const interactionStateMachine =
    undefined as unknown as InteractionStateMachine<T>;
  return {
    elements,
    canvas,
    rootElement,
    interactionStateMachine,
    nodeTransformer: undefined as unknown as NodeTransformer<T>,
    compositons,
    isContextOnly: true,
    isComposition: false,
    theme: standardTheme,
    setOnAddcomposition: (
      _onAddComposition: (
        composition: Composition<T>,
        connections: {
          thumbIdentifierWithinNode: string;
          connection: IConnectionNodeComponent<T>;
        }[]
      ) => void
    ) => {
      //
    },
    getIsCameraFollowingPaused: () => {
      return false;
    },
    setIsCameraFollowingPaused: (_paused: boolean) => {
      //
    },
    getOnCanvasUpdated: () => {
      return () => {
        //
      };
    },
    setOnCanvasUpdated: (_onCanvasUpdatedHandler: () => void) => {
      //
    },
    setOnCanvasClick: (
      _onClickCanvasHandler: (x: number, y: number) => void
    ) => {
      //
    },
    resetNodeTransform: () => {
      //
    },
    setOnCameraChanged: (
      _onCameraChangedHandler: (camera: {
        x: number;
        y: number;
        scale: number;
      }) => void
    ) => {
      //
    },
    getCamera: () => {
      return {
        x: 0,
        y: 0,
        scale: 1,
      };
    },
    setCamera: (_x: number, _y: number, _scale: number) => {
      //
    },
    transformCameraSpaceToWorldSpace: (_x: number, _y: number) => {
      return {
        x: 0,
        y: 0,
      };
    },
    setDisableInteraction: (_disable: boolean) => {
      //
    },
    removeEvents: () => {
      //
    },
    centerCamera: () => {
      //
    },
    selectNode: (_nodeComponent: IRectNodeComponent<T>) => {
      //
    },
    deselectNode: () => {
      //
    },
    createRect: (
      _x: number,
      _y: number,
      _width: number,
      _height: number,
      _text?: string,
      thumbs?: IThumb[],
      _markup?: string | INodeComponent<T>,
      _layoutProperties?: {
        classNames?: string;
      },
      _hasStaticWidthHeight?: boolean,
      _disableInteraction?: boolean,
      _disableManualResize?: boolean,
      id?: string,
      nodeInfo?: T,
      containerNode?: IRectNodeComponent<T>,
      _isStaticPosition?: boolean
    ) => {
      const instance = new ContextRect<T>(elements, thumbs, id, containerNode);
      if (!instance || !instance.nodeComponent) {
        throw new Error('rectInstance is undefined');
      }
      instance.nodeComponent.nodeInfo = nodeInfo;
      return instance as unknown as Rect<T>;
    },
    createRectThumb: (
      _x: number,
      _y: number,
      _width: number,
      _height: number,
      _text?: string,
      _thumbs?: IThumb[],
      _markup?: string | INodeComponent<T>,
      _layoutProperties?: {
        classNames?: string;
      },
      _hasStaticWidthHeight?: boolean,
      _disableInteraction?: boolean,
      _disableManualResize?: boolean,
      _id?: string,
      _nodeInfo?: T,
      _containerNode?: IRectNodeComponent<T>,
      _isStaticPosition?: boolean,
      _isCircle?: boolean,
      _createStraightLineConnection?: boolean
    ) => {
      return undefined as unknown as RectThumb<T>;
    },
    createCubicBezier: (
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
        elements,
        _id,
        _containerNode
      ) as unknown as CubicBezierConnection<T>;
    },
    createQuadraticBezier: (
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
        elements,
        _id,
        _containerNode
      ) as unknown as QuadraticBezierConnection<T>;
    },
    createLine: (
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
        elements,
        _id,
        _containerNode
      ) as unknown as LineConnection<T>;
    },
    deleteElementFromNode: (
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
    },
    setOnWheelEvent: (
      _onWheelEventHandler: (x: number, y: number, scale: number) => void
    ) => {
      //;
    },
    setonDragCanvasEvent: (
      _onDragCanvasEventHandler: (x: number, y: number) => void
    ) => {
      //
    },
    registerVariable: (
      variableName: string,
      variable: {
        id: string;
        getData: () => any;
        setData: (data: any) => void;
        initializeDataStructure?: (structureInfo: any) => void;
        removeScope: (scopeId: string) => void;
      }
    ) => {
      if (variableName && variable.id) {
        variables[variableName] = variable;
      }
    },
    registerTempVariable: (
      variableName: string,
      data: any,
      scopeId: string
    ) => {
      if (!tempVariables[scopeId]) {
        tempVariables[scopeId] = {};
      }
      tempVariables[scopeId][variableName] = data;
    },
    unregisterVariable: (variableName: string, id: string) => {
      if (
        id &&
        variableName &&
        variables[variableName] &&
        variables[variableName].id === id
      ) {
        delete variables[variableName];
      }
    },
    getVariable: (variableName: string, parameter?: any, scopeId?: string) => {
      if (
        variableName &&
        scopeId &&
        tempVariables[scopeId] &&
        tempVariables[scopeId][variableName]
      ) {
        return tempVariables[scopeId][variableName];
      }
      if (variableName && variables[variableName]) {
        return variables[variableName].getData(parameter, scopeId);
      }
      return false;
    },
    getVariableInfo: (variableName: string, scopeId?: string) => {
      if (scopeId && tempVariables[scopeId][variableName]) {
        return {
          [variableName]: {
            id: variableName,
          },
          data: tempVariables[scopeId][variableName],
        };
      }

      if (variableName && variables[variableName]) {
        return {
          ...variables[variableName],
          data: variables[variableName].getData(undefined, scopeId),
        };
      }
      return false;
    },
    setVariable: (variableName: string, data: any, scopeId?: string) => {
      if (scopeId && tempVariables[scopeId][variableName]) {
        tempVariables[scopeId][variableName] = data;
      } else if (variableName && variables[variableName]) {
        variables[variableName].setData(data, scopeId);

        const map = variableObservers.get(`${variableName}`);
        if (map) {
          map.forEach((observer) => {
            observer(data);
          });
        }
      }
    },
    getVariables: (scopeId?: string) => {
      const result: Record<string, any> = {};
      Object.entries(variables).forEach(([key, value]) => {
        if (key) {
          result[key] = value.getData(undefined, scopeId);
        }
      });
      return result;
    },
    getVariableNames: (scopeId?: string) => {
      if (scopeId) {
        return [
          ...Object.keys(variables),
          ...Object.keys(tempVariables[scopeId] ?? {}),
        ];
      }
      return Object.keys(variables);
    },
    initializeVariableDataStructure: (
      variableName: string,
      structureInfo: any,
      scopeId?: string
    ) => {
      if (variableName && variables[variableName]) {
        const variable = variables[variableName];
        if (variable.initializeDataStructure) {
          variable.initializeDataStructure(structureInfo, scopeId);
        }
      }
    },
    observeVariable: (
      nodeId: string,
      variableName: string,
      updated: (data: any) => void
    ) => {
      let map = variableObservers.get(`${variableName}`);
      if (!map) {
        map = new Map();
        variableObservers.set(`${variableName}`, map);
      }
      map.set(`${nodeId}`, updated);
    },
    removeObserveVariable: (nodeId: string, variableName: string) => {
      const map = variableObservers.get(`${variableName}`);
      if (map) {
        map.delete(`${nodeId}`);
      }
    },
    removeScope: (scopeId: string) => {
      if (scopeId) {
        const keys = Object.keys(variables);
        keys.forEach((key) => {
          const variable = variables[key];
          variable.removeScope(scopeId);
        });

        if (tempVariables[scopeId]) {
          delete tempVariables[scopeId];
        }
      }
    },
    registerCommandHandler: (name: string, handler: ICommandHandler) => {
      commandHandlers[name] = handler;
    },
    unregisterCommandHandler: (name: string) => {
      delete commandHandlers[name];
    },
    registeGetNodeStateHandler: (
      name: string,
      handler: GetNodeStatedHandler
    ) => {
      nodeGetStateHandlers[name] = handler;
    },
    unRegisteGetNodeStateHandler: (name: string) => {
      delete nodeGetStateHandlers[name];
    },
    registeSetNodeStateHandler: (
      name: string,
      handler: SetNodeStatedHandler
    ) => {
      nodeSetStateHandlers[name] = handler;
    },
    unRegisteSetNodeStateHandler: (name: string) => {
      delete nodeSetStateHandlers[name];
    },
    getNodeStates: () => {
      const result: Map<string, any> = new Map();
      Object.entries(nodeGetStateHandlers).forEach(([key, getHandler]) => {
        if (key) {
          const nodeState = getHandler();
          result.set(nodeState.id, nodeState.data);
        }
      });
      return result;
    },
    setNodeStates: (nodeStates: Map<string, any>) => {
      nodeStates.forEach((data, id) => {
        const setHandler = nodeSetStateHandlers[id];
        if (setHandler) {
          setHandler(id, data);
        }
      });
    },

    executeCommandOnCommandHandler: (
      name: string,
      commandName: string,
      data: any
    ) => {
      if (commandHandlers[name]) {
        commandHandlers[name].execute(commandName, data);
      }
    },
  };
};
