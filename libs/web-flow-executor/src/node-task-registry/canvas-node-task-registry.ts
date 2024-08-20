import { getStateTransition } from '../nodes/state-transition';
import { getArray } from '../nodes/array';
import { getButton } from '../nodes/button';
import { getCheckbox } from '../nodes/checkbox';
import { getExpression } from '../nodes/expression';
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

import { getSequential } from '../nodes/sequential';
import { createStateCompound } from '../nodes/state-compound';
import { getStyledNode } from '../nodes/styled-node';
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
import {
  getNodeTreeVisualizer,
  nodeTreeVisualizerNodeName,
} from '../nodes/node-tree-visualizer';
import {
  sendNodeToNodeTree,
  sendNodeToNodeTreeNodeName,
} from '../nodes/send-node-to-node-tree';
import {
  Composition,
  NodeTaskFactory,
  NodeTypeRegistry,
  RegisterComposition,
} from '@devhelpr/visual-programming-system';
import { getCreateCompositionNode } from '../nodes/composition';
import { getThumbInputNode } from '../nodes/thumb-input';
import { getThumbOutputNode } from '../nodes/thumb-output';
import { getTestNode } from '../nodes/test';
import { getMediaLibraryNode } from '../nodes/media-library';
import { RunCounter } from '../follow-path/run-counter';
import { getCreateEventStateValueNode } from '../nodes/create-state-value';
import { getUserInput } from '../nodes/user-input';
import { setFlowVariable } from '../nodes/set-flow-variable';
import { getAnnotation } from '../nodes/annotation';
import { getMergeSumNode, sumMergeModeName } from '../nodes/merge-sum';

import { getObjectNode, objectNodeName } from '../nodes/object-node';

import { NodeInfo } from '../types/node-info';

import { getNeuralNode } from '../nodes/neural-node';
import { getNeuralInputNode } from '../nodes/neural-input-node';
import { getNeuralBiasNode } from '../nodes/neural-bias-node';
import { getNeuralOutputNode } from '../nodes/neural-output-node';

import { initArrayNodeName, initArrayVariable } from '../nodes/init-array';
import { getNeuralTrainTestNode } from '../nodes/neural-train-test-node';

import {
  getNeuralNodeTrainOutputLayerNode,
  neuralNodeTrainOutputLayerName,
} from '../nodes/neural-node-train-output-layer';

import {
  getNeuralNodeOutputLayerNode,
  neuralNodeOutputLayerName,
} from '../nodes/neural-node-output-layer';

import {
  getNeuralNodeInputLayerNode,
  neuralNodeInputLayerName,
} from '../nodes/neural-node-input-layer';

import {
  getNeuralNodeHiddenLayerNode,
  neuralNodeHiddenLayerName,
} from '../nodes/neural-node-hidden-layer';

import {
  getNeuralNodeTrainHiddenLayerNode,
  neuralNodeTrainHiddenLayerName,
} from '../nodes/neural-node-train-hidden-layer';

import {
  getNeuralMnistTrainingDataNode,
  neuralMnistTrainingDataName,
} from '../nodes/neural-mnist-training-data';

import {
  getNeuralManualDrawableCanvasNode,
  neuralManualDrawableCanvasInputNodeName,
} from '../nodes/neural-manual-drawable-canvas-input';

import {
  neuralTestTrainingDataName,
  getNeuralTestTrainingNode,
} from '../nodes/neural-test-training';
export const canvasNodeTaskRegistry: NodeTypeRegistry<NodeInfo> = {};
export const canvasNodeTaskRegistryLabels: Record<string, string> = {};
export const registerNodeFactory = (
  name: string,
  nodeFactory: NodeTaskFactory<NodeInfo>,
  label?: string
) => {
  canvasNodeTaskRegistry[name] = nodeFactory;
  if (label) {
    canvasNodeTaskRegistryLabels[name] = label;
  }
};

export type RegisterNodeFactoryFunction = typeof registerNodeFactory;

export const getNodeFactoryNames = () => {
  return Object.keys(canvasNodeTaskRegistry).sort();
};

export const setupCanvasNodeTaskRegistry = (
  createRunCounterContext: (
    isRunViaRunButton: boolean,
    shouldResetConnectionSlider: boolean
  ) => RunCounter,
  registerExternalNodes?: (
    registerNodeFactory: RegisterNodeFactoryFunction
  ) => void,
  clearPresetRegistry?: boolean
) => {
  if (!clearPresetRegistry) {
    registerNodeFactory('start-node', getStart);
    registerNodeFactory('end-node', getEnd);

    registerNodeFactory('multi-trigger', getMultiTrigger);
    registerNodeFactory('summing-junction', getSummingJunction);

    registerNodeFactory('foreach', getForEach);
    registerNodeFactory(mapNodeName, getMap);
    registerNodeFactory(sortNodeName, getSort);
    registerNodeFactory(whileNodeName, getWhile);

    registerNodeFactory('expression', getExpression);
    // registerNodeFactory('expression-part', getExpressionPart);
    // registerNodeFactory('expression-execute', getExpressionExecute);
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
    //registerNodeFactory('canvas-node', getCanvasNode(animatePath));
    //registerNodeFactory('layout-node', getLayoutNode(animatePath));
    registerNodeFactory('state-machine', createStateMachineNode);
    registerNodeFactory('state-compound', createStateCompound);
    registerNodeFactory(
      'create-state-event-value',
      getCreateEventStateValueNode,
      'Event state-value'
    );
    registerNodeFactory('variable', getVariable);
    registerNodeFactory('set-variable', setVariable);
    registerNodeFactory(
      'set-flow-variable',
      setFlowVariable,
      'Set flow variable'
    );

    registerNodeFactory('button', getButton(createRunCounterContext));
    registerNodeFactory(
      'user-input',
      getUserInput(createRunCounterContext),
      'User Input'
    );
    registerNodeFactory('timer', getTimer);
    registerNodeFactory('slider', getSlider(createRunCounterContext));
    registerNodeFactory('checkbox', getCheckbox);
    registerNodeFactory('styled-node', getStyledNode);
    registerNodeFactory('html-node', getHtmlNode);
    registerNodeFactory('iframe-html-node', getIFrameHtmlNode);
    registerNodeFactory('annotation', getAnnotation);

    registerNodeFactory('node-trigger', getNodeTrigger);
    registerNodeFactory('node-trigger-target', getNodeTriggerTarget);

    registerNodeFactory('call-function', getCallFunction);
    registerNodeFactory('function', getFunction);
    registerNodeFactory('observe-variable', observeVariable);

    registerNodeFactory('sequential', getSequential);

    registerNodeFactory('parallel', getParallel);

    registerNodeFactory('split-by-case', getSplitByCase);

    registerNodeFactory('multiply-node', getMultiplyNode);
    registerNodeFactory(loadTextFileNodeName, loadTextFile);
    registerNodeFactory(runRegexNodeName, runRegularExpression);
    registerNodeFactory(mergeModeName, getMergeNode);
    registerNodeFactory(sumMergeModeName, getMergeSumNode);

    registerNodeFactory(objectNodeName, getObjectNode);

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
    registerNodeFactory(
      initializeArrayariableNodeName,
      initializeArrayVariable
    );
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
    registerNodeFactory(initArrayNodeName, initArrayVariable);

    registerNodeFactory(sortArrayNodeName, getSortArrayNode);
    registerNodeFactory(joinArrayNodeName, joinArray);
    registerNodeFactory(reverseArrayNodeName, reverseArray);
    registerNodeFactory(getHasArrayDataNodeName, getHasArrayDataVariable);

    // grid nodes
    registerNodeFactory(initializeGridVariableNodeName, initializeGridVariable);
    registerNodeFactory(setGridRowVariableNodeName, setGridRowVariable);

    registerNodeFactory(dialogFormNodeName, dialogFormNode);

    registerNodeFactory(nodeTreeVisualizerNodeName, getNodeTreeVisualizer);
    registerNodeFactory(sendNodeToNodeTreeNodeName, sendNodeToNodeTree);

    registerNodeFactory('thumb-input', getThumbInputNode, 'ThumbInput');
    registerNodeFactory('thumb-output', getThumbOutputNode, 'ThumbOutput');

    registerNodeFactory('test-node', getTestNode, 'Test Node');
    registerNodeFactory(
      'media-library-node',
      getMediaLibraryNode,
      'Media Library'
    );
    registerNodeFactory('neural-node', getNeuralNode(createRunCounterContext));
    registerNodeFactory(
      'neural-input-node',
      getNeuralInputNode(createRunCounterContext)
    );
    registerNodeFactory(
      'neural-bias-node',
      getNeuralBiasNode(createRunCounterContext)
    );

    registerNodeFactory('neural-output-node', getNeuralOutputNode);

    registerNodeFactory(
      'neural-train-test-node',
      getNeuralTrainTestNode(createRunCounterContext)
    );

    registerNodeFactory(
      neuralNodeTrainHiddenLayerName,
      getNeuralNodeTrainHiddenLayerNode
    );
    registerNodeFactory(
      neuralNodeTrainOutputLayerName,
      getNeuralNodeTrainOutputLayerNode
    );
    registerNodeFactory(
      neuralNodeOutputLayerName,
      getNeuralNodeOutputLayerNode
    );

    registerNodeFactory(neuralNodeInputLayerName, getNeuralNodeInputLayerNode);
    registerNodeFactory(
      neuralNodeHiddenLayerName,
      getNeuralNodeHiddenLayerNode
    );

    registerNodeFactory(
      neuralMnistTrainingDataName,
      getNeuralMnistTrainingDataNode
    );
    registerNodeFactory(
      neuralManualDrawableCanvasInputNodeName,
      getNeuralManualDrawableCanvasNode
    );

    registerNodeFactory(neuralTestTrainingDataName, getNeuralTestTrainingNode);
  }

  registerExternalNodes?.(registerNodeFactory);
};

export const getNodeTaskFactory = (name: string) => {
  return canvasNodeTaskRegistry[name] ?? false;
};

export const removeAllCompositions = () => {
  Object.keys(canvasNodeTaskRegistry).forEach((key) => {
    if (key.startsWith('composition-')) {
      delete canvasNodeTaskRegistry[key];
    }
  });
};

export const registerCompositionNodes = (
  compositions: Record<string, Composition<NodeInfo>>
) => {
  Object.entries(compositions).forEach(([key, composition]) => {
    const node = getCreateCompositionNode(
      composition.thumbs,
      key,
      composition.name,
      getNodeTaskFactory
    );
    registerNodeFactory(`composition-${key}`, node, composition.name);
  });
};

export const registerComposition: RegisterComposition<NodeInfo> = (
  composition: Composition<NodeInfo>
) => {
  const node = getCreateCompositionNode(
    composition.thumbs,
    composition.id,
    composition.name,
    getNodeTaskFactory
  );
  registerNodeFactory(`composition-${composition.id}`, node);
};
