import {
  createJSXElement,
  FlowNode,
  IComputeResult,
  IDOMElement,
  IRectNodeComponent,
  Rect,
  IFlowCanvasBase,
} from '@devhelpr/visual-programming-system';
import { NodeInfo, RunCounter } from '@devhelpr/web-flow-executor';

export type CreateRunCounterContext = (
  isRunViaRunButton: boolean,
  shouldResetConnectionSlider: boolean,
  onFlowFinished?: () => void
) => RunCounter;

export class BaseRectNode {
  nodeRenderElement: HTMLElement | undefined = undefined;
  rectElement: HTMLElement | undefined = undefined;
  canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  id: string;
  node: IRectNodeComponent<NodeInfo> | undefined = undefined;
  updated: () => void;
  getSettingsPopup:
    | ((popupContainer: HTMLElement) => IDOMElement | undefined)
    | undefined = undefined;

  rectInstance: Rect<NodeInfo> | undefined;

  createRunCounterContext: CreateRunCounterContext | undefined = undefined;

  static readonly nodeTypeName: string = 'rect-node';
  static readonly nodeTitle: string = 'Rect node';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static readonly disableManualResize: boolean = true;

  constructor(
    id: string,
    updated: () => void,
    node: IRectNodeComponent<NodeInfo>
  ) {
    this.id = id;
    this.updated = updated;
    this.node = node;
  }
  compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      resolve({
        result: input,
        output: input,
        followPath: undefined,
      });
    });
  };

  childElementSelector = '.child-node-wrapper > textarea'; // '.child-node-wrapper > *:first-child'
  render(node: FlowNode<NodeInfo>) {
    const nodeInfo = node.nodeInfo as any;
    console.log(
      'render rect-node',
      node.width,
      node.height,
      (node?.nodeInfo as any)?.text
    );
    return (
      <textarea
        class="w-full h-full bg-transparent text-center appearance-none focus-visible:outline-none resize-none"
        resize="none"
        rows="1"
        renderElement={(element: HTMLTextAreaElement) => {
          element.value = nodeInfo?.text ?? '';
          setTimeout(() => {
            element.style.height = 'auto';
            console.log('renderElement textarea', element.scrollHeight);
            element.style.height = element.scrollHeight + 'px';
          }, 0);
        }}
        input={(event: InputEvent) => {
          if (this.canvasAppInstance?.getCanvasAttribute('create-connection')) {
            event.preventDefault();
            return false;
          }
          if (
            this.node?.nodeInfo &&
            this.rectElement &&
            (event?.target as HTMLTextAreaElement)?.value
          ) {
            console.log(
              'textarea input',
              (event?.target as HTMLTextAreaElement)?.value
            );
            const value = (event?.target as HTMLTextAreaElement)?.value;

            (this.node.nodeInfo as any).text = value;
            const textarea = event.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
            if (this.onResize) {
              this.onResize(this.node.width ?? 10, textarea.scrollHeight);
            }
          }
          this.updated();
          return true;
        }}
      ></textarea>
    );
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
  setSize = (width: number, height: number) => {
    if (this.rectElement) {
      this.rectElement.style.width = `${width}px`;
      this.rectElement.style.height = `${height}px`;
    }
  };
}
