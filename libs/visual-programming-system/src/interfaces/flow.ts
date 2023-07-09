import { LineType, ShapeType } from '../types';

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

  endX?: number;
  endY?: number;

  offsetX?: number;
  offsetY?: number;
  radius?: number;

  lineType?: LineType;
  controlPoints?: { x: number; y: number }[];

  specifier?: string;
  nodeType?: string;
  pathName?: string;

  isControlled?: boolean;
  isConnectPoint?: boolean;
  shapeType?: ShapeType;

  nodeInfo?: T;

  startNodeId?: string;
  endNodeId?: string;
  startThumbName?: string;
  endThumbName?: string;
}
