import { BaseNodeInfo } from '@devhelpr/visual-programming-system';
import { ICommandContext } from '../command-context';

export class CommandHandler<T extends BaseNodeInfo> {
  constructor(_commandContext: ICommandContext<T>) {
    //
  }

  execute(_parameter1: any, _parameter2?: any): void {
    //
  }
}
