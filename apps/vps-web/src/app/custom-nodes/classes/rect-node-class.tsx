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

  static readonly disableManualResize: boolean = false;

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
  /*
w-min h-min
			min-w-min min-h-min
			p-0 
			flex items-center justify-center
*/
  render = (node: FlowNode<NodeInfo>) => {
    const nodeInfo = node.nodeInfo as any;
    console.log('render rect-node', node.width, node.height);
    return (
      <div>
        <div
          getElement={(element: HTMLElement) => {
            this.rectElement = element;
          }}
          class={`rounded  justify-center items-center text-center whitespace-pre inline-flex`}
          style={`min-width:${node.width ?? 50}px;min-height:${
            node.height ?? 50
          }px;background:${nodeInfo?.fillColor ?? 'black'};border: ${
            nodeInfo?.strokeWidth ?? '2'
          }px ${nodeInfo?.strokeColor ?? 'white'} solid;color:${
            nodeInfo?.strokeColor ?? 'white'
          }`}
          spellcheck="false"
          blur={() => {
            if (this.rectElement) {
              if (this.rectElement.innerHTML.toString().length == 0) {
                // hacky solution to prevent caret being aligned to top
                this.rectElement.innerHTML = '&nbsp;';
              }
            }
            console.log('blur', this.rectElement?.textContent);
            if (this.node?.nodeInfo) {
              (this.node.nodeInfo as any).text = this.rectElement?.textContent;
            }
            this.updated();
          }}
          contentEditable={true}
          pointerdown={(e: PointerEvent) => {
            if (e.shiftKey && this.rectElement) {
              this.rectElement.contentEditable = 'false';
            }
          }}
          pointerup={() => {
            if (this.rectElement) {
              this.rectElement.contentEditable = 'true';
            }
          }}
        >
          {nodeInfo?.text ?? ''}
        </div>
      </div>
    );
  };

  setSize = (width: number, height: number) => {
    if (this.rectElement) {
      this.rectElement.style.width = `${width}px`;
      this.rectElement.style.height = `${height}px`;
    }
  };
}
