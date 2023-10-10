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
import { getLayoutNode } from '../nodes/layout-node';
import { getTimer } from '../nodes/timer';
import { getValue } from '../nodes/value';
import { getSplitByCase } from '../nodes/split-by-case';
import { getGate } from '../nodes/gate';
import { setVariable } from '../nodes/set-variable';
import { getNodeTrigger } from '../nodes/node-trigger';
import { getNodeTriggerTarget } from '../nodes/node-trigger-target';
import { getHtmlNode } from '../nodes/html-node';
import { getForEach } from '../nodes/foreach';
import { getSendCommand } from '../nodes/send-command';
import { getFunction } from '../nodes/function';
import { getCallFunction } from '../nodes/call-function';
import { getTest } from '../nodes/test';

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
  registerNodeFactory('foreach', getForEach(animatePath, animatePathFromThumb));
  registerNodeFactory('expression', getExpression);
  registerNodeFactory('expression-part', getExpressionPart);
  registerNodeFactory('expression-execute', getExpressionExecute);
  registerNodeFactory('value', getValue);

  registerNodeFactory('send-command', getSendCommand);

  registerNodeFactory('gate', getGate);
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
  registerNodeFactory('layout-node', getLayoutNode(animatePath));
  registerNodeFactory('state-machine', createStateMachineNode);
  registerNodeFactory('state-compound', createStateCompound);
  registerNodeFactory('variable', getVariable);
  registerNodeFactory('set-variable', setVariable);
  registerNodeFactory('button', getButton(animatePath));
  registerNodeFactory('timer', getTimer(animatePath));
  registerNodeFactory('slider', getSlider(animatePath));
  registerNodeFactory('checkbox', getCheckbox(animatePath));
  registerNodeFactory('styled-node', getStyledNode(animatePath));
  registerNodeFactory('html-node', getHtmlNode);
  registerNodeFactory('annotation', getAnnotation(animatePath));

  registerNodeFactory('node-trigger', getNodeTrigger(animatePath));
  registerNodeFactory('node-trigger-target', getNodeTriggerTarget(animatePath));

  registerNodeFactory('call-function', getCallFunction(animatePath));
  registerNodeFactory('function', getFunction(animatePath));

  registerNodeFactory(
    'sequential',
    getSequential(animatePath, animatePathFromThumb)
  );

  registerNodeFactory(
    'split-by-case',
    getSplitByCase(animatePath, animatePathFromThumb)
  );

  registerNodeFactory('test', getTest);
};

export const getNodeTaskFactory = (name: string) => {
  return canvasNodeTaskRegistry[name] ?? false;
};
