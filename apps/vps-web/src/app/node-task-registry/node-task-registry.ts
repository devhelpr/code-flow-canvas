import {
  CanvasAppInstance,
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';

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
    canvasApp: CanvasAppInstance<T>,
    x: number,
    y: number,
    id?: string,
    initalValues?: InitialValues,
    containerNode?: IRectNodeComponent<T>,
    width?: number,
    height?: number,
    nestedLevel?: number
  ) => IRectNodeComponent<T>;
  getConnectionInfo?: () => {
    inputs: IRectNodeComponent<T>[];
    outputs: IRectNodeComponent<T>[];
  };
};

export type NodeTypeRegistry<T> = Record<string, NodeTaskFactory<T>>;
