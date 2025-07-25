import {
  createJSXElement,
  FlowNode,
  IComputeResult,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

// @ts-expect-error:will-fix-later
import TestWorker from './workers/test-worker?worker';
import { BaseRectNode } from '@devhelpr/app-canvas';

const testWorker = new TestWorker();

testWorker.addEventListener('message', (event: any) => {
  console.log('Worker response:', event.data);
});

export class OvalNode extends BaseRectNode {
  static readonly nodeTypeName = 'oval-node';
  static readonly nodeTitle = 'Oval node';
  static readonly category = 'Default test';
  static readonly text = 'oval';

  static readonly disableManualResize: boolean = false;

  override compute = (
    input: unknown,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      testWorker.postMessage(input);
      testWorker.onmessage = (event: any) => {
        resolve({
          result: event.data.payload.processedData,
          output: event.data.payload.processedData,
          followPath: undefined,
        });
      };
    });
  };

  childElementSelector = '.child-node-wrapper textarea';
  render = (node: FlowNode<NodeInfo>) => {
    const nodeInfo = node.nodeInfo as any;
    console.log('render rect-node', node.width, node.height);
    return (
      <div class="h-full w-full">
        <div
          getElement={(element: HTMLElement) => {
            this.rectElement = element;
          }}
          class={`h-full w-full rounded-full overflow-clip justify-center items-center text-center whitespace-pre inline-flex`}
          style={`;background:${nodeInfo?.fillColor ?? 'black'};border: ${
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
          }px
    */
  };
}
