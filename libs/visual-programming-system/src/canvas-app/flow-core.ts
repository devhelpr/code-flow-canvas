import { ICommandHandler } from '../interfaces';
import {
  SetNodeStatedHandler,
  GetNodeStatedHandler,
} from '../interfaces/node-state-handlers';

export interface IFlowCore {
  setOnNodeMessage: (event: (keyName: string, value: any) => void) => void;

  sendMessageFromNode: (key: string, value: any) => void;

  sendMessageToNode: (key: string, value: any) => void;

  registerNodeKeyListener: (
    key: string,
    listener: (key: string, value: any) => void
  ) => void;
  removeNodeKeyListener: (
    key: string,
    listener: (key: string, value: any) => void
  ) => void;

  registerVariable: (
    variableName: string,
    variable: {
      id: string;
      getData: () => any;
      setData: (data: any) => boolean;
      initializeDataStructure?: (structureInfo: any) => void;
      removeScope: (scopeId: string) => void;
    }
  ) => void;

  registerTempVariable: (
    variableName: string,
    data: any,
    scopeId: string
  ) => void;

  unregisterVariable: (variableName: string, id: string) => void;

  getVariable: (
    variableName: string,
    parameter?: any,
    scopeId?: string
  ) => string | false;

  getVariableInfo: (
    variableName: string,
    scopeId?: string
  ) =>
    | false
    | {
        [x: string]: any;
        data: any;
      }
    | {
        data: any;
        id: string;
        getData: (parameter?: any, scopeId?: string) => any;
        setData: (data: any, scopeId?: string) => void;
        initializeDataStructure?:
          | ((structureInfo: any, scopeId?: string) => void)
          | undefined;
        removeScope: (scopeId: string) => void;
      };

  setVariable: (
    variableName: string,
    data: any,
    scopeId?: string,
    runCounter?: any,
    isInitializing?: boolean
  ) => Promise<boolean>;

  getVariables: (scopeId?: string) => Record<string, any>;

  deleteVariables: () => void;

  getVariableNames: (scopeId?: string) => string[];

  initializeVariableDataStructure: (
    variableName: string,
    structureInfo: any,
    scopeId?: string
  ) => void;

  observeVariable: (
    nodeId: string,
    variableName: string,
    updated: (data: any, runCounter?: any) => Promise<void>
  ) => void;

  removeObserveVariable: (nodeId: string, variableName: string) => void;
  removeScope: (scopeId: string) => void;

  registerCommandHandler: (name: string, handler: ICommandHandler) => void;

  unregisterCommandHandler: (name: string) => void;

  registeGetNodeStateHandler: (
    name: string,
    handler: GetNodeStatedHandler
  ) => void;

  unRegisteGetNodeStateHandler: (name: string) => void;

  registeSetNodeStateHandler: (
    name: string,
    handler: SetNodeStatedHandler
  ) => void;

  unRegisteSetNodeStateHandler: (name: string) => void;

  getNodeStates: () => Map<string, any>;

  getNodeState: (id: string) => any;

  setNodeStates: (nodeStates: Map<string, any>) => void;

  executeCommandOnCommandHandler: (
    name: string,
    commandName: string,
    data: any
  ) => void;

  setTempData: (key: string, value: any) => void;
  getTempData: (key: string) => any;
}

export class FlowCore implements IFlowCore {
  protected variables: Record<
    string,
    {
      id: string;
      getData: (parameter?: any, scopeId?: string) => any;
      setData: (data: any, scopeId?: string) => boolean;
      initializeDataStructure?: (structureInfo: any, scopeId?: string) => void;
      removeScope: (scopeId: string) => void;
    }
  > = {};
  protected variableObservers: Map<
    string,
    Map<string, (data: any, runCounter?: any) => Promise<void>>
  > = new Map();
  protected commandHandlers: Record<string, ICommandHandler> = {};
  protected nodeSetStateHandlers: Record<string, SetNodeStatedHandler> = {};
  protected nodeGetStateHandlers: Record<string, GetNodeStatedHandler> = {};
  protected tempVariables: Record<string, any> = {};
  protected tempData: Record<string, any> = {};
  protected onNodeMessage: ((keyName: string, value: any) => void) | undefined =
    undefined;

  protected listeners: {
    key: string;
    listener: (key: string, value: any) => void;
  }[] = [];

  setOnNodeMessage = (event: (keyName: string, value: any) => void) => {
    this.onNodeMessage = event;
  };

  sendMessageFromNode = (key: string, value: any) => {
    if (this.onNodeMessage) {
      this.onNodeMessage(key, value);
    }
  };

  sendMessageToNode = (key: string, value: any) => {
    this.listeners.forEach((l) => {
      if (l.key === key) {
        l.listener(key, value);
      }
    });
  };

  registerNodeKeyListener = (
    key: string,
    listener: (key: string, value: any) => void
  ) => {
    this.listeners.push({
      key,
      listener,
    });
  };
  removeNodeKeyListener = (
    key: string,
    listener: (key: string, value: any) => void
  ) => {
    this.listeners = this.listeners.filter(
      (l) => l.key !== key && l.listener !== listener
    );
  };

  registerVariable = (
    variableName: string,
    variable: {
      id: string;
      getData: () => any;
      setData: (data: any) => boolean;
      initializeDataStructure?: (structureInfo: any) => void;
      removeScope: (scopeId: string) => void;
    }
  ) => {
    if (variableName && variable.id) {
      this.variables[variableName] = variable;
    }
  };

  registerTempVariable = (variableName: string, data: any, scopeId: string) => {
    if (!this.tempVariables[scopeId]) {
      this.tempVariables[scopeId] = {};
    }
    this.tempVariables[scopeId][variableName] = data;
  };

  unregisterVariable = (variableName: string, id: string) => {
    if (
      id &&
      variableName &&
      this.variables[variableName] &&
      this.variables[variableName].id === id
    ) {
      delete this.variables[variableName];
    }
  };

  getVariable = (variableName: string, parameter?: any, scopeId?: string) => {
    if (
      variableName &&
      scopeId &&
      this.tempVariables[scopeId] &&
      this.tempVariables[scopeId][variableName]
    ) {
      return this.tempVariables[scopeId][variableName];
    }
    if (variableName && this.variables[variableName]) {
      return this.variables[variableName].getData(parameter, scopeId);
    }
    return false;
  };

  getVariableInfo = (variableName: string, scopeId?: string) => {
    if (scopeId && this.tempVariables[scopeId][variableName]) {
      return {
        [variableName]: {
          id: variableName,
        },
        data: this.tempVariables[scopeId][variableName],
      };
    }

    if (variableName && this.variables[variableName]) {
      return {
        ...this.variables[variableName],
        data: this.variables[variableName].getData(undefined, scopeId),
      };
    }
    return false;
  };

  setVariable = (
    variableName: string,
    data: any,
    scopeId?: string,
    runCounter?: any,
    isInitializing?: boolean
  ) => {
    return new Promise<boolean>((resolve) => {
      if (scopeId && this.tempVariables[scopeId][variableName]) {
        this.tempVariables[scopeId][variableName] = data;
      } else if (variableName && this.variables[variableName]) {
        const result = this.variables[variableName].setData(data, scopeId);
        if (!result) {
          resolve(false);
          return;
        }
        if (isInitializing) {
          resolve(true);
          return;
        }
        const dataToObserver = this.variables[variableName].getData(
          undefined,
          scopeId
        );
        const map = this.variableObservers.get(`${variableName}`);
        if (map) {
          const observePromises: Promise<void>[] = [];
          map.forEach((observer) => {
            observePromises.push(
              observer(dataToObserver, runCounter) as unknown as Promise<void>
            );
          });
          Promise.all(observePromises).then(() => {
            resolve(true);
          });

          return;
        }
      }
      resolve(true);
    });
  };

  getVariables = (scopeId?: string) => {
    const result: Record<string, any> = {};
    Object.entries(this.variables).forEach(([key, value]) => {
      if (key) {
        result[key] = value.getData(undefined, scopeId);
      }
    });
    return result;
  };

  deleteVariables = () => {
    this.variables = {};
    this.variableObservers.clear();
  };

  getVariableNames = (scopeId?: string) => {
    if (scopeId) {
      return [
        ...Object.keys(this.variables),
        ...Object.keys(this.tempVariables[scopeId] ?? {}),
      ];
    }
    return Object.keys(this.variables);
  };
  initializeVariableDataStructure = (
    variableName: string,
    structureInfo: any,
    scopeId?: string
  ) => {
    if (variableName && this.variables[variableName]) {
      const variable = this.variables[variableName];
      if (variable.initializeDataStructure) {
        variable.initializeDataStructure(structureInfo, scopeId);
      }
    }
  };

  observeVariable = (
    nodeId: string,
    variableName: string,
    updated: (data: any, runCounter?: any) => Promise<void>
  ) => {
    let map = this.variableObservers.get(`${variableName}`);
    if (!map) {
      map = new Map();
      this.variableObservers.set(`${variableName}`, map);
    }
    map.set(`${nodeId}`, updated);
  };

  removeObserveVariable = (nodeId: string, variableName: string) => {
    const map = this.variableObservers.get(`${variableName}`);
    if (map) {
      map.delete(`${nodeId}`);
    }
  };
  removeScope = (scopeId: string) => {
    if (scopeId) {
      const keys = Object.keys(this.variables);
      keys.forEach((key) => {
        const variable = this.variables[key];
        variable.removeScope(scopeId);
      });

      if (this.tempVariables[scopeId]) {
        delete this.tempVariables[scopeId];
      }
    }
  };

  registerCommandHandler = (name: string, handler: ICommandHandler) => {
    this.commandHandlers[name] = handler;
  };

  unregisterCommandHandler = (name: string) => {
    delete this.commandHandlers[name];
  };

  registeGetNodeStateHandler = (
    name: string,
    handler: GetNodeStatedHandler
  ) => {
    this.nodeGetStateHandlers[name] = handler;
  };

  unRegisteGetNodeStateHandler = (name: string) => {
    delete this.nodeGetStateHandlers[name];
  };

  registeSetNodeStateHandler = (
    name: string,
    handler: SetNodeStatedHandler
  ) => {
    this.nodeSetStateHandlers[name] = handler;
  };

  unRegisteSetNodeStateHandler = (name: string) => {
    delete this.nodeSetStateHandlers[name];
  };

  getNodeStates = () => {
    const result: Map<string, any> = new Map();
    Object.entries(this.nodeGetStateHandlers).forEach(([key, getHandler]) => {
      if (key) {
        const nodeState = getHandler();
        result.set(nodeState.id, nodeState.data);
      }
    });
    return result;
  };

  getNodeState = (id: string) => {
    const getHandler = this.nodeGetStateHandlers[id];
    if (getHandler) {
      const nodeState = getHandler();
      return nodeState.data;
    }
    return undefined;
  };

  setNodeStates = (nodeStates: Map<string, any>) => {
    nodeStates.forEach((data, id) => {
      const setHandler = this.nodeSetStateHandlers[id];
      if (setHandler) {
        setHandler(id, data);
      }
    });
  };

  executeCommandOnCommandHandler = (
    name: string,
    commandName: string,
    data: any
  ) => {
    if (this.commandHandlers[name]) {
      this.commandHandlers[name].execute(commandName, data);
    }
  };

  setTempData = (key: string, value: any) => {
    this.tempData[key] = value;
  };
  getTempData = (key: string) => {
    return this.tempData[key];
  };
}
