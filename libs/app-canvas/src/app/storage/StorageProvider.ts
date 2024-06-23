import { Flow, BaseNodeInfo } from '@devhelpr/visual-programming-system';

export interface StorageProvider<T extends BaseNodeInfo> {
  getFlow: (flowId: string) => Promise<Flow<T>>;
  saveFlow: (flowId: string, flow: Flow<T>) => Promise<void>;
}
