import { LineType } from '../types';
import { Composition } from './composition';

export interface FlowEndpoint {
  id: string;
  name: string;
  type: string;
  group: string;
  outputs: FlowEndpointOutput[];
}

export interface FlowEndpointOutput {
  id: string;
  name: string;
  type: string;
}

export interface FlowMeta {
  title: string;
}

export interface Flow<T> {
  schemaType: string;
  schemaVersion: string;
  id: string;
  ocif?: any; // for ocif .. for now "any"
  flows: {
    [flowName: string]: {
      flowType: string;
      nodes: FlowNode<T>[];
    };
  };
  compositions: Record<string, Composition<T>>;
}

export interface FlowNode<T> {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;

  layer?: number;

  endX?: number;
  endY?: number;

  offsetX?: number;
  offsetY?: number;
  radius?: number;

  lineType?: LineType;
  controlPoints?: { x: number; y: number }[];

  connectionControllerType?: string;
  nodeType?: string;
  pathName?: string;

  isControlled?: boolean;
  isConnectPoint?: boolean;

  nodeInfo?: T;

  startNodeId?: string;
  endNodeId?: string;
  startThumbName?: string;
  endThumbName?: string;
  startThumbIdentifierWithinNode?: string;
  endThumbIdentifierWithinNode?: string;

  elements?: FlowNode<T>[];
  connections?: FlowNode<T>[];
}

export enum FlowChangeType {
  Unknown = 'Unknown',
  AddNode = 'AddNode',
  DeleteNode = 'DeleteNode',
  UpdateNode = 'UpdateNode',
  AddConnection = 'AddConnection',
  DeleteConnection = 'DeleteConnection',
  UpdateConnection = 'UpdateConnection',
  TriggerNode = 'TriggerNode',
}
