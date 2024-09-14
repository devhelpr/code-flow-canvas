import { FlowCanvas, BaseNodeInfo } from '@devhelpr/visual-programming-system';

export interface Exporter {
  canvasApp: FlowCanvas<BaseNodeInfo>;
  downloadFile: (data: any, name: string, dataType: string) => void;
}
