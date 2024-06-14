import { INodeComponent } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { Exporter } from './Exporter';
import { TLDrawShapeNode, TlDrawFile } from './tldraw/tldraw-schema';

export const syncFromTldraw = async (
  tldrawFile: TlDrawFile,
  exporter: Exporter
) => {
  const { records } = tldrawFile;
  const nodes = records.filter(
    (r) => r.typeName === 'shape' && r.type === 'group'
  );

  nodes.forEach((node) => {
    const { id, meta } = node;
    if (!meta?.isFlowNode) {
      return;
    }
    const shapeNode = node as TLDrawShapeNode;

    const nodeId = id.replace('shape:', '').replace('_group', '');
    const { x, y } = shapeNode;
    const flowNode = exporter.canvasApp?.elements.get(
      nodeId
    ) as INodeComponent<NodeInfo>;
    if (!flowNode) {
      return;
    }
    flowNode.x = x;
    flowNode.y = y;
    flowNode.update?.(flowNode, x, y, flowNode);
  });
};
