import { LineType } from '../types';

export interface Flow<T> {
  schemaType: string;
  schemaVersion: string;
  id: string;
  flows: {
    [flowName: string]: {
      flowType: string;
      nodes: FlowNode<T>[];
    };
  };
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

  elements?: FlowNode<T>[];
}
