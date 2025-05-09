import { BaseNodeInfo } from '@devhelpr/visual-programming-system';
import { ICommandContext } from '../command-context';

export class CommandHandler<T extends BaseNodeInfo, TFlowEngine = unknown> {
  commandContext: ICommandContext<T, TFlowEngine>;
  constructor(_commandContext: ICommandContext<T, TFlowEngine>) {
    this.commandContext = _commandContext;
  }

  execute(_parameter1: any, _parameter2?: any): void {
    //
  }
}
