import {
  ElementNodeMap,
  IConnectionNodeComponent,
  INodeComponent,
  NodeType,
  ThumbConnectionType,
  cleanupNodeInfoForSerializing,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { Exporter } from './Exporter';
import {
  bindingEnd,
  bindingStart,
  tldrawEmptyArrowNode,
  tldrawEmptyFile,
  tldrawEmptyGroupNode,
  tldrawShapeNode,
} from './tldraw/tldraw-emtpy-file';
import { BaseNodeInfo } from '../types/base-node-info';
import { TlDrawFile } from './tldraw/tldraw-schema';

const exportNodesToTldraw = (
  exportInfo: Exporter,
  tldrawExport: TlDrawFile,
  parentId: undefined | string,
  elements: ElementNodeMap<BaseNodeInfo>
) => {
  let index = 1;
  elements.forEach((element) => {
    const node = element as INodeComponent<NodeInfo>;

    if (node.nodeType === NodeType.Connection) {
      return;
    }

    const tldrawGroup = structuredClone(tldrawEmptyGroupNode);
    tldrawGroup.id = `shape:${node.id}_group`;
    tldrawGroup.x = node.x;
    tldrawGroup.y = node.y;
    tldrawGroup.index = `b${index.toString().padStart(8, '1')}`;
    if (parentId) {
      tldrawGroup.parentId = parentId;
    }
    tldrawExport.records.push(tldrawGroup);

    const tldrawNode = structuredClone(tldrawShapeNode);
    tldrawNode.id = `shape:${node.id}`;
    tldrawNode.parentId = tldrawGroup.id;

    const cleanNodeInfo = cleanupNodeInfoForSerializing(node.nodeInfo);

    let groupIndex = 1;
    tldrawGroup.meta = {
      isFlowNode: true,
      nodeInfo: cleanNodeInfo,
    };
    let additionalData = '';
    const fieldName = node.nodeInfo?.formElements?.[0]?.fieldName;
    if (fieldName) {
      const value = node.nodeInfo?.formValues?.[fieldName];
      if (value) {
        additionalData = `${value}`;
      }
    }
    tldrawNode.x = node.x - tldrawGroup.x;
    tldrawNode.y = node.y - tldrawGroup.y;
    tldrawNode.props.w = node.width || 1;
    tldrawNode.props.h = node.height || 1;

    if (node.nodeInfo?.canvasAppInstance) {
      tldrawNode.props.align = 'start';
      tldrawNode.props.verticalAlign = 'start';
    }

    if (node.nodeInfo?.isComposition && node.nodeInfo?.compositionId) {
      const composition = exportInfo.canvasApp.compositons.getComposition(
        node.nodeInfo?.compositionId
      );
      if (composition) {
        tldrawNode.props.text = composition.name;
      } else {
        tldrawNode.props.text = 'Composition';
      }
    } else {
      tldrawNode.props.text = node.nodeInfo?.type ?? '';
      if (additionalData) {
        tldrawNode.props.text += `\n${additionalData}`;
      }
    }
    tldrawNode.index = `b${groupIndex.toString().padStart(8, '1')}`;
    tldrawExport.records.push(tldrawNode);
    groupIndex++;
    let isRectThumb = false;
    if (
      node.thumbConnectors?.length === 1 &&
      node.thumbConnectors[0].thumbConnectionType ===
        ThumbConnectionType.startOrEnd
    ) {
      isRectThumb = true;
    }
    if (!isRectThumb) {
      node.thumbConnectors?.forEach((thumb) => {
        const tldrawThumb = structuredClone(tldrawShapeNode);
        tldrawThumb.id = `shape:${node.id}_thumb_${thumb.thumbName}`;
        tldrawThumb.parentId = tldrawGroup.id;
        // tldrawThumb.meta = {
        //   thumb: thumb,
        // };
        tldrawThumb.x = thumb.x - tldrawNode.x - (thumb.width ?? 0) / 2;
        tldrawThumb.y = thumb.y - tldrawNode.y - (thumb.height ?? 0) / 2;
        tldrawThumb.props.w = thumb.width || 1;
        tldrawThumb.props.h = thumb.height || 1;
        tldrawThumb.props.fill = 'semi';
        //tldrawThumb.props.text = thumb.thumbName;
        tldrawThumb.index = `c${groupIndex.toString().padStart(8, '1')}`;
        tldrawExport.records.push(tldrawThumb);
        groupIndex++;
        if (groupIndex % 10 === 0) {
          groupIndex++;
        }
      });
    }

    if (node.nodeInfo?.canvasAppInstance) {
      exportNodesToTldraw(
        exportInfo,
        tldrawExport,
        tldrawGroup.id,
        node.nodeInfo.canvasAppInstance.elements
      );
    }
    index++;
    if (index % 10 === 0) {
      index++;
    }
  });

  index = 1;
  elements.forEach((element) => {
    const node = element as IConnectionNodeComponent<NodeInfo>;

    if (node.nodeType !== NodeType.Connection) {
      return;
    }
    if (!node.startNode || !node.endNode) {
      return;
    }

    let isRectThumb = false;
    if (
      node.startNode.thumbConnectors?.length === 1 &&
      node.startNode.thumbConnectors?.[0].thumbConnectionType ===
        ThumbConnectionType.startOrEnd
    ) {
      isRectThumb = true;
    }
    if (
      node.endNode.thumbConnectors?.length === 1 &&
      node.endNode.thumbConnectors?.[0].thumbConnectionType ===
        ThumbConnectionType.startOrEnd
    ) {
      isRectThumb = true;
    }
    if (isRectThumb) {
      const connection = structuredClone(tldrawEmptyArrowNode);
      connection.id = `shape:${node.id}`;
      connection.parentId = 'page:page';
      connection.x = node.x;
      connection.y = node.y;
      connection.meta = {
        nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo),
      };
      connection.props.start.x = 0;
      connection.props.start.y = 0;
      connection.props.end.x = (node.endX ?? 0) - node.x;
      connection.props.end.y = (node.endY ?? 0) - node.y;
      connection.index = `a${index.toString().padStart(8, '1')}`;
      tldrawExport.records.push(connection);
      index++;
      if (index % 10 === 0) {
        index++;
      }

      const connectionBindingStart = structuredClone(bindingStart);
      connectionBindingStart.id = `binding:${node.id}_binding_start`;
      connectionBindingStart.fromId = connection.id;
      connectionBindingStart.toId = `shape:${node.startNode.id}`;
      tldrawExport.records.push(connectionBindingStart);

      const connectionBindingEnd = structuredClone(bindingEnd);
      connectionBindingEnd.id = `binding:${node.id}_binding_end`;
      connectionBindingEnd.fromId = connection.id;
      connectionBindingEnd.toId = `shape:${node.endNode.id}`;
      tldrawExport.records.push(connectionBindingEnd);
      return;
    }
    const connection = structuredClone(tldrawEmptyArrowNode);
    connection.id = `shape:${node.id}`;
    connection.parentId = 'page:page';
    connection.x = node.x;
    connection.y = node.y;
    connection.meta = {
      nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo),
    };
    connection.props.start.x = 0;
    connection.props.start.y = 0;
    connection.props.end.x = (node.endX ?? 0) - node.x;
    connection.props.end.y = (node.endY ?? 0) - node.y;
    connection.index = `a${index.toString().padStart(8, '1')}`;
    tldrawExport.records.push(connection);
    index++;
    if (index % 10 === 0) {
      index++;
    }

    const connectionBindingStart = structuredClone(bindingStart);
    connectionBindingStart.id = `binding:${node.id}_binding_start`;
    connectionBindingStart.fromId = connection.id;
    connectionBindingStart.toId = `shape:${node.startNode.id}_thumb_${node.startNodeThumb?.thumbName}`;
    tldrawExport.records.push(connectionBindingStart);

    const connectionBindingEnd = structuredClone(bindingEnd);
    connectionBindingEnd.id = `binding:${node.id}_binding_end`;
    connectionBindingEnd.fromId = connection.id;
    connectionBindingEnd.toId = `shape:${node.endNode.id}_thumb_${node.endNodeThumb?.thumbName}`;
    tldrawExport.records.push(connectionBindingEnd);
  });
};

export const exportTldraw = (exportInfo: Exporter) => {
  const tldrawExport = structuredClone(tldrawEmptyFile);

  exportNodesToTldraw(
    exportInfo,
    tldrawExport,
    undefined,
    exportInfo.canvasApp.elements
  );
  exportInfo.downloadFile(
    JSON.stringify(tldrawExport),
    'tldraw.tldr',
    'application/json'
  );
};