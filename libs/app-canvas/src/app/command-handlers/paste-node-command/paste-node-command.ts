import {
  IFlowCanvasBase,
  ICommandHandler,
  BaseNodeInfo,
  NodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { CopyNodeCommand } from '../copy-node-command/copy-node-command';
import { ICommandContext } from '../command-context';

export class PasteNodeCommand<
  T extends BaseNodeInfo
> extends CommandHandler<T> {
  constructor(commandContext: ICommandContext<T>) {
    super(commandContext);
    this.getNodeTaskFactory = commandContext.getNodeTaskFactory;
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.setupTasksInDropdown = commandContext.setupTasksInDropdown;
    this.commandRegistry = commandContext.commandRegistry;
  }
  commandRegistry: Map<string, ICommandHandler>;
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;
  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  lastPastedNodeId = '';
  lastX = 0;
  lastY = 0;
  execute(_parameter1?: any, _parameter2?: any): void {
    const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    const copyCommand = this.commandRegistry.get(
      'copy-node'
    ) as CopyNodeCommand<T>;
    if (copyCommand) {
      const copyNode = copyCommand.node;
      const nodeType = copyNode?.nodeInfo?.type;
      if (nodeType && copyNode?.nodeInfo) {
        const factory = this.getNodeTaskFactory(nodeType);

        if (factory) {
          const nodeTask = factory(this.canvasUpdated);
          let x = copyNode.x;
          let y = copyNode.y;
          if (this.lastPastedNodeId === copyNode.id) {
            x = this.lastX;
            y = this.lastY;
          }
          x += 0;
          y += 20 + (copyNode?.height ?? 50);
          const initialValues = structuredClone(copyNode.nodeInfo.formValues);

          const nodeInfo = copyNode?.nodeInfo?.isComposition
            ? { isComposition: true }
            : {};
          const nodeClone = nodeTask.createVisualNode(
            canvasApp,
            x,
            y,
            undefined,
            initialValues,

            undefined,
            undefined,
            undefined,
            undefined,
            nodeInfo
          );
          this.lastX = x;
          this.lastY = y;
          this.lastPastedNodeId = copyNode.id;
          if (nodeClone && nodeClone.nodeInfo) {
            // TODO : IMPROVE THIS (needed for decorators !?)
            (nodeClone.nodeInfo as any).taskType = nodeType;
          }
        }
      }
    }
  }
}
