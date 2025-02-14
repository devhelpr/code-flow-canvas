import {
  createJSXElement,
  FlowNode,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { BaseRectNode } from './rect-node-class';

export class OvalNode extends BaseRectNode {
  static readonly nodeTypeName = 'oval-node';
  static readonly nodeTitle = 'Oval node';
  static readonly category = 'Default test';
  static readonly text = 'oval';

  childElementSelector = '.child-node-wrapper > *:first-child';
  render = (node: FlowNode<NodeInfo>) => {
    const nodeInfo = node.nodeInfo as any;
    console.log('render rect-node', node.width, node.height);
    return (
      <div>
        <div
          getElement={(element: HTMLElement) => {
            this.rectElement = element;
          }}
          class={`rounded-full justify-center items-center text-center whitespace-pre inline-flex`}
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
}
