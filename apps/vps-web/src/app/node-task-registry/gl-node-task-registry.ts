import { NodeTaskFactory, NodeTypeRegistry } from './node-task-registry';
import { getCircleNode } from '../nodes-gl/circle-node';
import { getValueNode } from '../nodes-gl/value-node';
import { getColorNode } from '../nodes-gl/color-node';
import { getUVNode } from '../nodes-gl/uv-node';
import { getSineNode } from '../nodes-gl/sine';
import { getCosineNode } from '../nodes-gl/cosine';
import { getTimeNode } from '../nodes-gl/time';
import { getMultiplyNode } from '../nodes-gl/multiply';

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
  registerGLNodeFactory('color-node', getColorNode);
  registerGLNodeFactory('circle-node', getCircleNode);
  registerGLNodeFactory('value-node', getValueNode);
  registerGLNodeFactory('uv-node', getUVNode);
  registerGLNodeFactory('sine-node', getSineNode);
  registerGLNodeFactory('cosine-node', getCosineNode);
  registerGLNodeFactory('time-node', getTimeNode);
  registerGLNodeFactory('multiply-node', getMultiplyNode);
};

export const getGLNodeTaskFactory = (name: string) => {
  return glNodeTaskRegistry[name] ?? false;
};
