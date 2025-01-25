import { Flow } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import {
  connectionNodeInfoPropertyName,
  nodeInfoPropertyName,
} from '../exporters/export-ocwg';
import { ocifSchema } from '../consts/ocif';

let rootOCIF: any = undefined;

function isSupportedOCIFNode(ocifNode: any): boolean {
  return (
    ocifNode.data &&
    Array.isArray(ocifNode.data) &&
    ocifNode.data.some((d: any) => d.type === 'rect-node')
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
      endX: node.position[0],
      endY: node.position[1],
      startNodeId: clonedNodeInfo.start.connected_to,
      endNodeId: clonedNodeInfo.end.connected_to,
      startThumbName: clonedNodeInfo.start.port_name,
      endThumbName: clonedNodeInfo.end.port_name,
      lineType: 'BezierCubic',
      layer: 1,
      nodeInfo: {},
    };
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
        const data = getExtenstionData(node, 'rect-node');
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
            strokeColor: data?.strokeColor ?? 'black',
            fillColor: data?.fillColor ?? 'white',
            strokeWidth: data?.strokeWidth ?? 2,
            text: text,
          } as any,
        });
        console.log('ocif node size', node.size);
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
