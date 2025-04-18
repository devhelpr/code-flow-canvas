import {
  IFlowCanvasBase,
  IConnectionNodeComponent,
  IElementNode,
  IRectNodeComponent,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

export abstract class BaseAnimatePath<T extends BaseNodeInfo> {
  abstract start: (input?: string | any[], followPathByName?: string) => void;
  abstract onNextNode: (
    nodeId: string,
    node: IRectNodeComponent<T>,
    input: string | any[],
    connection: IConnectionNodeComponent<T>,
    scopeId?: string
  ) =>
    | { result: boolean; output: string | any[]; followPathByName?: string }
    | Promise<{
        result: boolean;
        output: string | any[];
        followPathByName?: string;
      }>;
  abstract onStopped?: (input: string | any[], scopeId?: string) => void;
  abstract canvasApp: IFlowCanvasBase<T>;
  abstract node: IRectNodeComponent<T>;
  abstract animatedNodes?: {
    [key: string]: IElementNode<T>;
  };
  abstract offsetX?: number;
  abstract offsetY?: number;
  abstract followPathToEndThumb?: boolean;
  abstract singleStep?: boolean;
}
