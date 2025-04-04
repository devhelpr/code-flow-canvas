import {
  createJSXElement,
  FlowNode,
  IComputeResult,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { BaseRectNode } from './base-rect-node-class';

export class CanvasNode extends BaseRectNode {
  static readonly nodeTypeName: string = 'canvas-rect-node';
  static readonly nodeTitle: string = 'Canvas node';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static readonly disableManualResize: boolean = false;

  static initialWidth = 300;
  static intialHeight = 300;

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

  childElementSelector = '.child-node-wrapper > canvas'; // '.child-node-wrapper > *:first-child'
  render(node: FlowNode<NodeInfo>) {
    const nodeInfo = node.nodeInfo as any;
    console.log(
      'render rect-node',
      node.width,
      node.height,
      (node?.nodeInfo as any)?.text
    );
    return (
      <div>
        <div
          getElement={(element: HTMLElement) => {
            this.rectElement = element;
          }}
          class={`w-full h-full relative rounded overflow-clip justify-center items-center text-center whitespace-pre inline-flex`}
          style={`min-width:${node.width ?? 50}px;min-height:${
            node.height ?? 50
          }px;background:${nodeInfo?.fillColor ?? 'black'};border: ${
            nodeInfo?.strokeWidth ?? '2'
          }px ${nodeInfo?.strokeColor ?? 'white'} solid;color:${
            nodeInfo?.strokeColor ?? 'white'
          }`}
        >
          <canvas
            width={node.width ?? 50}
            height={node.height ?? 50}
            style={`width:${node.width ?? 50}px;height:${node.height ?? 50}px`}
            class="absolute top-0 left-0 right-0 bottom-0 canvas-node pointer-events-none"
          ></canvas>
        </div>
      </div>
    );
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
}
