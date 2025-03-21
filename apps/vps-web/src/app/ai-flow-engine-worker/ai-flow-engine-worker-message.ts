import {
  Flow,
  BaseNodeInfo,
  IComputeResult,
} from '@devhelpr/visual-programming-system';

export interface AIWorkerMessage {
  message: string;
  flow?: Flow<BaseNodeInfo>;
  nodeId?: string;
  input?: any;
}

export interface AIWorkerMessageResponse {
  message: string;
  result: IComputeResult;
}

export interface AIWorkerWorker extends Omit<Worker, 'postMessage'> {
  postMessage: (message: AIWorkerMessage) => void;
}

export interface AIWorkerWorkerSelf extends Omit<Worker, 'postMessage'> {
  postMessage: (message: AIWorkerMessageResponse) => void;
}
