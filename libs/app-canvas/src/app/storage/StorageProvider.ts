import { Flow } from '@devhelpr/visual-programming-system';
import { BaseNodeInfo } from '../types/base-node-info';

export interface StorageProvider<T extends BaseNodeInfo> {
  getFlow: (flowId: string) => Promise<Flow<T>>;
  saveFlow: (flowId: string, flow: Flow<T>) => Promise<void>;
}
