import {
  createJSXElement,
  FlowNode,
  FormField,
  InitialValues,
  IRectNodeComponent,
  NodeTask,
  Rect,
  renderElement,
  Theme,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { RectNode } from './classes/rect-node-class';

const category = 'Default';
const fieldName = 'rect-input';
const nodeTitle = 'Rect node';
export const rectNodeName = 'rect-node';
const familyName = 'flow-canvas';

export const getRectNode =
  () =>
  (
    updated: () => void,
    _theme?: Theme,
    flowNode?: FlowNode<NodeInfo>
  ): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let rect: Rect<NodeInfo> | undefined;
    let rectNode: RectNode;
    let nodeRenderElement: HTMLElement | null = null;
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (input: string, loopIndex?: number, payload?: any) => {
      return rectNode.compute(input, loopIndex, payload).then((result) => {
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
      rectNodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      flowNode?.width ?? 10,
      flowNode?.height ?? 10,
      [],
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        if (!flowNode) {
          return;
        }
        rect = nodeInstance.rect;
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;

        rectNode = new RectNode(node.id, updated, node);

        const childNodeWrapper = (nodeRenderElement = (
          rect?.nodeComponent?.domElement as HTMLElement
        ).querySelector('.child-node-wrapper'));
        const childNodeInstance =
          childNodeWrapper?.querySelector('.child-instance');
        if (childNodeInstance) {
          childNodeInstance.remove();
        }
        renderElement(rectNode.render(flowNode), childNodeWrapper);
        nodeRenderElement = (
          rect?.nodeComponent?.domElement as HTMLElement
        ).querySelector('.child-node-wrapper > *:first-child');
        if (nodeRenderElement) {
          rectNode.nodeRenderElement = nodeRenderElement;
          const resizeObserver = new ResizeObserver(() => {
            if (rect && rect.resize) {
              console.log('RECT RESIZE via observer');
              // problem with manual resizing is partially solved when this is commented
              // node content is not resized though...
              if (node.isSettingSize) {
                node.isSettingSize = false;
                rectNode.setSize(node.width ?? 10, node.height ?? 10);
                return;
              }
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
        category,
        hasStaticWidthHeight: true,
        hasCustomStyling: true,
        customClassName: 'custom-rect-node',
        childNodeWrapperClass: 'child-node-wrapper',
        centerToYPositionThumb: false,
        skipDetermineSizeOnInit: true,
      },
      <div class="child-instance"></div>,
      true
    );
  };
