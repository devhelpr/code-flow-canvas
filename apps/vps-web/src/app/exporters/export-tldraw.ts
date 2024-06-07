import {
  INodeComponent,
  NodeType,
  cleanupNodeInfoForSerializing,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { Exporter } from './Exporter';
import {
  tldrawEmptyFile,
  tldrawEmptyGroupNode,
  tldrawShapeNode,
} from './tldraw/tldraw-emtpy-file';

export const exportTldraw = (exportInfo: Exporter) => {
  const tldrawExport = structuredClone(tldrawEmptyFile);

  let index = 1;
  exportInfo.canvasApp?.elements.forEach((element) => {
    const node = element as INodeComponent<NodeInfo>;
    if (node.nodeType === NodeType.Connection) {
      return;
    }
    if (node.containerNode) {
      return;
    }
    if (node.nodeInfo?.isComposition) {
      return;
    }
    const tldrawGroup = structuredClone(tldrawEmptyGroupNode);
    tldrawGroup.id = `shape:${node.id}_group`;
    tldrawGroup.x = node.x;
    tldrawGroup.y = node.y;
    tldrawGroup.index = `a${index.toString().padStart(8, '1')}`;
    tldrawExport.records.push(tldrawGroup);

    const tldrawNode = structuredClone(tldrawShapeNode);
    tldrawNode.id = `shape:${node.id}`;
    tldrawNode.parentId = tldrawGroup.id;

    const cleanNodeInfo = cleanupNodeInfoForSerializing(node.nodeInfo);

    let groupIndex = 1;
    tldrawNode.meta = {
      nodeInfo: cleanNodeInfo,
    };
    tldrawNode.x = node.x - tldrawGroup.x;
    tldrawNode.y = node.y - tldrawGroup.y;
    tldrawNode.props.w = node.width ?? 0;
    tldrawNode.props.h = node.height ?? 0;
    tldrawNode.props.text = node.nodeInfo?.type ?? '';
    tldrawNode.index = `a${groupIndex.toString().padStart(8, '1')}`;
    tldrawExport.records.push(tldrawNode);
    groupIndex++;
    node.thumbConnectors?.forEach((thumb) => {
      const tldrawThumb = structuredClone(tldrawShapeNode);
      tldrawThumb.id = `shape:${node.id}_thumb_${thumb.thumbName}`;
      tldrawThumb.parentId = tldrawGroup.id;
      // tldrawThumb.meta = {
      //   thumb: thumb,
      // };
      tldrawThumb.x = thumb.x - tldrawNode.x - (thumb.width ?? 0) / 2;
      tldrawThumb.y = thumb.y - tldrawNode.y - (thumb.height ?? 0) / 2;
      tldrawThumb.props.w = thumb.width ?? 0;
      tldrawThumb.props.h = thumb.height ?? 0;
      tldrawThumb.props.fill = 'semi';
      //tldrawThumb.props.text = thumb.thumbName;
      tldrawThumb.index = `a${groupIndex.toString().padStart(8, '1')}`;
      tldrawExport.records.push(tldrawThumb);
      groupIndex++;
      if (groupIndex % 10 === 0) {
        groupIndex++;
      }
    });

    index++;
    if (index % 10 === 0) {
      index++;
    }
  });

  exportInfo.downloadFile(
    JSON.stringify(tldrawExport),
    'tldraw.tldr',
    'application/json'
  );
};
