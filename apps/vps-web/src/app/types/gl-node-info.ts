import { CanvasAppInstance, IThumb } from '@devhelpr/visual-programming-system';
import { BaseNodeInfo } from './base-node-info';

export interface GLNodeInfo extends BaseNodeInfo {
  taskType?: string;
  compute?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    thumbIdentifierWithinNode?: string
  ) => {
    result: string | undefined;
  };

  canvasAppInstance?: CanvasAppInstance<GLNodeInfo>;

  thumbs?: IThumb[];
}
