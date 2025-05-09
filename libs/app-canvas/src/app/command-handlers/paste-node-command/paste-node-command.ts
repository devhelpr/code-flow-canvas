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
  T extends BaseNodeInfo,
  TFlowEngine
> extends CommandHandler<T, TFlowEngine> {
  constructor(commandContext: ICommandContext<T, TFlowEngine>) {
    super(commandContext);
    this.getNodeTaskFactory = commandContext.getNodeTaskFactory;
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.setupTasksInDropdown = commandContext.setupTasksInDropdown;
    this.commandRegistry = commandContext.commandRegistry;
    this.commandContext = commandContext;
  }
  static commandName = 'paste-node';
  commandContext: ICommandContext<T, TFlowEngine>;
  commandRegistry: Map<string, ICommandHandler>;
  rootElement: HTMLElement;
  getCanvasApp: () => IFlowCanvasBase<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T, TFlowEngine>;
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

    const shouldExecuteCommand =
      this.commandContext.onBeforeExecuteCommand?.(
        'paste-node',
        _parameter1,
        _parameter2
      ) ?? true;
    if (shouldExecuteCommand === false) {
      return;
    }
    console.log('PasteNodeCommand.execute');
    const copyCommand = this.commandRegistry.get(
      'copy-node'
    ) as CopyNodeCommand<T, TFlowEngine>;
    if (copyCommand) {
      const copyNode = copyCommand.node;
      const nodeType = copyNode?.nodeInfo?.type;
      if (nodeType && copyNode?.nodeInfo) {
        const factory = this.getNodeTaskFactory(nodeType);

        if (factory) {
          const nodeTask = factory(
            this.canvasUpdated,
            undefined,
            undefined,
            this.commandContext.flowEngine
          );
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
