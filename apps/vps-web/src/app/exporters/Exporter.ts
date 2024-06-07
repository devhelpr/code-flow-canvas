import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export interface Exporter {
  canvasApp: CanvasAppInstance<NodeInfo>;
  downloadFile: (data: any, name: string, dataType: string) => void;
}
