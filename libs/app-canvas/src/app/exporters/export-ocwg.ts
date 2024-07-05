import {
  IConnectionNodeComponent,
  INodeComponent,
  BaseNodeInfo,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import { Exporter } from './Exporter';

import { BaseExporter } from './BaseExporter';
import { OCWGFile, OCWGNode } from './ocwg/ocwg-schema';
import { ocwgEmptyFile } from './ocwg/ocwg-empty-file';

interface OCWGInfo {
  index: number;
}

export class OCWGExporter extends BaseExporter<OCWGFile, OCWGInfo> {
  constructor(exportInfo: Exporter) {
    super(exportInfo);
  }

  override createExportFile(): OCWGFile {
    return structuredClone(ocwgEmptyFile);
  }

  override createExportInfoContext(): OCWGInfo {
    return {
      index: 1,
    };
  }

  override exportNode(
    _context: OCWGInfo,
    node: INodeComponent<BaseNodeInfo>,
    nodeInfo: BaseNodeInfo,
    nodeText: string,
    _isContainer: boolean,
    _isRectThumb: boolean,
    _parentId?: string
  ): string {
    const ocwgNode: OCWGNode = {
      id: `shape:${node.id}`,
      schema: '@code-flow-canvas/node',
      schema_version: '0.1',
      x: node.x,
      y: node.y,
      properties: {
        width: node.width ?? 0,
        height: node.height ?? 0,
        nodeInfo: nodeInfo,
      },
      fallback: nodeText,
    };
    if (this.file?.nodes) {
      this.file.nodes[ocwgNode.id] = ocwgNode;
    }
    return ocwgNode.id;
  }
  override exportThumb(
    _context: OCWGInfo,
    _thumb: IThumbNodeComponent<BaseNodeInfo>
  ): void {
    return;
  }

  override exportConnection(
    _context: OCWGInfo,
    nodeInfo: BaseNodeInfo,
    node: IConnectionNodeComponent<BaseNodeInfo>
  ): void {
    if (!node.startNode || !node.endNode) {
      return;
    }
    const ocwgNode: OCWGNode = {
      id: `shape:${node.id}`,
      schema: '@code-flow-canvas/connection',
      schema_version: '0.1',
      x: node.x,
      y: node.y,
      properties: {
        width: node.width ?? 0,
        height: node.height ?? 0,
        nodeInfo: nodeInfo,
      },
      fallback: 'connection',
    };
    if (this.file?.nodes) {
      this.file.nodes[ocwgNode.id] = ocwgNode;
    }
    return;
  }
  override exportMultiPortConnection(
    _context: OCWGInfo,
    nodeInfo: BaseNodeInfo,
    node: IConnectionNodeComponent<BaseNodeInfo>
  ): void {
    if (!node.startNode || !node.endNode) {
      return;
    }
    const ocwgNode: OCWGNode = {
      id: `connection:${node.id}`,
      schema: '@code-flow-canvas/connection',
      schema_version: '0.1',
      x: node.x,
      y: node.y,
      properties: {
        width: node.width ?? 0,
        height: node.height ?? 0,
        nodeInfo: nodeInfo,
        startNodeId: `shape:${node.startNode.id}`,
        endNodeId: `shape:${node.endNode.id}`,
      },
      fallback: 'connection',
    };
    if (this.file?.nodes) {
      this.file.nodes[ocwgNode.id] = ocwgNode;
    }
    return;
  }
}

export const exportOCWG = (exportInfo: Exporter) => {
  const tldrawExporter = new OCWGExporter(exportInfo);
  const file = tldrawExporter.convertToExportFile();
  exportInfo.downloadFile(
    JSON.stringify(file),
    'ocwg.ocwg',
    'application/json'
  );
};
