import { INodeComponent } from '@devhelpr/visual-programming-system';
import { NodeInfo, canvasAppReturnType } from '../types/node-info';

export const getNodeByVariableName = (
  variableName: string,
  canvasAppInstance: canvasAppReturnType
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
  canvasAppInstance: canvasAppReturnType
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
