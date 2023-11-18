import { NodeTaskFactory, NodeTypeRegistry } from './node-task-registry';
import { getCircleNode } from '../nodes-gl/circle-node';
import { getValueNode } from '../nodes-gl/value-node';
import { getColorNode } from '../nodes-gl/color-node';
import { getSineNode } from '../nodes-gl/sine';
import { getCosineNode } from '../nodes-gl/cosine';
import { getTimeNode } from '../nodes-gl/time';
import { getMultiplyNode } from '../nodes-gl/multiply';
import { getBackgroundColorNode } from '../nodes-gl/background-color-node';
import { getUVNode } from '../nodes-gl/uv-node';
import { get } from 'http';
import { getAdditionNode } from '../nodes-gl/addition';
import { getLengthNode } from '../nodes-gl/length';
import { getNoiseNode } from '../nodes-gl/noise';
import { getValue100Node } from '../nodes-gl/value100-node';

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
  registerGLNodeFactory('sine-node', getSineNode);
  registerGLNodeFactory('cosine-node', getCosineNode);
  registerGLNodeFactory('time-node', getTimeNode);
  registerGLNodeFactory('multiply-node', getMultiplyNode);
  registerGLNodeFactory('background-color-node', getBackgroundColorNode);
  registerGLNodeFactory('uv-node', getUVNode);
  registerGLNodeFactory('addition-node', getAdditionNode);
  registerGLNodeFactory('length-node', getLengthNode);
  registerGLNodeFactory('noise-node', getNoiseNode);
  registerGLNodeFactory('value100-node', getValue100Node);
};

export const getGLNodeTaskFactory = (name: string) => {
  return glNodeTaskRegistry[name] ?? false;
};
