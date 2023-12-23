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
import { getStart } from '../nodes/start-node';
import { getEnd } from '../nodes/end-node';
import { getMultiTrigger } from '../nodes/multi-trigger';
import { getShowImage } from '../nodes/show-image';
import { observeVariable } from '../nodes/observe-variable';
import { getSummingJunction } from '../nodes/summing-junction';
import { getIFrameHtmlNode } from '../nodes/iframe-html-node';
import { getMultiplyNode } from '../nodes/multiply';
import { loadTextFileNodeName, loadTextFile } from '../nodes/load-text-file';
import {
  runRegexNodeName,
  runRegularExpression,
} from '../nodes/regular-expression';
import { getMergeNode, mergeModeName } from '../nodes/merge';
import { getParallel } from '../nodes/parallel';
import {
  replaceStringMapNodeName,
  replaceStringMap,
} from '../nodes/replace-string-map';
import { splitStringNodeName, splitString } from '../nodes/split-string';
import { createSetNodeName, createSet } from '../nodes/create-set';
import {
  intersectSetsNodeName,
  getInsersectSetsNode,
} from '../nodes/intersect-sets';
import { getSetSizeNode, setSizeNodeName } from '../nodes/set-size';
import { rangeNodeName, getRangeNode } from '../nodes/range';
import {
  scopeVariableNodeName,
  getScopedVariable,
} from '../nodes/scoped-variable';
import {
  getDictionaryVariableNodeName,
  getDictionaryVariable,
} from '../nodes/get-dictionary-value';
import {
  setDictionaryVariableNodeName,
  setDictionaryVariable,
} from '../nodes/set-dictionary-value';
import {
  getDictionaryAsArray,
  getDictionaryAsArrayNodeName,
} from '../nodes/get-dictionary-as-array';
import { getMap, mapNodeName } from '../nodes/map';
import { getSortArrayNode, sortArrayNodeName } from '../nodes/sort-array';
import { joinArrayNodeName, joinArray } from '../nodes/join-array';
import { getSort, sortNodeName } from '../nodes/sort';
import {
  getDictionarySize,
  getDictionarySizeNodeName,
} from '../nodes/get-dictionary-size';
import {
  pushArrayVariable,
  pushValueToArrayVariableNodeName,
} from '../nodes/push-array-value';
import { getArraySizeNodeName, getArraySize } from '../nodes/get-array-size';
import { getArrayNodeName, getArrayVariable } from '../nodes/get-array';
import {
  getArrayValueByIndex,
  getArrayVariableNodeName,
} from '../nodes/get-array-value';
import { reverseArray, reverseArrayNodeName } from '../nodes/reverse-array';
import {
  initializeGridVariableNodeName,
  initializeGridVariable,
} from '../nodes/initialize-grid';
import {
  setArrayValueByIndexVariableNodeName,
  setArrayValueByIndexVariable,
} from '../nodes/set-array-value-by-index';
import {
  setGridRowVariable,
  setGridRowVariableNodeName,
} from '../nodes/set-grid-row';
import { setArrayNodeName, setArrayVariable } from '../nodes/set-array';
import {
  popArrayValue,
  popArrayVariableNodeName,
} from '../nodes/pop-array-value';
import { getWhile, whileNodeName } from '../nodes/while';
import {
  getHasArrayDataNodeName,
  getHasArrayDataVariable,
} from '../nodes/get-has-array-data';
import { createArray, createArrayNodeName } from '../nodes/create-array';
import {
  initializeArrayariableNodeName,
  initializeArrayVariable,
} from '../nodes/initialize-array';
import { dialogFormNodeName, dialogFormNode } from '../nodes/dialog-form';

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
  registerNodeFactory('start-node', getStart);
  registerNodeFactory('end-node', getEnd);

  registerNodeFactory(
    'multi-trigger',
    getMultiTrigger(animatePath, animatePathFromThumb)
  );
  registerNodeFactory('summing-junction', getSummingJunction);

  registerNodeFactory('foreach', getForEach(animatePath, animatePathFromThumb));
  registerNodeFactory(mapNodeName, getMap(animatePath, animatePathFromThumb));
  registerNodeFactory(sortNodeName, getSort(animatePath, animatePathFromThumb));
  registerNodeFactory(
    whileNodeName,
    getWhile(animatePath, animatePathFromThumb)
  );

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
  registerNodeFactory('show-image', getShowImage);
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
  registerNodeFactory('iframe-html-node', getIFrameHtmlNode);
  registerNodeFactory('annotation', getAnnotation(animatePath));

  registerNodeFactory('node-trigger', getNodeTrigger(animatePath));
  registerNodeFactory('node-trigger-target', getNodeTriggerTarget(animatePath));

  registerNodeFactory('call-function', getCallFunction(animatePath));
  registerNodeFactory('function', getFunction(animatePath));
  registerNodeFactory('observe-variable', observeVariable(animatePath));

  registerNodeFactory(
    'sequential',
    getSequential(animatePath, animatePathFromThumb)
  );

  registerNodeFactory(
    'parallel',
    getParallel(animatePath, animatePathFromThumb)
  );

  registerNodeFactory(
    'split-by-case',
    getSplitByCase(animatePath, animatePathFromThumb)
  );

  registerNodeFactory('test', getTest);

  registerNodeFactory('multiply-node', getMultiplyNode);
  registerNodeFactory(loadTextFileNodeName, loadTextFile(animatePath));
  registerNodeFactory(runRegexNodeName, runRegularExpression);
  registerNodeFactory(mergeModeName, getMergeNode);

  registerNodeFactory(replaceStringMapNodeName, replaceStringMap);

  registerNodeFactory(splitStringNodeName, splitString);
  registerNodeFactory(createSetNodeName, createSet);
  registerNodeFactory(createArrayNodeName, createArray);
  registerNodeFactory(intersectSetsNodeName, getInsersectSetsNode);
  registerNodeFactory(setSizeNodeName, getSetSizeNode);
  registerNodeFactory('merge', getMergeNode);
  registerNodeFactory(rangeNodeName, getRangeNode);
  registerNodeFactory(scopeVariableNodeName, getScopedVariable(false));

  // dictionary nodes
  registerNodeFactory(getDictionaryVariableNodeName, getDictionaryVariable);
  registerNodeFactory(setDictionaryVariableNodeName, setDictionaryVariable);
  registerNodeFactory(getDictionaryAsArrayNodeName, getDictionaryAsArray);
  registerNodeFactory(getDictionarySizeNodeName, getDictionarySize);

  // array nodes
  registerNodeFactory(initializeArrayariableNodeName, initializeArrayVariable);
  registerNodeFactory(pushValueToArrayVariableNodeName, pushArrayVariable);
  registerNodeFactory(getArraySizeNodeName, getArraySize);
  registerNodeFactory(getArrayNodeName, getArrayVariable);
  registerNodeFactory(getArrayVariableNodeName, getArrayValueByIndex);
  registerNodeFactory(
    setArrayValueByIndexVariableNodeName,
    setArrayValueByIndexVariable
  );
  registerNodeFactory(setArrayNodeName, setArrayVariable);
  registerNodeFactory(popArrayVariableNodeName, popArrayValue);

  registerNodeFactory(sortArrayNodeName, getSortArrayNode);
  registerNodeFactory(joinArrayNodeName, joinArray);
  registerNodeFactory(reverseArrayNodeName, reverseArray);
  registerNodeFactory(getHasArrayDataNodeName, getHasArrayDataVariable);

  // grid nodes
  registerNodeFactory(initializeGridVariableNodeName, initializeGridVariable);
  registerNodeFactory(setGridRowVariableNodeName, setGridRowVariable);

  registerNodeFactory(dialogFormNodeName, dialogFormNode);
};

export const getNodeTaskFactory = (name: string) => {
  return canvasNodeTaskRegistry[name] ?? false;
};
