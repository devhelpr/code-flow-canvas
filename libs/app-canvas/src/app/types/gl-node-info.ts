import {
  FlowCanvasInstance,
  IThumb,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

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

  canvasAppInstance?: FlowCanvasInstance<GLNodeInfo>;

  thumbs?: IThumb[];
  initializeOnCompile?: boolean;
}
