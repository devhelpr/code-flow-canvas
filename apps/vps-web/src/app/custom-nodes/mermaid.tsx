import {
  createJSXElement,
  FormField,
  IComputeResult,
  InitialValues,
  IRectNodeComponent,
  NodeTask,
  Rect,
  renderElement,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { MermaidNode } from './classes/mermaid-node-class';

const fieldName = 'mermaid-input';
const nodeTitle = 'Mermaid diagram';
export const mermaidNodeName = 'mermaid-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    maxConnections: 1,
  },
];

export const getMermaidNode =
  () =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let rect: Rect<NodeInfo> | undefined;
    let mermaidNode: MermaidNode;
    let nodeRenderElement: HTMLElement | null = null;
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (input: string, loopIndex?: number, payload?: any) => {
      return mermaidNode.compute(input, loopIndex, payload).then((result) => {
        if (rect && rect.resize) {
          rect.resize(
            undefined,
            true,
            '.child-node-wrapper > *:first-child',
            true
          );
        }
        return result;
      });
    };

    return visualNodeFactory(
      mermaidNodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        rect = nodeInstance.rect;
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        mermaidNode = new MermaidNode(node.id);

        const childNodeWrapper = (nodeRenderElement = (
          rect?.nodeComponent?.domElement as HTMLElement
        ).querySelector('.child-node-wrapper'));
        const childNodeInstance =
          childNodeWrapper?.querySelector('.child-instance');
        if (childNodeInstance) {
          childNodeInstance.remove();
        }
        renderElement(mermaidNode.render(), childNodeWrapper);
        nodeRenderElement = (
          rect?.nodeComponent?.domElement as HTMLElement
        ).querySelector('.child-node-wrapper > *:first-child');
        if (nodeRenderElement) {
          mermaidNode.nodeRenderElement = nodeRenderElement;
          const resizeObserver = new ResizeObserver(() => {
            if (rect && rect.resize) {
              rect.resize(
                undefined,
                true,
                '.child-node-wrapper > *:first-child',
                true
              );
            }
          });
          resizeObserver.observe(nodeRenderElement);
          if (node?.nodeInfo) {
            node.nodeInfo.delete = () => {
              if (nodeRenderElement) {
                resizeObserver.unobserve(nodeRenderElement);
              }
              resizeObserver.disconnect();
            };
          }
        }
        // if (rect && rect.resize) {
        //   rect.resize(undefined, undefined, undefined, true);
        // }
      },
      {
        category: 'Diagrams',
        hasStaticWidthHeight: true,
        hasCustomStyling: true,
        customClassName: 'mermaid-node',
        childNodeWrapperClass: 'child-node-wrapper',
        centerToYPositionThumb: true,
      },
      <div class="child-instance"></div>,
      true
    );
  };
