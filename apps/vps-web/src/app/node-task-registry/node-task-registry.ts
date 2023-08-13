import {
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType } from '../types/node-info';

export type InitialValues = Record<string, any>;
export type NodeTaskFactory<T> = (onUpdatedCanvas: () => void) => NodeTask<T>;
export type NodeTask<T> = {
  name: string;
  family: string;
  category?: string;
  isContainer?: boolean;
  isContained?: boolean;
  childNodeTasks?: string[];
  createVisualNode: (
    canvasApp: canvasAppReturnType,
    x: number,
    y: number,
    id?: string,
    initalValues?: InitialValues,
    containerNode?: IRectNodeComponent<T>
  ) => IRectNodeComponent<T>;
  getConnectionInfo?: () => {
    inputs: IRectNodeComponent<T>[];
    outputs: IRectNodeComponent<T>[];
  };
};

export type NodeTypeRegistry<T> = Record<string, NodeTaskFactory<T>>;
