import {
  FlowCanvasInstance,
  INodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getNodeByVariableName = (
  variableName: string,
  canvasAppInstance: FlowCanvasInstance<NodeInfo>
): INodeComponent<NodeInfo> | undefined => {
  let node: INodeComponent<NodeInfo> | undefined = undefined;
  Array.from(canvasAppInstance.elements).every((itemPair) => {
    const element = itemPair[1];
    if (element.nodeInfo?.formValues?.variableName === variableName) {
      node = element as INodeComponent<NodeInfo>;
      return false;
    }
    return true;
  });
  return node;
};

export const getNodeByFunctionName = (
  functionName: string,
  canvasAppInstance: FlowCanvasInstance<NodeInfo>
): INodeComponent<NodeInfo> | undefined => {
  let node: INodeComponent<NodeInfo> | undefined = undefined;
  Array.from(canvasAppInstance.elements).every((itemPair) => {
    const element = itemPair[1];
    if (element.nodeInfo?.formValues?.node === functionName) {
      node = element as INodeComponent<NodeInfo>;
      return false;
    }
    return true;
  });
  return node;
};

export const getNodesByNodeType = (
  taskType: string,
  canvasAppInstance: FlowCanvasInstance<NodeInfo>
): INodeComponent<NodeInfo> | undefined => {
  let node: INodeComponent<NodeInfo> | undefined = undefined;
  Array.from(canvasAppInstance.elements).every((itemPair) => {
    const element = itemPair[1];
    if (element.nodeInfo?.type === taskType) {
      node = element as INodeComponent<NodeInfo>;
      return false;
    }
    return true;
  });
  return node;
};
