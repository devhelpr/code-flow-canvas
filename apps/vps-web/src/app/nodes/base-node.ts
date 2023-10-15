import {
  CanvasAppInstance,
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { NodeInfo } from '../types/node-info';

export abstract class BaseNode<T, X> {
  abstract compute: (
    input: string | X[],
    loopIndex?: number,
    pathExecution?: RunNodeResult<T>[]
  ) => {
    result: boolean;
    followPath?: string;
  };
  abstract initializeCompute: () => void;
  abstract createVisualNode: (
    canvasApp: CanvasAppInstance<NodeInfo>,
    x: number,
    y: number,
    id?: string,
    initialValue?: string,
    containerNode?: IRectNodeComponent<T>
  ) => void;
}
