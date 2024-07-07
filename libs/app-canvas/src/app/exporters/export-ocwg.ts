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
const nodeInfoPropertyName = '@code-flow-canvas/node-properties';

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
    parentId?: string
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
        [nodeInfoPropertyName]: nodeInfo,
      },
      fallback: nodeText,
    };
    if (this.file?.nodes) {
      this.file.nodes[ocwgNode.id] = ocwgNode;
    }
    if (parentId && this.file) {
      if (!this.file.relations[parentId]) {
        this.file.relations[parentId] = {
          schema: '@ocwg/set',
          schema_version: '0.1',
          members: [],
          name: parentId,
        };
      }

      this.file.relations[parentId].members.push(ocwgNode.id);
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
        [nodeInfoPropertyName]: nodeInfo,
        start: {
          connected_to: `shape:${node.startNode.id}`,
        },
        end: {
          connected_to: `shape:${node.endNode.id}`,
        },
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
        [nodeInfoPropertyName]: nodeInfo,
        start: {
          connected_to: `shape:${node.startNode.id}`,
          portName: node.startNodeThumb?.thumbName,
        },
        end: {
          connected_to: `shape:${node.endNode.id}`,
          portName: node.endNodeThumb?.thumbName,
        },
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
