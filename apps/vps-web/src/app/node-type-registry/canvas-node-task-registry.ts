import { NodeInfo } from '../types/node-info';
import { NodeTaskFactory, NodeTypeRegistry } from './node-type-registry';

export const canvasNodeTaskRegistry: NodeTypeRegistry<NodeInfo> = {};

export const registerNodeFactory = (
  name: string,
  nodeFactory: NodeTaskFactory<NodeInfo>
) => {
  canvasNodeTaskRegistry[name] = nodeFactory;
};
export const getNodeFactoryNames = () => {
  return Object.keys(canvasNodeTaskRegistry[0]);
};
