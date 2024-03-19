import {
  GetNodeTaskFactory,
  NodeTaskFactory,
  NodeTypeRegistry,
  RegisterComposition,
} from './node-task-registry';
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
import { getMorganNoiseNode, getNoiseNode } from '../nodes-gl/noise';
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
import { getAtanNode } from '../nodes-gl/atan';
import { getExpNode } from '../nodes-gl/exp';
import { getFractNode } from '../nodes-gl/fract';
import { getAdditiveInverseNode } from '../nodes-gl/additive-inverse';
import { getPowNode } from '../nodes-gl/pow';
import { getScaleColorNode } from '../nodes-gl/scaleColor';
import { getDivideNode } from '../nodes-gl/divide';
import { getFractVectorNode } from '../nodes-gl/fract-vector';
import { getAdditionVectorNode } from '../nodes-gl/add-vectors';
import { getMixVectorColorNode } from '../nodes-gl/mix-color-vectors';
import { getAdditionVectorColorNode } from '../nodes-gl/add-color-vectors';
import { getDefineVectorVariableNode } from '../nodes-gl/define-vec2-variable';
import { getSetVectorVariableNode } from '../nodes-gl/set-vec2-variable';
import { getGetVectorVariableNode } from '../nodes-gl/get-vec2-variable';
import { getDefineColorVariableNode } from '../nodes-gl/define-vec3-variable';
import { getGetColorVariableNode } from '../nodes-gl/get-vec3-variable';
import { getSetColorVariableNode } from '../nodes-gl/set-vec3-variable';
import { getSetAndAddColorVariableNode } from '../nodes-gl/set-and-add-vec3-variable';
import { getThumbInputNode } from '../nodes-gl/thumb-input';
import { getThumbOutputNode } from '../nodes-gl/thumb-output';
import { getDotProductVectorNode } from '../nodes-gl/dot-vectors';
import { getForNode } from '../nodes-gl/for-node';
import { getConstantValue } from '../nodes-gl/constant-value';
import { getSetVariableNode } from '../nodes-gl/set-variable';
import { getDefineValueVariableNode } from '../nodes-gl/define-float-variable';
import { getGetVariableNode } from '../nodes-gl/get-variable';
import { getFloorVectorNode } from '../nodes-gl/floor-vector';
import { getMouseNode } from '../nodes-gl/mouse-node';
import { getWheelNode } from '../nodes-gl/wheel-node';
import { getPositionNode } from '../nodes-gl/position-node';
import { getBreakNode } from '../nodes-gl/break';
import { getGateNode } from '../nodes-gl/gate-node';
import { getCurrentIterationNode } from '../nodes-gl/current-iteration';
import { getSquaredNode } from '../nodes-gl/square';
import { getGreaterThenNode } from '../nodes-gl/greater-then';
import { getCustomNode } from '../nodes-gl/custom';
import { getCreateVector3Node } from '../nodes-gl/create-vector3';

export const glNodeTaskRegistry: NodeTypeRegistry<any> = {};
export const glNodeTaskRegistryLabels: Record<string, string> = {};
export const registerGLNodeFactory = (
  name: string,
  nodeFactory: NodeTaskFactory<any>,
  label?: string
) => {
  glNodeTaskRegistry[name] = nodeFactory;
  if (label) {
    glNodeTaskRegistryLabels[name] = label;
  }
};
export const getGLNodeFactoryNames = () => {
  return Object.keys(glNodeTaskRegistry).sort();
};

export const setupGLNodeTaskRegistry = () => {
  registerGLNodeFactory(
    'output-color-node',
    getOutputColorNode,
    'Output Color'
  );
  registerGLNodeFactory('uv-node', getUVNode, 'UV');
  registerGLNodeFactory('mouse-node', getMouseNode, 'Mouse');
  registerGLNodeFactory('position-node', getPositionNode, 'Position');
  registerGLNodeFactory('wheel-node', getWheelNode, 'Wheel');

  registerGLNodeFactory('color-node', getColorNode, 'Color');
  registerGLNodeFactory('value-node', getValueNode, 'Value');

  registerGLNodeFactory(
    'additive-inverse-node',
    getAdditiveInverseNode,
    'Additive Inverse'
  );
  registerGLNodeFactory('sine-node', getSineNode, 'Sine');
  registerGLNodeFactory('cosine-node', getCosineNode, 'Cosine');
  registerGLNodeFactory('atan-node', getAtanNode, 'Atan');
  registerGLNodeFactory('exp-node', getExpNode, 'Exp');
  registerGLNodeFactory('fract-node', getFractNode, 'Fract');
  registerGLNodeFactory(
    'fract-vector-node',
    getFractVectorNode,
    'Fract vector'
  );
  registerGLNodeFactory('pow-node', getPowNode, 'Pow');

  registerGLNodeFactory('time-node', getTimeNode, 'Time');
  registerGLNodeFactory('absolute-node', getAbsoluteNode, 'Absolute');
  registerGLNodeFactory('multiply-node', getMultiplyNode, 'Multiply');
  registerGLNodeFactory('divide-node', getDivideNode, 'Divide');
  registerGLNodeFactory(
    'multiply-color-node',
    getMultiplyColorNode,
    'Multiply Color'
  );
  registerGLNodeFactory('addition-node', getAdditionNode, 'Add');
  registerGLNodeFactory('subtract-node', getSubtractNode, 'Subtract');
  registerGLNodeFactory('modulo-float-node', getModuloFloatNode, 'Modulo');
  registerGLNodeFactory(
    'dot-vector-node',
    getDotProductVectorNode,
    'Dot Product'
  );

  registerGLNodeFactory(
    'addition-vector-node',
    getAdditionVectorNode,
    'Add Vectors'
  );
  registerGLNodeFactory('squared-node', getSquaredNode, 'Squared');

  registerGLNodeFactory('noise-node', getNoiseNode, 'Noise');

  registerGLNodeFactory(
    'morgan-noise-node',
    getMorganNoiseNode,
    'Morgan noise'
  );

  registerGLNodeFactory('rotate-node', getRotateNode, 'Rotate');
  registerGLNodeFactory('scale-node', getScaleNode, 'Scale');
  registerGLNodeFactory('scale-color-node', getScaleColorNode, 'Scale color');

  registerGLNodeFactory(
    'smooth-step-float-node',
    getSmoothStepFloatNode,
    'Smooth Step'
  );
  registerGLNodeFactory('clamp-float-node', getClampFloatNode, 'Clamp');

  registerGLNodeFactory('vector-length', getVectorLengthNode, 'Vector Length');
  registerGLNodeFactory(
    'create-vector2',
    getCreateVector2Node,
    'Create Vector'
  );
  registerGLNodeFactory(
    'split-vector2-node',
    getSplitVector2dNode,
    'Split Vector'
  );

  registerGLNodeFactory(
    'split-colors-node',
    getSplitColorsNode,
    'Split Colors'
  );

  registerGLNodeFactory(
    'create-vector3',
    getCreateVector3Node,
    'Create Color Vector'
  );

  registerGLNodeFactory('mix-color-vector-node', getMixVectorColorNode, 'Mix');

  registerGLNodeFactory(
    'addition-color-vector-node',
    getAdditionVectorColorNode,
    'Add colors'
  );

  registerGLNodeFactory('palette', getPaletteNode, 'Palette');
  registerGLNodeFactory('circle-node', getCircleNode, 'Metaball(2d)');

  registerGLNodeFactory('thumb-input', getThumbInputNode, 'ThumbInput');
  registerGLNodeFactory('thumb-output', getThumbOutputNode, 'ThumbOutput');

  registerGLNodeFactory(
    'define-vec2-variable-node',
    getDefineVectorVariableNode,
    'Define vector variable'
  );
  registerGLNodeFactory(
    'set-vec2-variable-node',
    getSetVectorVariableNode,
    'Set vector variable'
  );

  registerGLNodeFactory(
    'get-vec2-variable-node',
    getGetVectorVariableNode,
    'Get vector variable'
  );

  registerGLNodeFactory(
    'define-color-variable-node',
    getDefineColorVariableNode,
    'Define color variable'
  );
  registerGLNodeFactory(
    'set-color-variable-node',
    getSetColorVariableNode,
    'Set color variable'
  );

  registerGLNodeFactory(
    'get-color-variable-node',
    getGetColorVariableNode,
    'Get color variable'
  );

  registerGLNodeFactory(
    'set-and-add-color-variable-node',
    getSetAndAddColorVariableNode,
    'Add and set color variable'
  );

  registerGLNodeFactory('for-node', getForNode, 'for');
  registerGLNodeFactory('gate-node', getGateNode, 'gate');
  registerGLNodeFactory('constant-value', getConstantValue, 'Constant');

  registerGLNodeFactory(
    'current-iteration-node',
    getCurrentIterationNode,
    'Current Iteration'
  );

  registerGLNodeFactory(
    'set-variable-node',
    getSetVariableNode,
    'Set variable'
  );

  registerGLNodeFactory(
    'define-float-variable-node',
    getDefineValueVariableNode,
    'Define float variable'
  );

  registerGLNodeFactory(
    'get-float-variable-node',
    getGetVariableNode,
    'Get float variable'
  );

  registerGLNodeFactory(
    'floor-vector-node',
    getFloorVectorNode,
    'Floor Vector'
  );

  registerGLNodeFactory('break-node', getBreakNode, 'Break');
  registerGLNodeFactory(
    'greater-then-node',
    getGreaterThenNode,
    'Greater Then'
  );
  registerGLNodeFactory('custom-node', getCustomNode, 'Custom');
};

export const getGLNodeTaskFactory: GetNodeTaskFactory<GLNodeInfo> = (
  name: string
) => {
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
    registerGLNodeFactory(`composition-${key}`, node, composition.name);
  });
};

export const registerComposition: RegisterComposition<GLNodeInfo> = (
  composition: Composition<GLNodeInfo>
) => {
  const node = getCreateCompositionNode(
    composition.thumbs,
    composition.id,
    composition.name,
    getGLNodeTaskFactory
  );
  registerGLNodeFactory(
    `composition-${composition.id}`,
    node,
    composition.name
  );
};
