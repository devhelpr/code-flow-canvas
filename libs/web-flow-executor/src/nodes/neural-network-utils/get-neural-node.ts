import {
  CanvasAppInstance,
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

export const getNodeByNeuralLayerName = (
  name: string,
  canvasAppInstance: CanvasAppInstance<NodeInfo>
): INodeComponent<NodeInfo> | undefined => {
  let node: INodeComponent<NodeInfo> | undefined = undefined;
  Array.from(canvasAppInstance.elements).every((itemPair) => {
    const element = itemPair![1];
    if (element.nodeInfo?.formValues?.['neural-layer-name'] === name) {
      if (
        element?.nodeInfo?.type &&
        [
          'neural-node-input-layer',
          'neural-node-hidden-layer',
          'neural-node-output-layer',
        ].includes(element.nodeInfo.type)
      ) {
        node = element as INodeComponent<NodeInfo>;
        return false;
      }
    }
    return true;
  });
  return node;
};

export const getNodesByNeuralLayerType = (
  nodeType: string,
  canvasAppInstance: CanvasAppInstance<NodeInfo>
): IRectNodeComponent<NodeInfo>[] => {
  const nodes: IRectNodeComponent<NodeInfo>[] = [];
  Array.from(canvasAppInstance.elements).every((itemPair: any) => {
    const element = itemPair![1] as unknown as IRectNodeComponent<NodeInfo>;
    if (element.nodeInfo?.type === nodeType) {
      nodes.push(element as IRectNodeComponent<NodeInfo>);
    }
    return true;
  });
  return nodes;
};

export const learningRate = 0.01;
