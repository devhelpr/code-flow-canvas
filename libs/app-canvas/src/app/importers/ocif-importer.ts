import { Flow } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import {
  connectionNodeInfoPropertyName,
  nodeInfoPropertyName,
} from '../exporters/export-ocif';
import { ocifArrow, ocifSchema, ocifToCodeFlowCanvas } from '../consts/ocif';
import { OCIFEdgeRelationExtension } from '../interfaces/ocif';

let rootOCIF: any = undefined;

function isSupportedOCIFNode(ocifNode: any): boolean {
  return (
    ocifNode.data &&
    Array.isArray(ocifNode.data) &&
    ocifNode.data.some(
      (d: any) => d.type === 'rect-node' || ocifToCodeFlowCanvas[d.type]
    )
  );
}

function getFirstNodeType(ocifNode: any): string {
  return ocifNode.data?.[0].type ?? '';
}

function isSupportedOCIFConnectionNode(ocifNode: any): boolean {
  return (
    ocifNode.data &&
    Array.isArray(ocifNode.data) &&
    ocifNode.data.some(
      (d: any) => d.type === 'arrow-node' || d.type === ocifArrow
    )
  );
}

function getExtenstionData(ocifNode: any, extensionName: string): any {
  return ocifNode.data.find((d: any) => d.type === extensionName);
}

function isValidCodeFlowCanvasNode(node: any): boolean {
  if (node.data && Array.isArray(node.data)) {
    return node.data.some((d: any) => d.type === nodeInfoPropertyName);
  }
  return false;
}
function isValidCodeFlowCanvasConnection(node: any): boolean {
  if (node.data && Array.isArray(node.data)) {
    return node.data.some(
      (d: any) => d.type === connectionNodeInfoPropertyName
    );
  }
  return false;
}

function getEdgeRelationById(
  ocif: any,
  relationId: string
): OCIFEdgeRelationExtension | undefined {
  if (!ocif.relations || !relationId) {
    return undefined;
  }
  const data = ocif.relations.find((r: any) => r.id === relationId);
  if (data) {
    const extension = getExtenstionData(data, '@ocif/rel/edge');
    return {
      type: extension.type,
      start: extension.start,
      end: extension.end,
      rel: extension.rel,
      node: extension.node,
    };
  }
  return undefined;
}

function getNodeInfoFromOCIFNode(node: any): NodeInfo | false {
  const nodeInfo = node.data.find((d: any) => d.type === nodeInfoPropertyName);
  if (nodeInfo) {
    const clonedNodeInfo = structuredClone(nodeInfo);
    delete clonedNodeInfo.type;
    clonedNodeInfo.type = clonedNodeInfo.nodeType;
    delete clonedNodeInfo.nodeType;
    return clonedNodeInfo;
  }
  return false;
}

function getConnectionInfoFromOCIFNode(node: any): any | false {
  const nodeInfo = node.data.find(
    (d: any) => d.type === connectionNodeInfoPropertyName
  );

  if (nodeInfo) {
    const clonedNodeInfo = structuredClone(nodeInfo);
    delete clonedNodeInfo.type;
    clonedNodeInfo.type = clonedNodeInfo.nodeType;
    delete clonedNodeInfo.nodeType;
    return {
      endX: node.position?.[0],
      endY: node.position?.[1],
      startNodeId: clonedNodeInfo.startNode.connected_to,
      endNodeId: clonedNodeInfo.endNode.connected_to,
      startThumbName: clonedNodeInfo.startNode.port_name,
      endThumbName: clonedNodeInfo.endNode.port_name,
      lineType: clonedNodeInfo.lineType ?? 'BezierCubic',
      layer: 1,
      nodeInfo: {},
    };
  } else {
    if (node.data && Array.isArray(node.data)) {
      const arrowData = getExtenstionData(node, ocifArrow);
      const data = getEdgeRelationById(rootOCIF, arrowData.relation);
      if (data) {
        return {
          x: data.start?.[0],
          y: data.start?.[1],
          endX: data.end?.[0],
          endY: data.end?.[1],
          startNodeId: data.start,
          endNodeId: data.end,
          startThumbName: 'input-output',
          endThumbName: 'input-output',
          lineType: 'Straight',
          layer: 1,
          nodeInfo: {},
        };
      }
    }
  }
  return false;
}

export const getResourceById = (ocif: any, resourceId: string) => {
  if (!ocif.resources || !resourceId) {
    return undefined;
  }
  return ocif.resources.find((r: any) => r.id === resourceId);
};

export const getTextRepresentation = (resource: any): string | false => {
  if (!resource || !resource.representations) {
    return false;
  }
  return (
    resource.representations.find((r: any) => r['mime-type'] === 'text/plain')
      ?.content ?? false
  );
};

export const importOCIF = (ocif: any) => {
  rootOCIF = ocif;
  const flow: Flow<NodeInfo> = {
    schemaType: 'ocif',
    schemaVersion: '0.1',
    id: '1234',
    ocif: structuredClone(ocif),
    flows: {
      ['flow']: {
        flowType: 'flow',
        nodes: [],
      },
    },
    compositions: {},
  };
  if (ocif.nodes && Array.isArray(ocif.nodes)) {
    ocif.nodes.forEach((node: any) => {
      if (isValidCodeFlowCanvasNode(node)) {
        const nodeInfo = getNodeInfoFromOCIFNode(node);
        if (nodeInfo) {
          flow.flows['flow'].nodes.push({
            id: node.id,
            x: node.position[0],
            y: node.position[1],
            width: node.size?.[0] ?? 100,
            height: node.size?.[1] ?? 100,
            nodeInfo: nodeInfo,
            nodeType: 'Shape',
          });
        }
      } else if (isValidCodeFlowCanvasConnection(node)) {
        const connection = getConnectionInfoFromOCIFNode(node);
        if (connection) {
          flow.flows['flow'].nodes.push({
            id: node.id,
            x: node.position[0],
            y: node.position[1],
            nodeType: 'Connection',
            ...connection,
          });
        }
      } else if (node.data && isSupportedOCIFNode(node)) {
        const dataType = getFirstNodeType(node);
        const data = getExtenstionData(node, dataType);
        let text = '';
        const resource = getResourceById(ocif, node.resource);
        if (resource) {
          const textRepresentation = getTextRepresentation(resource);
          if (textRepresentation) {
            text = textRepresentation;
          }
        }
        flow.flows['flow'].nodes.push({
          id: node.id,
          x: node.position[0],
          y: node.position[1],
          width: node.size?.[0] ?? 100,
          height: node.size?.[1] ?? 100,
          nodeType: 'Shape',
          nodeInfo: {
            type: ocifToCodeFlowCanvas[dataType] ?? 'rect-node',
            strokeColor: data?.strokeColor ?? 'black',
            fillColor: data?.fillColor ?? 'white',
            strokeWidth: data?.strokeWidth ?? 2,
            text: text,
          } as any,
        });
        console.log('ocif node size', node.size);
      } else if (node.data && isSupportedOCIFConnectionNode(node)) {
        const connection = getConnectionInfoFromOCIFNode(node);
        if (connection) {
          flow.flows['flow'].nodes.push({
            id: node.id,
            x: node.position?.[0],
            y: node.position?.[1],
            nodeType: 'Connection',
            ...connection,
          });
        }
      } else if (!node.data) {
        let text = '';
        const resource = getResourceById(ocif, node.resource);
        if (resource) {
          const textRepresentation = getTextRepresentation(resource);
          if (textRepresentation) {
            text = textRepresentation;
          }
        }
        flow.flows['flow'].nodes.push({
          id: node.id,
          x: node.position[0],
          y: node.position[1],
          width: node.size?.[0] ?? 100,
          height: node.size?.[1] ?? 100,
          nodeType: 'Shape',
          nodeInfo: {
            type: 'rect-node',
            strokeColor: 'black',
            fillColor: 'white',
            strokeWidth: 2,
            text: text,
          } as any,
        });
      }
    });
  }

  if (ocif.relations) {
    ocif.relations.forEach((relation: any) => {
      if (relation && relation.data) {
        const group = getExtenstionData(relation, '@ocif/rel/group');
        if (group) {
          flow.flows['flow'].nodes.push({
            id: relation.id,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            nodeType: 'Shape',
            nodeInfo: {
              type: 'group',
              groupedNodeIds: group.members,
            } as any,
          });
        }
      }
    });
  }
  return flow;
};

export const isValidOCIF = (ocif: any) => {
  if (!ocif.ocif) {
    return false;
  }
  if (!ocif.ocif.startsWith(ocifSchema)) {
    return false;
  }
  if (ocif.nodes && !Array.isArray(ocif.nodes)) {
    return false;
  }
  if (ocif.relations && !Array.isArray(ocif.relations)) {
    return false;
  }

  return true;
};

export const clearOCIF = () => {
  rootOCIF = undefined;
};

export const getCurrentOCIF = () => {
  return rootOCIF;
};

export const setOCIF = (ocif: any) => {
  rootOCIF = ocif;
};
