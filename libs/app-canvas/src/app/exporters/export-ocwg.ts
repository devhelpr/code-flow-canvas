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
      this.file.nodes.push(ocwgNode);
    }
    if (parentId && this.file) {
      const relation = this.file.relations.find((r) => r.name === parentId);
      if (relation) {
        relation.members.push(ocwgNode.id);
      } else {
        const relation = {
          schema: '@ocwg/set' as const,
          schema_version: '0.1',
          members: [ocwgNode.id],
          name: parentId,
        };
        this.file.relations.push(relation);
      }
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
          port_name: 'output',
        },
        end: {
          connected_to: `shape:${node.endNode.id}`,
          port_name: 'input',
        },
      },
      fallback: 'connection',
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocwgNode);
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
          port_name: node.startNodeThumb?.thumbName,
        },
        end: {
          connected_to: `shape:${node.endNode.id}`,
          port_name: node.endNodeThumb?.thumbName,
        },
      },
      fallback: 'connection',
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocwgNode);
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
