import {
  CanvasAppInstance,
  ICommandHandler,
  IElementNode,
} from '@devhelpr/visual-programming-system';
import { AddNodeCommand } from './add-node-command/add-node-command';
import { DeleteNodeCommand } from './delete-node-command/delete-node-command';
import { NodeTaskFactory } from '../node-task-registry';

export const registerCommands = <T>(
  rootElement: HTMLElement,
  canvasApp: CanvasAppInstance<T>,
  canvasUpdated: () => void,
  removeElement: (element: IElementNode<T>) => void,
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>,
  commandRegistry: Map<string, ICommandHandler>
) => {
  commandRegistry.set(
    'add-node',
    new AddNodeCommand<T>(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory
    )
  );
  commandRegistry.set(
    'delete-node',
    new DeleteNodeCommand<T>(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory
    )
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
