import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { AddNodeCommand } from './add-node-command/add-node-command';
import { CommandHandler } from './command-handler/command-handler';
const commandRegistry = new Map<string, CommandHandler>();

export const registerCommands = (
  rootElement: HTMLElement,
  canvasApp: CanvasAppInstance<NodeInfo>,
  canvasUpdated: () => void
) => {
  commandRegistry.set(
    'add-node',
    new AddNodeCommand(rootElement, canvasApp, canvasUpdated)
  );
};

export const executeCommand = (
  commandName: string,
  parameter1?: any,
  parameter2?: any
) => {
  const command = commandRegistry.get(commandName);
  if (command) {
    command.execute(parameter1, parameter2);
  }
};
