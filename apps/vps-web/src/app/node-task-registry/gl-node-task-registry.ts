import { NodeTaskFactory, NodeTypeRegistry } from './node-task-registry';
import { getTestNode } from '../nodes-gl/test-node';
import { getCircleNode } from '../nodes-gl/circle-node';

export const glNodeTaskRegistry: NodeTypeRegistry<any> = {};

export const registerGLNodeFactory = (
  name: string,
  nodeFactory: NodeTaskFactory<any>
) => {
  glNodeTaskRegistry[name] = nodeFactory;
};
export const getGLNodeFactoryNames = () => {
  return Object.keys(glNodeTaskRegistry).sort();
};

export const setupGLNodeTaskRegistry = () => {
  registerGLNodeFactory('test-node', getTestNode);
  registerGLNodeFactory('circle-node', getCircleNode);
};

export const getGLNodeTaskFactory = (name: string) => {
  return glNodeTaskRegistry[name] ?? false;
};
