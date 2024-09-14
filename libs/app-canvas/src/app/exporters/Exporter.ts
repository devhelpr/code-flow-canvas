import {
  FlowCanvasInstance,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

export interface Exporter {
  canvasApp: FlowCanvasInstance<BaseNodeInfo>;
  downloadFile: (data: any, name: string, dataType: string) => void;
}
