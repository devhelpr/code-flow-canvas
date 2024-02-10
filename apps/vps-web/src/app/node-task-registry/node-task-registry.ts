import {
  CanvasAppInstance,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
} from '@devhelpr/visual-programming-system';

export type InitialValues = Record<string, any>;
export type NodeTaskFactory<T> = (onUpdatedCanvas: () => void) => NodeTask<T>;
export type NodeTask<T> = {
  name: string;
  family: string;
  category?: string;
  isContainer?: boolean;
  isContained?: boolean;
  canBeUsedAsDecorator?: boolean;
  childNodeTasks?: string[];
  thumbs?: IThumb[];
  hideFromNodeTypeSelector?: boolean;
  getCompute?: () => (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    thumbIdentifierWithinNode?: string
  ) => { result: string | undefined };
  createVisualNode: (
    canvasApp: CanvasAppInstance<T>,
    x: number,
    y: number,
    id?: string,
    initalValues?: InitialValues,
    containerNode?: IRectNodeComponent<T>,
    width?: number,
    height?: number,
    nestedLevel?: number,
    dummy?: any,
    dummy2?: any
  ) => IRectNodeComponent<T>;
  getConnectionInfo?: () => {
    inputs: IRectNodeComponent<T>[];
    outputs: IRectNodeComponent<T>[];
  };
  createDecoratorNode?: (
    canvasApp: CanvasAppInstance<T>,
    initalValues?: InitialValues
  ) => INodeComponent<T>;
  setTitle?: (newTitle: string) => void;
};

export type NodeTypeRegistry<T> = Record<string, NodeTaskFactory<T>>;
