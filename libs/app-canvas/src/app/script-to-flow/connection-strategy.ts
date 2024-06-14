import { IConnectionNodeComponent } from '@devhelpr/visual-programming-system';

export abstract class ConnectionStrategy<T> {
  abstract createConnection(connection: string): IConnectionNodeComponent<T>;
}
