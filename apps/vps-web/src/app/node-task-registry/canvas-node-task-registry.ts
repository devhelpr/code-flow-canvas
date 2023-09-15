import {
  AnimatePathFunction,
  AnimatePathFromThumbFunction,
} from '../follow-path/animate-path';
import { getStateTransition } from '../nodes/state-transition';
import { getAnnotation } from '../nodes/annotation';
import { getArray } from '../nodes/array';
import { getButton } from '../nodes/button';
import { getCanvasNode } from '../nodes/canvas-node';
import { getCheckbox } from '../nodes/checkbox';
import { getExpression } from '../nodes/expression';
import { getExpressionExecute } from '../nodes/expression-execute';
import { getExpressionPart } from '../nodes/expression-part';
import { getFetch } from '../nodes/fetch';
import { getIfCondition } from '../nodes/if-condition';
import { getFilter, getMap } from '../nodes/map';
import { getShowInput } from '../nodes/show-input';
import { getShowObject } from '../nodes/show-object';
import { getShowValue } from '../nodes/show-value';
import { getSlider } from '../nodes/slider';
import { getState } from '../nodes/state';
import { createStateMachineNode } from '../nodes/state-machine-node';
import { getSum } from '../nodes/sum';
import { getVariable } from '../nodes/variable';
import { NodeInfo } from '../types/node-info';
import { NodeTaskFactory, NodeTypeRegistry } from './node-task-registry';
import { getSequential } from '../nodes/sequential';
import { createStateCompound } from '../nodes/state-compound';
import { getStyledNode } from '../nodes/styled-node';

export const canvasNodeTaskRegistry: NodeTypeRegistry<NodeInfo> = {};

export const registerNodeFactory = (
  name: string,
  nodeFactory: NodeTaskFactory<NodeInfo>
) => {
  canvasNodeTaskRegistry[name] = nodeFactory;
};
export const getNodeFactoryNames = () => {
  return Object.keys(canvasNodeTaskRegistry).sort();
};

export const setupCanvasNodeTaskRegistry = (
  animatePath: AnimatePathFunction<NodeInfo>,
  animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
) => {
  registerNodeFactory('map', getMap(animatePath, animatePathFromThumb));
  registerNodeFactory('filter', getFilter(animatePath, animatePathFromThumb));
  registerNodeFactory('expression', getExpression);
  registerNodeFactory('expression-part', getExpressionPart);
  registerNodeFactory('expression-execute', getExpressionExecute);
  registerNodeFactory('if-condition', getIfCondition);
  registerNodeFactory('array', getArray);
  registerNodeFactory('show-object', getShowObject);
  registerNodeFactory('show-input', getShowInput);
  registerNodeFactory('show-value', getShowValue);
  registerNodeFactory('sum', getSum);
  registerNodeFactory('state', getState);
  registerNodeFactory('state-transition', getStateTransition);
  registerNodeFactory('fetch', getFetch);
  registerNodeFactory('canvas-node', getCanvasNode(animatePath));
  registerNodeFactory('state-machine', createStateMachineNode);
  registerNodeFactory('state-compound', createStateCompound);
  registerNodeFactory('variable', getVariable);
  registerNodeFactory('button', getButton(animatePath));
  registerNodeFactory('slider', getSlider(animatePath));
  registerNodeFactory('checkbox', getCheckbox(animatePath));
  registerNodeFactory('styled-node', getStyledNode(animatePath));
  registerNodeFactory('annotation', getAnnotation(animatePath));
  registerNodeFactory(
    'sequential',
    getSequential(animatePath, animatePathFromThumb)
  );
};

export const getNodeTaskFactory = (name: string) => {
  return canvasNodeTaskRegistry[name] ?? false;
};
