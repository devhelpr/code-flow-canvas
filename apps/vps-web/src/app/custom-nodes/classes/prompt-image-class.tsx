import {
  createJSXElement,
  FlowNode,
  IComputeResult,
  IRectNodeComponent,
  InitialValues,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { BaseRectNode } from './base-rect-node-class';

export class PromptImageNode extends BaseRectNode {
  static readonly nodeTypeName: string = 'prompt-image-rect-node';
  static readonly nodeTitle: string = 'Prompt image';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static readonly disableManualResize: boolean = true;

  static initialWidth = 100;
  static intialHeight = 100;
  static getFormFields = (
    _getNode: () => IRectNodeComponent<NodeInfo>,
    _updated: () => void,
    _values?: InitialValues
  ) => {
    return [];
  };
  constructor(
    id: string,
    updated: () => void,
    node: IRectNodeComponent<NodeInfo>
  ) {
    super(id, updated, node);
  }
  compute = (
    _input: string,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      resolve({
        result: (this.node?.nodeInfo as any)?.prompt ?? 'prompt',
        output: (this.node?.nodeInfo as any)?.prompt ?? 'prompt',
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
  imageElement: HTMLImageElement | undefined;
  childElementSelector = '.child-node-wrapper > article'; // '.child-node-wrapper > *:first-child'
  render(node: FlowNode<NodeInfo>) {
    const nodeInfo = node.nodeInfo as any;
    console.log(
      'render prompt image rect-node',
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
          <img
            class="w-full h-full cover"
            getElement={(element: HTMLImageElement) => {
              this.imageElement = element;
            }}
          >
            prompt image
          </img>
        </div>
      </div>
    );
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;

  updateVisual = (data: any) => {
    if (this.imageElement && data && data.image && data.isImage) {
      this.imageElement.src = `data:${
        data.mimeType ? data.mimeType : 'image/png'
      };base64,${data.image}`;
    }
  };
}
