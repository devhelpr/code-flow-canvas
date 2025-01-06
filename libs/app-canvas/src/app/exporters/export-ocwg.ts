import {
  IConnectionNodeComponent,
  INodeComponent,
  BaseNodeInfo,
  IThumbNodeComponent,
  GetNodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { Exporter } from './Exporter';

import { BaseExporter } from './BaseExporter';
import { OCWGFile, OCWGNode } from './ocwg/ocwg-schema';
import { ocwgEmptyFile } from './ocwg/ocwg-empty-file';
import { NodeInfo } from '@devhelpr/web-flow-executor';

interface OCWGInfo {
  index: number;
}
const nodeInfoPropertyName = '@code-flow-canvas/node-properties';

export class OCWGExporter extends BaseExporter<OCWGFile, OCWGInfo> {
  constructor(
    exportInfo: Exporter,
    getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
  ) {
    super(exportInfo, getNodeTaskFactory);
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
    _nodeText: string,
    _isContainer: boolean,
    _isRectThumb: boolean,
    parentId?: string
  ): string {
    const ports: string[] = [];
    if (nodeInfo.type) {
      const factory = this.getNodeTaskFactory(nodeInfo.type);
      if (factory) {
        const nodeTask = factory(() => {
          //
        });
        if (nodeTask) {
          nodeTask.thumbs?.forEach((thumb) => {
            if (thumb.name) {
              ports.push(thumb.name);
            }
          });
        }
      }
    }
    const portsNode: any[] = [];
    if (ports.length > 0) {
      portsNode.push({
        type: '@ocwg/node/ports',
        ports: ports,
      });
    }
    const ocwgNode: OCWGNode = {
      id: `shape:${node.id}`,
      position: [node.x, node.y],
      size: [node.width ?? 0, node.height ?? 0],
      data: [
        {
          ...nodeInfo,
          type: nodeInfoPropertyName,
          nodeType: nodeInfo.type,
        },
        ...portsNode,
      ],
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocwgNode);
    }
    if (parentId && this.file) {
      const relation = this.file.relations.find((r) => r.id === parentId);
      if (relation && relation.type === '@ocwg/set') {
        relation.members.push(ocwgNode.id);
      } else {
        const relation = {
          type: '@ocwg/set' as const,
          members: [ocwgNode.id],
          id: parentId,
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
      position: [node.x, node.y],
      size: [node.width ?? 0, node.height ?? 0],
      data: [
        {
          ...nodeInfo,
          type: nodeInfoPropertyName,
          nodeType: nodeInfo.type,
          start: {
            connected_to: `shape:${node.startNode.id}`,
            port_name: 'output',
          },
          end: {
            connected_to: `shape:${node.endNode.id}`,
            port_name: 'input',
          },
        },
      ],
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocwgNode);
    }
    if (this.file?.relations) {
      {
        const relation = {
          type: '@ocwg/rel/edge' as const,
          id: `${node.id}-edge`,
          from: `shape:${node.startNode.id}`,
          to: `shape:${node.endNode.id}`,
          directed: true,
        };
        this.file.relations.push(relation);
      }
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
      position: [node.x, node.y],
      size: [node.width ?? 0, node.height ?? 0],
      data: [
        {
          ...nodeInfo,
          type: nodeInfoPropertyName,
          nodeType: nodeInfo.type,
          start: {
            connected_to: `shape:${node.startNode.id}`,
            port_name: node.startNodeThumb?.thumbName,
          },
          end: {
            connected_to: `shape:${node.endNode.id}`,
            port_name: node.endNodeThumb?.thumbName,
          },
        },
      ],
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocwgNode);
    }
    if (this.file?.relations) {
      {
        const relation = {
          id: `${node.id}-edge`,
          type: '@ocwg/rel/edge' as const,
          directed: true,
          from: `shape:${node.startNode.id}`,
          to: `shape:${node.endNode.id}`,
        };
        this.file.relations.push(relation);
      }
    }
    return;
  }
}

export const exportOCWG = (
  exportInfo: Exporter,
  getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
) => {
  const tldrawExporter = new OCWGExporter(exportInfo, getNodeTaskFactory);
  const file = tldrawExporter.convertToExportFile();
  exportInfo.downloadFile(
    JSON.stringify(file),
    'ocwg.ocwg',
    'application/json'
  );
};
