import {
  createJSXElement,
  FlowNode,
  IComputeResult,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { BaseRectNode } from './base-rect-node-class';

export class RectNode extends BaseRectNode {
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
    super(id, updated, node);
  }
  compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      const data = (this.node?.nodeInfo as any)?.text ?? input;
      resolve({
        result: data,
        output: data,
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

  childElementSelector = '.child-node-wrapper textarea'; // '.child-node-wrapper > *:first-child'
  render(node: FlowNode<NodeInfo>) {
    const nodeInfo = node.nodeInfo as any;
    console.log(
      'render rect-node',
      node.width,
      node.height,
      (node?.nodeInfo as any)?.text
    );
    return (
      <div class="h-full w-full">
        <div
          getElement={(element: HTMLElement) => {
            this.rectElement = element;
          }}
          class={`h-full w-full rounded overflow-clip justify-center items-center text-center whitespace-pre inline-flex grow-textarea`}
          style={`background:${nodeInfo?.fillColor ?? 'black'};border: ${
            nodeInfo?.strokeWidth ?? '2'
          }px ${nodeInfo?.strokeColor ?? 'white'} solid;color:${
            nodeInfo?.strokeColor ?? 'white'
          }`}
        >
          {super.render(node)}
        </div>
      </div>
    );
    /*
    min-width:${node.width ?? 50}px;min-height:${
            node.height ?? 50
          }px;
    */
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
}
