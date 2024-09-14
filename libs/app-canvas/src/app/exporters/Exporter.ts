import {
  IFlowCanvasBase,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

export interface Exporter {
  canvasApp: IFlowCanvasBase<BaseNodeInfo>;
  downloadFile: (data: any, name: string, dataType: string) => void;
}
