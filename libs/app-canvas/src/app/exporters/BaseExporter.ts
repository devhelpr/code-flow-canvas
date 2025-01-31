import {
  ElementNodeMap,
  IConnectionNodeComponent,
  INodeComponent,
  NodeType,
  ThumbConnectionType,
  cleanupNodeInfoForSerializing,
  BaseNodeInfo,
  IThumbNodeComponent,
  GetNodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { Exporter } from './Exporter';
import { ExportFile } from './export-interface/core-export';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export abstract class BaseExporter<T extends ExportFile, X> {
  constructor(
    readonly exportInfo: Exporter,
    readonly getNodeTaskFactory: GetNodeTaskFactory<NodeInfo>
  ) {
    //
  }
  file?: T;

  protected createExportFile(): T {
    throw new Error('Method not implemented.');
  }
  protected mergeWithAdditionalInfo(
    _elements: ElementNodeMap<BaseNodeInfo>
  ): void {
    //
  }
  convertToExportFile(): T {
    this.file = this.createExportFile();
    this.exportNodes(undefined, this.exportInfo.canvasApp.elements);

    return this.file;
  }

  protected createExportInfoContext(): X {
    throw new Error('Method not implemented.');
  }

  private exportNodes(
    parentId: undefined | string,
    elements: ElementNodeMap<BaseNodeInfo>
  ): void {
    const contextInfo = this.createExportInfoContext();
    elements.forEach((element) => {
      const node = element as INodeComponent<BaseNodeInfo>;

      if (node.nodeType === NodeType.Connection) {
        return;
      }
      const cleanNodeInfo = cleanupNodeInfoForSerializing(node.nodeInfo);

      let additionalData = '';
      const fieldName = node.nodeInfo?.formElements?.[0]?.fieldName;
      if (fieldName) {
        const value = node.nodeInfo?.formValues?.[fieldName];
        if (value) {
          additionalData = `${value}`;
        }
      }
      let nodeText = '';
      if (node.nodeInfo?.isComposition && node.nodeInfo?.compositionId) {
        const composition =
          this.exportInfo.canvasApp.compositons.getComposition(
            node.nodeInfo?.compositionId
          );
        if (composition) {
          nodeText = composition.name;
        } else {
          nodeText = 'Composition';
        }
      } else {
        nodeText = node.nodeInfo?.type ?? '';
        if (additionalData) {
          nodeText += `\n${additionalData}`;
        }
      }

      const isContainer = node.nodeInfo?.canvasAppInstance ? true : false;
      let isRectThumb = false;
      if (
        node.thumbConnectors?.length === 1 &&
        node.thumbConnectors[0].thumbConnectionType ===
          ThumbConnectionType.startOrEnd
      ) {
        isRectThumb = true;
      }

      const id = this.exportNode(
        contextInfo,
        node,
        cleanNodeInfo,
        nodeText,
        isContainer,
        isRectThumb,
        parentId
      );
      if (!isRectThumb) {
        node.thumbConnectors?.forEach((thumb) => {
          this.exportThumb(contextInfo, thumb);
        });
      }

      if (node.nodeInfo?.canvasAppInstance) {
        this.exportNodes(id, node.nodeInfo.canvasAppInstance.elements);
      }
    });

    const connectionContextInfo = this.createExportInfoContext();
    elements.forEach((element) => {
      const node = element as IConnectionNodeComponent<BaseNodeInfo>;

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
      const nodeInfo = cleanupNodeInfoForSerializing(node.nodeInfo);
      if (isRectThumb) {
        this.exportConnection(connectionContextInfo, nodeInfo, node);
        return;
      }
      this.exportMultiPortConnection(connectionContextInfo, nodeInfo, node);
    });

    this.mergeWithAdditionalInfo(elements);
  }
  protected exportConnection(
    _contextInfo: X,
    _nodeInfo: BaseNodeInfo,
    _node: IConnectionNodeComponent<BaseNodeInfo>
  ): void {
    throw new Error('Method not implemented.');
  }
  protected exportMultiPortConnection(
    _contextInfo: X,
    _nodeInfo: BaseNodeInfo,
    _node: IConnectionNodeComponent<BaseNodeInfo>
  ): void {
    throw new Error('Method not implemented.');
  }

  protected exportNode(
    _contextInfo: X,
    _node: INodeComponent<BaseNodeInfo>,
    _nodeInfo: BaseNodeInfo,
    _nodeText: string,
    _isContainer: boolean,
    _isRectThumb: boolean,
    _parentId?: string
  ): string {
    throw new Error('Method not implemented.');
  }
  protected exportThumb(
    _contextInfo: X,
    _thumb: IThumbNodeComponent<BaseNodeInfo>
  ): void {
    throw new Error('Method not implemented.');
  }
}
