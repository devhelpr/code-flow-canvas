import {
  createJSXElement,
  FlowNode,
  FormField,
  IComputeResult,
  IRectNodeComponent,
  InitialValues,
  FormFieldType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { BaseRectNode } from './base-rect-node-class';

export class PromptNode extends BaseRectNode {
  static readonly nodeTypeName: string = 'prompt-rect-node';
  static readonly nodeTitle: string = 'Prompt node';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static readonly disableManualResize: boolean = true;

  static initialWidth = 100;
  static intialHeight = 100;
  static getFormFields = (
    getNode: () => IRectNodeComponent<NodeInfo>,
    updated: () => void,
    values?: InitialValues
  ) => {
    return [
      {
        fieldType: FormFieldType.Text,
        fieldName: 'prompt',
        value: values?.['prompt'] ?? '',
        onChange: (value: string) => {
          const node = getNode();
          if (!node?.nodeInfo) {
            return;
          }
          node.nodeInfo.formValues = {
            ...node.nodeInfo.formValues,
            prompt: value,
          };
          if (updated) {
            updated();
          }
        },
      },
      {
        fieldType: FormFieldType.Checkbox,
        fieldName: 'isCondition',
        value: values?.['isCondition'] ?? false,
        onChange: (value: boolean) => {
          const node = getNode();
          if (!node?.nodeInfo) {
            return;
          }
          node.nodeInfo.formValues = {
            ...node.nodeInfo.formValues,
            isCondition: value,
          };
          if (updated) {
            updated();
          }
        },
      },
    ];
  };
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

  childElementSelector = '.child-node-wrapper > article'; // '.child-node-wrapper > *:first-child'
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
          <article>prompt</article>
        </div>
      </div>
    );
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
}
