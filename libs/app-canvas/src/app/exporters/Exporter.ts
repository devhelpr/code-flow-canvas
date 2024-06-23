import {
  CanvasAppInstance,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';

export interface Exporter {
  canvasApp: CanvasAppInstance<BaseNodeInfo>;
  downloadFile: (data: any, name: string, dataType: string) => void;
}
