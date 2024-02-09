import {
  CanvasAppInstance,
  ICommandHandler,
  IElementNode,
} from '@devhelpr/visual-programming-system';
import { AddNodeCommand } from './add-node-command/add-node-command';
import { DeleteNodeCommand } from './delete-node-command/delete-node-command';
import { NodeTaskFactory } from '../node-task-registry';
import { PasteNodeCommand } from './paste-node-command/paste-node-command';
import { CopyNodeCommand } from './copy-node-command/copy-node-command';
import { BaseNodeInfo } from '../types/base-node-info';

export const registerCommands = <T extends BaseNodeInfo>(
  rootElement: HTMLElement,
  canvasApp: CanvasAppInstance<T>,
  canvasUpdated: () => void,
  removeElement: (element: IElementNode<T>) => void,
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>,
  commandRegistry: Map<string, ICommandHandler>,
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void
) => {
  commandRegistry.set(
    'add-node',
    new AddNodeCommand<T>(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory,
      setupTasksInDropdown,
      commandRegistry
    )
  );
  commandRegistry.set(
    'delete-node',
    new DeleteNodeCommand<T>(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory,
      setupTasksInDropdown,
      commandRegistry
    )
  );
  commandRegistry.set(
    'copy-node',
    new CopyNodeCommand<T>(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory,
      setupTasksInDropdown,
      commandRegistry
    )
  );
  commandRegistry.set(
    'paste-node',
    new PasteNodeCommand<T>(
      rootElement,
      canvasApp,
      canvasUpdated,
      removeElement,
      getNodeTaskFactory,
      setupTasksInDropdown,
      commandRegistry
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
