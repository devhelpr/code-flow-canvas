import { Flow, BaseNodeInfo } from '@devhelpr/visual-programming-system';

export interface StorageProvider<T extends BaseNodeInfo> {
  getFlow: (
    flowId: string,
    defaultFlow?: Flow<T>
  ) => Promise<{ flow: Flow<T>; didNotExist: boolean }>;
  saveFlow: (flowId: string, flow: Flow<T>) => Promise<void>;
  getCurrentFlow: () => Flow<T> | undefined;
}
