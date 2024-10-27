import {
  BaseNodeInfo,
  IConnectionNodeComponent,
} from '@devhelpr/visual-programming-system';

export abstract class ConnectionStrategy<T extends BaseNodeInfo> {
  abstract createConnection(connection: string): IConnectionNodeComponent<T>;
}
