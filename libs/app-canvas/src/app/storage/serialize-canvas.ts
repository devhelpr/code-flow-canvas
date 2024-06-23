import {
  ElementNodeMap,
  Flow,
  IConnectionNodeComponent,
  INodeComponent,
  NodeType,
  Composition,
  cleanupNodeInfoForSerializing,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export type SerializedFlow = ReturnType<typeof serializeElementsMap>;

export const serializeElementsMap = (elements: ElementNodeMap<NodeInfo>) => {
  const filteredElements = Array.from(elements).filter((entry) => {
    const obj = entry[1] as INodeComponent<NodeInfo>;
    if (obj.nodeType === NodeType.Connection) {
      const connection = obj as unknown as IConnectionNodeComponent<NodeInfo>;
      if (!connection.isAnnotationConnection) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  });
  const nodesList = Array.from(filteredElements, function (entry) {
    const obj = entry[1] as INodeComponent<NodeInfo>;
    if (obj.nodeType === NodeType.Connection) {
      const connection = obj as unknown as IConnectionNodeComponent<NodeInfo>;
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
        nodeType: obj.nodeType,
        layer: connection.layer ?? 1,
        nodeInfo: cleanupNodeInfoForSerializing(connection.nodeInfo),
      };
    }

    let elements: any = undefined;
    if (obj.nodeInfo && obj.nodeInfo.canvasAppInstance) {
      elements = serializeElementsMap(obj.nodeInfo.canvasAppInstance.elements);

      console.log('SUB ELEMENTS FOUND ', elements);
    }
    return {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      nodeType: obj.nodeType,
      elements,
      nodeInfo: cleanupNodeInfoForSerializing(obj.nodeInfo),
    };
  });
  return nodesList;
};

export const exportFlowToJson = <T>(
  id: string,
  nodesList: ReturnType<typeof serializeElementsMap>,
  compositions: Record<string, Composition<T>>
) => {
  const flow: Flow<T> = {
    schemaType: 'flow',
    schemaVersion: '0.0.1',
    id: id,
    flows: {
      flow: {
        flowType: 'flow',
        nodes: nodesList,
      },
    },
    compositions: compositions,
  };
  return JSON.stringify(flow, null, 2);
};

export const serializeCompositions = <T>(
  compositions: Record<string, Composition<T>>
) => {
  const compositionsMap: Record<string, Composition<T>> = {};
  Object.entries(compositions).forEach(([_id, composition]) => {
    compositionsMap[composition.id] = {
      id: composition.id,
      name: composition.name,
      nodes: composition.nodes.map((node) => {
        return node;
        // if (node.nodeType === NodeType.Connection) {
        //   const connection =
        //     node as unknown as IConnectionNodeComponent<NodeInfo>;
        //   return {
        //     id: connection.id,
        //     x: connection.x,
        //     y: connection.y,
        //     endX: connection.endX,
        //     endY: connection.endY,
        //     startNodeId: connection.startNode?.id,
        //     endNodeId: connection.endNode?.id,
        //     startThumbName: connection.startNodeThumb?.thumbName,
        //     endThumbName: connection.endNodeThumb?.thumbName,
        //     startThumbIdentifierWithinNode:
        //       connection.startNodeThumb?.thumbIdentifierWithinNode,
        //     endThumbIdentifierWithinNode:
        //       connection.endNodeThumb?.thumbIdentifierWithinNode,
        //     lineType: connection.lineType,
        //     nodeType: node.nodeType,
        //     layer: connection.layer ?? 1,
        //     nodeInfo: cleanupNodeInfoForSerializing(connection.nodeInfo),
        //   };
        // }
        // return {
        //   id: node.id,
        //   x: node.x,
        //   y: node.y,
        //   width: node.width,
        //   height: node.height,
        //   nodeType: node.nodeType,
        //   nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo as NodeInfo),
        // };
      }),
      thumbs: composition.thumbs,
      inputNodes:
        composition.inputNodes?.map((node) => {
          return node;
          // return {
          //   id: node.id,
          //   x: node.x,
          //   y: node.y,
          //   width: node.width,
          //   height: node.height,
          //   nodeType: node.nodeType,
          //   nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo as NodeInfo),
          // };
        }) ?? [],
      outputNodes:
        composition.outputNodes?.map((node) => {
          return node;
          // return {
          //   id: node.id,
          //   x: node.x,
          //   y: node.y,
          //   width: node.width,
          //   height: node.height,
          //   nodeType: node.nodeType,
          //   nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo as NodeInfo),
          // };
        }) ?? [],
    };
  });
  return compositionsMap;
};
