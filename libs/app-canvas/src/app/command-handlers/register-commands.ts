import {
  BaseNodeInfo,
  ICommandHandler,
} from '@devhelpr/visual-programming-system';
import { AddNodeCommand } from './add-node-command/add-node-command';
import { DeleteNodeCommand } from './delete-node-command/delete-node-command';
import { PasteNodeCommand } from './paste-node-command/paste-node-command';
import { CopyNodeCommand } from './copy-node-command/copy-node-command';
import { ICommandContext } from './command-context';
import { AutoAlignCommand } from './auto-align-command/auto-align-command';
import { ReplaceNodeCommand } from './replace-node-command/replace-node-command';

export const registerCommands = <T extends BaseNodeInfo, TFlowEngine = unknown>(
  commandContext: ICommandContext<T, TFlowEngine>
) => {
  commandContext.commandRegistry.set(
    'add-node',
    new AddNodeCommand<T, TFlowEngine>(commandContext)
  );
  commandContext.commandRegistry.set(
    'delete-node',
    new DeleteNodeCommand<T, TFlowEngine>(commandContext)
  );
  commandContext.commandRegistry.set(
    'copy-node',
    new CopyNodeCommand<T, TFlowEngine>(commandContext)
  );
  commandContext.commandRegistry.set(
    PasteNodeCommand.commandName,
    new PasteNodeCommand<T, TFlowEngine>(commandContext)
  );
  commandContext.commandRegistry.set(
    'auto-align',
    new AutoAlignCommand<T, TFlowEngine>(commandContext)
  );
  commandContext.commandRegistry.set(
    'replace-node',
    new ReplaceNodeCommand<T, TFlowEngine>(commandContext)
  );
};

export const executeCommand = (
  commandRegistry: Map<string, ICommandHandler>,
  commandName: string,
  parameter1?: any,
  parameter2?: any
) => {
  const command = commandRegistry.get(commandName);
  if (command) {
    command.execute(parameter1, parameter2);
  }
};
