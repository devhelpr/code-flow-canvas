import {
  CanvasAppInstance,
  IElementNode,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { AddNodeCommand } from './add-node-command/add-node-command';
import { CommandHandler } from './command-handler/command-handler';
import { DeleteNodeCommand } from './delete-node-command/delete-node-command';
const commandRegistry = new Map<string, CommandHandler>();

export const registerCommands = (
  rootElement: HTMLElement,
  canvasApp: CanvasAppInstance<NodeInfo>,
  canvasUpdated: () => void,
  removeElement: (element: IElementNode<NodeInfo>) => void
) => {
  commandRegistry.set(
    'add-node',
    new AddNodeCommand(rootElement, canvasApp, canvasUpdated, removeElement)
  );
  commandRegistry.set(
    'delete-node',
    new DeleteNodeCommand(rootElement, canvasApp, canvasUpdated, removeElement)
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
