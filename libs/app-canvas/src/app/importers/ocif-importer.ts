import { Flow } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import {
  connectionNodeInfoPropertyName,
  nodeInfoPropertyName,
} from '../exporters/export-ocwg';

let rootOCIF: any = undefined;

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
    delete nodeInfo.type;
    nodeInfo.type = nodeInfo.nodeType;
    delete nodeInfo.nodeType;
    return nodeInfo;
  }
  return false;
}

function getConnectionInfoFromOCIFNode(node: any): any | false {
  const nodeInfo = node.data.find(
    (d: any) => d.type === connectionNodeInfoPropertyName
  );
  if (nodeInfo) {
    delete nodeInfo.type;
    nodeInfo.type = nodeInfo.nodeType;
    delete nodeInfo.nodeType;
    return {
      endX: node.position[0],
      endY: node.position[1],
      startNodeId: nodeInfo.start.connected_to,
      endNodeId: nodeInfo.end.connected_to,
      startThumbName: nodeInfo.start.port_name,
      endThumbName: nodeInfo.end.port_name,
      lineType: 'BezierCubic',
      layer: 1,
      nodeInfo: {},
    };
  }
  return false;
}

export const importOCIF = (ocif: any) => {
  rootOCIF = ocif;
  const flow: Flow<NodeInfo> = {
    schemaType: 'ocif',
    schemaVersion: '0.1',
    id: '1234',
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
      } else if (!node.data) {
        flow.flows['flow'].nodes.push({
          id: node.id,
          x: node.position[0],
          y: node.position[1],
          nodeType: 'Shape',
          nodeInfo: {
            type: 'expression',
          },
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
