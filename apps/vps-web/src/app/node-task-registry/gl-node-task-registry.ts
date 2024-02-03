import { NodeTaskFactory, NodeTypeRegistry } from './node-task-registry';
import { getCircleNode } from '../nodes-gl/circle-node';
import { getValueNode } from '../nodes-gl/value-node';
import { getColorNode } from '../nodes-gl/color-node';
import { getSineNode } from '../nodes-gl/sine';
import { getCosineNode } from '../nodes-gl/cosine';
import { getTimeNode } from '../nodes-gl/time';
import { getMultiplyNode } from '../nodes-gl/multiply';
import { getOutputColorNode } from '../nodes-gl/output-color-node';
import { getUVNode } from '../nodes-gl/uv-node';
import { getAdditionNode } from '../nodes-gl/addition';
import { getVectorLengthNode } from '../nodes-gl/vector-length';
import { getNoiseNode } from '../nodes-gl/noise';
import { getSplitColorsNode } from '../nodes-gl/split-colors';
import { getPaletteNode } from '../nodes-gl/palette';
import { getRotateNode } from '../nodes-gl/rotate';
import { getSplitVector2dNode } from '../nodes-gl/split-vec2';
import { getSmoothStepFloatNode } from '../nodes-gl/smooth-step-float';
import { getClampFloatNode } from '../nodes-gl/clamp-float';
import { getModuloFloatNode } from '../nodes-gl/modulo-float';
import { getScaleNode } from '../nodes-gl/scale';
import { getMultiplyColorNode } from '../nodes-gl/multiplyColor';
import { getAbsoluteNode } from '../nodes-gl/absolute';
import { getSubtractNode } from '../nodes-gl/subtraction';
import { getCreateVector2Node } from '../nodes-gl/create-vector2';
import { GLNodeInfo } from '../types/gl-node-info';
import { Composition } from '@devhelpr/visual-programming-system';
import { getCreateCompositionNode } from '../nodes-gl/composition';

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
  registerGLNodeFactory('absolute-node', getAbsoluteNode);
  registerGLNodeFactory('multiply-node', getMultiplyNode);
  registerGLNodeFactory('multiply-color-node', getMultiplyColorNode);
  registerGLNodeFactory('output-color-node', getOutputColorNode);
  registerGLNodeFactory('uv-node', getUVNode);
  registerGLNodeFactory('addition-node', getAdditionNode);
  registerGLNodeFactory('subtract-node', getSubtractNode);
  registerGLNodeFactory('vector-length', getVectorLengthNode);
  registerGLNodeFactory('noise-node', getNoiseNode);
  registerGLNodeFactory('split-colors-node', getSplitColorsNode);
  registerGLNodeFactory('palette', getPaletteNode);
  registerGLNodeFactory('rotate-node', getRotateNode);
  registerGLNodeFactory('scale-node', getScaleNode);
  registerGLNodeFactory('split-vector2-node', getSplitVector2dNode);
  registerGLNodeFactory('smooth-step-float-node', getSmoothStepFloatNode);
  registerGLNodeFactory('clamp-float-node', getClampFloatNode);
  registerGLNodeFactory('modulo-float-node', getModuloFloatNode);
  registerGLNodeFactory('create-vector2', getCreateVector2Node);
};

export const getGLNodeTaskFactory = (name: string) => {
  return glNodeTaskRegistry[name] ?? false;
};

export const removeAllCompositions = () => {
  Object.keys(glNodeTaskRegistry).forEach((key) => {
    if (key.startsWith('composition-')) {
      delete glNodeTaskRegistry[key];
    }
  });
};

export const registerCompositionNodes = (
  compositions: Record<string, Composition<GLNodeInfo>>
) => {
  Object.entries(compositions).forEach(([key, composition]) => {
    const node = getCreateCompositionNode(
      composition.thumbs,
      key,
      composition.name,
      getGLNodeTaskFactory
    );
    registerGLNodeFactory(`composition-${key}`, node);
  });
};

export const registerComposition = (composition: Composition<GLNodeInfo>) => {
  const node = getCreateCompositionNode(
    composition.thumbs,
    composition.id,
    composition.name,
    getGLNodeTaskFactory
  );
  registerGLNodeFactory(`composition-${composition.id}`, node);
};
