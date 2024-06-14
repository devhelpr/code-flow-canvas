import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { BaseNodeInfo } from '../types/base-node-info';

export interface Exporter {
  canvasApp: CanvasAppInstance<BaseNodeInfo>;
  downloadFile: (data: any, name: string, dataType: string) => void;
}
