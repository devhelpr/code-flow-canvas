import {
  FlowNode,
  IConnectionNodeComponent,
  IRectNodeComponent,
} from '../interfaces';
import { BaseNodeInfo } from '../types/base-node-info';

export const cleanupNodeInfoForSerializing = <T extends BaseNodeInfo>(
  nodeInfo: T | undefined
) => {
  const nodeInfoCopy: any = {};
  if (nodeInfo) {
    for (const key in nodeInfo) {
      if (
        typeof (nodeInfo as any)[key] !== 'function' &&
        key !== 'formElements' &&
        key !== 'canvasAppInstance' &&
        key !== 'stateMachine' &&
        key !== 'compileInfo' &&
        key !== 'outputConnectionInfo' &&
        key !== 'meta'
      ) {
        let value = (nodeInfo as any)[key];
        if (key === 'decorators' && value) {
          const decorators: any[] = [];
          for (const decorator of value) {
            decorators.push({
              taskType: decorator.taskType,
              formValues: decorator.formValues,
              executeOrder: decorator.executeOrder,
            });
          }
          value = decorators;
        }
        nodeInfoCopy[key] = value;
      }
    }
  }
  return nodeInfoCopy;
};

export const mapConnectionToFlowNode = <T extends BaseNodeInfo>(
  connection: IConnectionNodeComponent<T>
): FlowNode<T> => {
  return {
    id: connection.id,
    x: connection.x,
    y: connection.y,
    endX: connection.endX,
    endY: connection.endY,
    startNodeId: connection.startNode?.id,
    endNodeId: connection.endNode?.id,
    startThumbName: connection.startNodeThumb?.thumbName,
    endThumbName: connection.endNodeThumb?.thumbName,
    startThumbIdentifierWithinNode:
      connection.startNodeThumb?.thumbIdentifierWithinNode,
    endThumbIdentifierWithinNode:
      connection.endNodeThumb?.thumbIdentifierWithinNode,
    lineType: connection.lineType,
    nodeType: connection.nodeType,
    layer: connection.layer ?? 1,
    nodeInfo: cleanupNodeInfoForSerializing(connection.nodeInfo),
  };
};

export const mapShapeNodeToFlowNode = <T extends BaseNodeInfo>(
  node: IRectNodeComponent<T>
): FlowNode<T> => {
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    nodeType: node.nodeType,
    nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo),
  };
};
