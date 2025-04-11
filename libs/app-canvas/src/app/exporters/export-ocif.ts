import {
  IConnectionNodeComponent,
  INodeComponent,
  BaseNodeInfo,
  IThumbNodeComponent,
  GetNodeTaskFactory,
  ElementNodeMap,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { Exporter } from './Exporter';

import { BaseExporter } from './BaseExporter';
import { OCIFFile, OCIFNode } from './ocif/ocif-schema';
import { ocifEmptyFile } from './ocif/ocif-empty-file';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { getCurrentOCIF } from '../importers/ocif-importer';
import {
  ocifArrow,
  ocifRelationGroup,
  ocifToCodeFlowCanvas,
} from '../consts/ocif';

interface OCIFInfo {
  index: number;
}
export const nodeInfoPropertyName = '@code-flow-canvas/node-properties';
export const connectionNodeInfoPropertyName =
  '@code-flow-canvas/connection-properties';

export class OCIFExporter extends BaseExporter<OCIFFile, OCIFInfo> {
  constructor(
    exportInfo: Exporter,
    getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
  ) {
    super(exportInfo, getNodeTaskFactory);
  }

  override createExportFile(): OCIFFile {
    return structuredClone(ocifEmptyFile);
  }

  isOCIFNodeThatCodeFlowCanvasSupports(node: any): boolean {
    if (node.data && Array.isArray(node.data)) {
      const result = node.data.some(
        (d: any) => d.type === 'rect-node' || ocifToCodeFlowCanvas[d.type]
      );
      if (result) {
        return true;
      }
    }
    if (!node.data) {
      return true;
    }
    if (node.data && Array.isArray(node.data)) {
      return node.data.some(
        (d: any) =>
          d.type === nodeInfoPropertyName ||
          d.type === connectionNodeInfoPropertyName
      );
    }
    return false;
  }

  isValidCodeFlowCanvasNode(node: any): boolean {
    if (node.data && Array.isArray(node.data)) {
      return node.data.some(
        (d: any) =>
          d.type === nodeInfoPropertyName ||
          d.type === connectionNodeInfoPropertyName
      );
    }
    return false;
  }

  doesRootOCIFNodeExistInFlow(
    id: string,
    elements: ElementNodeMap<BaseNodeInfo>
  ): boolean {
    return elements.has(`${id}`);
  }

  getNodeFromElements = (
    id: string,
    elements: ElementNodeMap<BaseNodeInfo>
  ) => {
    return elements.get(id);
  };

  override mergeWithAdditionalInfo(
    elements: ElementNodeMap<BaseNodeInfo>
  ): void {
    const rootOCIF = getCurrentOCIF();
    if (!this.file || !rootOCIF) {
      return;
    }
    if (rootOCIF.resources) {
      this.file.resources = rootOCIF.resources;
    }
    if (rootOCIF.nodes) {
      rootOCIF.nodes.forEach((node: any) => {
        if (
          this.isOCIFNodeThatCodeFlowCanvasSupports(node) &&
          this.doesRootOCIFNodeExistInFlow(node.id, elements)
        ) {
          const codeFlowCanvasNode = this.file?.nodes.find(
            (n) => n.id === node.id
          );
          if (codeFlowCanvasNode && codeFlowCanvasNode.data) {
            console.log('export ocif node', codeFlowCanvasNode);
            node.data?.forEach((d: any) => {
              if (!codeFlowCanvasNode.data) {
                // purely for typescript
                return;
              }
              if (
                d.type !== nodeInfoPropertyName &&
                d.type !== connectionNodeInfoPropertyName &&
                d.type !== '@ocif/node/ports'
              ) {
                if (d.type === 'rect-node') {
                  const canvasNode = this.getNodeFromElements(
                    node.id,
                    elements
                  );
                  if (canvasNode) {
                    const nodeInfo = canvasNode.nodeInfo as any;

                    d.fillColor = nodeInfo?.fillColor ?? d.fillColor;
                    d.strokeColor = nodeInfo?.strokeColor ?? d.strokeColor;
                    d.strokeWidth = nodeInfo?.strokeWidth ?? d.strokeWidth;
                  }
                }
                codeFlowCanvasNode.data.push(d);
              }
            });
          }

          if (node.resource && codeFlowCanvasNode) {
            codeFlowCanvasNode.resource = node.resource;
          }
        } else if (
          !this.isValidCodeFlowCanvasNode(node) &&
          !this.doesRootOCIFNodeExistInFlow(node.id, elements)
        ) {
          this.file?.nodes.push(node);
        }
      });
    }
    if (rootOCIF.relations) {
      rootOCIF.relations.forEach((relation: any) => {
        if (!this.file?.relations.find((r) => r.id === relation.id)) {
          this.file?.relations.push(relation);
        }
      });
    }
    if (rootOCIF.schemas) {
      rootOCIF.schemas.forEach((schema: any) => {
        if (!this.file?.schemas.find((s) => s.uri === schema.uri)) {
          this.file?.schemas.push(schema);
        }
      });
    }
    if (rootOCIF.resources) {
      rootOCIF.resources.forEach((resource: any) => {
        if (!this.file?.resources.find((r) => r.uri === resource.uri)) {
          this.file?.resources.push(resource);
        }
      });
    }
  }

  override createExportInfoContext(): OCIFInfo {
    return {
      index: 1,
    };
  }

  override exportNode(
    _context: OCIFInfo,
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
            if (thumb.name && thumb.thumbType !== ThumbType.Center) {
              ports.push(thumb.name);
            }
          });
        }
      }
    }
    const portsNode: any[] = [];
    if (ports.length > 0) {
      portsNode.push({
        type: '@ocif/node/ports',
        ports: ports,
      });
    }
    const clonedNodeInfo = structuredClone(nodeInfo) as any;
    delete clonedNodeInfo.fillColor;
    delete clonedNodeInfo.strokeColor;
    delete clonedNodeInfo.strokeWidth;

    const ocifNode: OCIFNode = {
      id: `${node.id}`,
      position: [node.x, node.y],
      size: [node.width ?? 0, node.height ?? 0],
      data: [...portsNode],
      resource: `${node.id}-resource`,
    };
    if (nodeInfo.type === 'group') {
      // only export group as a relation
      if (
        node.nodeInfo?.isGroup &&
        this.file &&
        node.nodeInfo?.groupedNodeIds
      ) {
        const relation = {
          id: `${ocifNode.id}`,
          data: [
            {
              type: '@ocif/rel/group' as const,
              members: [...node.nodeInfo.groupedNodeIds],
            },
          ],
        };
        this.file.relations.push(relation);
      }
      return '';
    }
    if (
      ocifNode.data &&
      nodeInfo.type !== 'rect-node' &&
      nodeInfo.type !== 'oval-node'
    ) {
      ocifNode.data.push({
        ...clonedNodeInfo,
        type: nodeInfoPropertyName,
        nodeType: nodeInfo.type,
      });
    }
    if (this.file?.nodes) {
      this.file.nodes.push(ocifNode);
    }
    if (parentId && this.file) {
      const relation = this.file.relations.find((r) => r.id === parentId);
      if (
        relation &&
        relation.data.length > 0 &&
        relation.data[0].type === ocifRelationGroup
      ) {
        relation.data[0].members.push(ocifNode.id);
      } else {
        const relation = {
          id: parentId,
          data: [
            {
              type: '@ocif/rel/group' as const,
              members: [ocifNode.id],
            },
          ],
        };
        this.file.relations.push(relation);
      }
    }
    this.file?.resources.push({
      id: `${ocifNode.id}-resource`,
      representations: [{ 'mime-type': 'text/plain', content: nodeInfo.type }],
    });

    return ocifNode.id;
  }
  override exportThumb(
    _context: OCIFInfo,
    _thumb: IThumbNodeComponent<BaseNodeInfo>
  ): void {
    return;
  }

  override exportConnection(
    _context: OCIFInfo,
    _nodeInfo: BaseNodeInfo,
    node: IConnectionNodeComponent<BaseNodeInfo>
  ): void {
    if (!node.startNode || !node.endNode) {
      return;
    }
    const ocwgNode: OCIFNode = {
      id: `connection:${node.id}`,
      //position: [node.x, node.y],
      //size: [node.width ?? 0, node.height ?? 0],
      data: [
        {
          type: ocifArrow,
          start: [node.x, node.y],
          end: [node.endX ?? node.x, node.endY ?? 0],
          startMarker: 'none',
          endMarker: 'arrowhead',
          relation: `${node.id}-edge`,
        },
        // {
        //   ...nodeInfo,
        //   type: connectionNodeInfoPropertyName,
        //   nodeType: nodeInfo.type,
        //   lineType: (nodeInfo as any).lineType ?? 'Straight',
        //   startNode: {
        //     connected_to: `${node.startNode.id}`,
        //     port_name: node.startNodeThumb?.thumbName ?? 'output',
        //   },
        //   endNode: {
        //     connected_to: `${node.endNode.id}`,
        //     port_name: node.endNodeThumb?.thumbName ?? 'input',
        //   },
        // },
      ],
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocwgNode);
    }
    if (this.file?.relations) {
      {
        const relation = {
          id: `${node.id}-edge`,
          data: [
            {
              type: '@ocif/rel/edge' as const,
              start: `${node.startNode.id}`,
              end: `${node.endNode.id}`,
              node: `connection:${node.id}`,
              directed: true,
            },
          ],
        };
        this.file.relations.push(relation);
      }
    }
    return;
  }
  override exportMultiPortConnection(
    _context: OCIFInfo,
    nodeInfo: BaseNodeInfo,
    node: IConnectionNodeComponent<BaseNodeInfo>
  ): void {
    if (!node.startNode || !node.endNode) {
      return;
    }
    const ocifNode: OCIFNode = {
      id: `connection:${node.id}`,
      position: [node.x, node.y],
      size: [node.width ?? 0, node.height ?? 0],
      data: [
        {
          type: ocifArrow,
          start: [node.x, node.y],
          end: [node.endX ?? node.x, node.endY ?? 0],
          startMarker: 'none',
          endMarker: 'arrowhead',
          relation: `${node.id}-edge`,
        },
        {
          ...nodeInfo,
          type: connectionNodeInfoPropertyName,
          nodeType: nodeInfo.type,
          lineType: (nodeInfo as any).lineType ?? 'Straight',
          startNode: {
            connected_to: `${node.startNode.id}`,
            port_name: node.startNodeThumb?.thumbName,
          },
          endNode: {
            connected_to: `${node.endNode.id}`,
            port_name: node.endNodeThumb?.thumbName,
          },
        },
      ],
    };
    if (this.file?.nodes) {
      this.file.nodes.push(ocifNode);
    }
    if (this.file?.relations) {
      {
        const relation = {
          id: `${node.id}-edge`,
          data: [
            {
              type: '@ocif/rel/edge' as const,
              directed: true,
              start: `${node.startNode.id}`,
              end: `${node.endNode.id}`,
              node: `connection:${node.id}`,
            },
          ],
        };
        this.file.relations.push(relation);
      }
    }
    return;
  }
}

export const exportOCIF = (
  exportInfo: Exporter,
  getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
) => {
  const tldrawExporter = new OCIFExporter(exportInfo, getNodeTaskFactory);
  const file = tldrawExporter.convertToExportFile();
  exportInfo.downloadFile(
    JSON.stringify(file),
    'ocif.ocif',
    'application/json'
  );
};
