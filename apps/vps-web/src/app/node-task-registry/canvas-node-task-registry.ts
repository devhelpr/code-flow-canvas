import {
  AnimatePathFunction,
  AnimatePathFromThumbFunction,
} from '../follow-path/animate-path';
import { getAction } from '../nodes/action';
import { getArray } from '../nodes/array';
import { getButton } from '../nodes/button';
import { getCanvasNode } from '../nodes/canvas-node';
import { getExpression } from '../nodes/expression';
import { getFetch } from '../nodes/fetch';
import { getIfCondition } from '../nodes/if-condition';
import { getFilter, getMap } from '../nodes/map';
import { getShowInput } from '../nodes/show-input';
import { getShowObject } from '../nodes/show-object';
import { getState } from '../nodes/state';
import { createStateMachine } from '../nodes/state-machine-node';
import { getSum } from '../nodes/sum';
import { getVariable } from '../nodes/variable';
import { NodeInfo } from '../types/node-info';
import { NodeTaskFactory, NodeTypeRegistry } from './node-task-registry';

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
  registerNodeFactory('if-condition', getIfCondition);
  registerNodeFactory('array', getArray);
  registerNodeFactory('show-object', getShowObject);
  registerNodeFactory('show-input', getShowInput);
  registerNodeFactory('sum', getSum);
  registerNodeFactory('state', getState);
  registerNodeFactory('action', getAction);
  registerNodeFactory('fetch', getFetch);
  registerNodeFactory('canvas-node', getCanvasNode(animatePath));
  registerNodeFactory('state-machine', createStateMachine);
  registerNodeFactory('variable', getVariable);
  registerNodeFactory('button', getButton(animatePath));
};

export const getNodeTaskFactory = (name: string) => {
  return canvasNodeTaskRegistry[name] ?? false;
};
