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
import { resetVariable } from '../nodes/reset-variable';
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
  sendResetToNodeTree,
  sendResetToNodeTreeNodeName,
} from '../nodes/send-reset-to-node-tree';
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
import { getUserTextInput } from '../nodes/user-text-input';
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
import { getImage } from '../nodes/image';
import { getConvolutionNode } from '../nodes/convolution-node';

import {
  registerExpressionFunctionNodeName,
  getRegisterExpressionFunctionNode,
} from '../nodes/register-expression-function';

import { subFlowNodeName, subFlowNode } from '../nodes/sub-flow';
import { loadCSVFile, loadCSVFileNodeName } from '../nodes/load-csv-file';
import { filterNodeName, getFilter } from '../nodes/filter';
import { loadJSONFile, loadJSONFileNodeName } from '../nodes/load-json-file';
import { getReduce, reduceNodeName } from '../nodes/reduce';
import { getRawJsonNode, jsonNodeName } from '../nodes/raw-json';
import { getRawTextNode, textNodeName } from '../nodes/raw-text';

import {
  getVectorDistanceNode,
  vectorDistanceNodeName,
} from '../nodes/vector-distance';
import { createGuid, createGuidNodeName } from '../nodes/create-guid';
import { getNumberValue } from '../nodes/value-number';
import { FlowEngine } from '../interface/flow-engine';
import { getGroup } from '../nodes/group';

export const canvasNodeTaskRegistry: NodeTypeRegistry<NodeInfo> = {};
export const canvasNodeTaskRegistryLabels: Record<string, string> = {};
export const registerNodeFactory = (
  name: string,
  nodeFactory: NodeTaskFactory<NodeInfo>,
  label?: string,
  _flowEngine?: FlowEngine
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
    shouldResetConnectionSlider: boolean,
    onFlowFinished?: () => void
  ) => RunCounter,
  registerExternalNodes?: (
    registerNodeFactory: RegisterNodeFactoryFunction,
    createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean,
      onFlowFinished?: () => void
    ) => RunCounter,
    flowEngine?: FlowEngine
  ) => void,
  clearPresetRegistry?: boolean,
  flowEngine?: FlowEngine
) => {
  if (!clearPresetRegistry) {
    registerNodeFactory('start-node', getStart, undefined, flowEngine);
    registerNodeFactory('end-node', getEnd, undefined, flowEngine);

    registerNodeFactory(
      'multi-trigger',
      getMultiTrigger,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      'summing-junction',
      getSummingJunction,
      undefined,
      flowEngine
    );

    registerNodeFactory('group', getGroup, undefined, flowEngine);
    registerNodeFactory('foreach', getForEach, undefined, flowEngine);
    registerNodeFactory(mapNodeName, getMap, undefined, flowEngine);
    registerNodeFactory(filterNodeName, getFilter, undefined, flowEngine);
    registerNodeFactory(reduceNodeName, getReduce, undefined, flowEngine);
    registerNodeFactory(sortNodeName, getSort, undefined, flowEngine);
    registerNodeFactory(whileNodeName, getWhile, undefined, flowEngine);

    registerNodeFactory('expression', getExpression, undefined, flowEngine);
    // registerNodeFactory('expression-part', getExpressionPart);
    // registerNodeFactory('expression-execute', getExpressionExecute);
    registerNodeFactory('value', getValue, undefined, flowEngine);
    registerNodeFactory('number-value', getNumberValue, undefined, flowEngine);

    registerNodeFactory('send-command', getSendCommand, undefined, flowEngine);

    registerNodeFactory('gate', getGate, undefined, flowEngine);
    registerNodeFactory('if-condition', getIfCondition, undefined, flowEngine);
    registerNodeFactory('array', getArray, undefined, flowEngine);
    registerNodeFactory('show-object', getShowObject, undefined, flowEngine);
    registerNodeFactory('show-input', getShowInput, undefined, flowEngine);
    registerNodeFactory('show-value', getShowValue, undefined, flowEngine);
    registerNodeFactory('show-image', getShowImage, undefined, flowEngine);

    registerNodeFactory('sum', getSum, undefined, flowEngine);
    registerNodeFactory('state', getState, undefined, flowEngine);
    registerNodeFactory(
      'state-transition',
      getStateTransition,
      undefined,
      flowEngine
    );
    registerNodeFactory('fetch', getFetch, undefined, flowEngine);
    //registerNodeFactory('canvas-node', getCanvasNode(animatePath));
    //registerNodeFactory('layout-node', getLayoutNode(animatePath));
    registerNodeFactory(
      'state-machine',
      createStateMachineNode,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      'state-compound',
      createStateCompound,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      'create-state-event-value',
      getCreateEventStateValueNode,
      'Event state-value',
      flowEngine
    );
    registerNodeFactory('variable', getVariable, undefined, flowEngine);
    registerNodeFactory('set-variable', setVariable, undefined, flowEngine);
    registerNodeFactory('reset-variable', resetVariable, undefined, flowEngine);
    registerNodeFactory(
      'set-flow-variable',
      setFlowVariable,
      'Set flow variable',
      flowEngine
    );

    registerNodeFactory(
      'button',
      getButton(createRunCounterContext, flowEngine),
      undefined,
      flowEngine
    );
    registerNodeFactory(
      'user-input',
      getUserInput(createRunCounterContext),
      'User Input',
      flowEngine
    );

    registerNodeFactory(
      'user-text-input',
      getUserTextInput(createRunCounterContext),
      'User Text Input',
      flowEngine
    );
    registerNodeFactory('timer', getTimer, undefined, flowEngine);
    registerNodeFactory(
      'slider',
      getSlider(createRunCounterContext),
      undefined,
      flowEngine
    );
    registerNodeFactory('checkbox', getCheckbox, undefined, flowEngine);
    registerNodeFactory('styled-node', getStyledNode, undefined, flowEngine);
    registerNodeFactory('html-node', getHtmlNode, undefined, flowEngine);
    registerNodeFactory(
      'iframe-html-node',
      getIFrameHtmlNode,
      undefined,
      flowEngine
    );
    registerNodeFactory('annotation', getAnnotation, undefined, flowEngine);

    registerNodeFactory('node-trigger', getNodeTrigger, undefined, flowEngine);
    registerNodeFactory(
      'node-trigger-target',
      getNodeTriggerTarget,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      'call-function',
      getCallFunction,
      undefined,
      flowEngine
    );
    registerNodeFactory('function', getFunction, undefined, flowEngine);
    registerNodeFactory(
      'observe-variable',
      observeVariable,
      undefined,
      flowEngine
    );

    registerNodeFactory('sequential', getSequential, undefined, flowEngine);

    registerNodeFactory('parallel', getParallel, undefined, flowEngine);

    registerNodeFactory('split-by-case', getSplitByCase, undefined, flowEngine);

    registerNodeFactory(
      'multiply-node',
      getMultiplyNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      loadJSONFileNodeName,
      loadJSONFile,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      loadTextFileNodeName,
      loadTextFile,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      loadCSVFileNodeName,
      loadCSVFile,
      undefined,
      flowEngine
    );
    registerNodeFactory(subFlowNodeName, subFlowNode, undefined, flowEngine);

    registerNodeFactory(
      runRegexNodeName,
      runRegularExpression,
      undefined,
      flowEngine
    );
    registerNodeFactory(mergeModeName, getMergeNode, undefined, flowEngine);
    registerNodeFactory(
      sumMergeModeName,
      getMergeSumNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(objectNodeName, getObjectNode, undefined, flowEngine);

    registerNodeFactory(
      replaceStringMapNodeName,
      replaceStringMap,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      splitStringNodeName,
      splitString,
      undefined,
      flowEngine
    );
    registerNodeFactory(createSetNodeName, createSet, undefined, flowEngine);
    registerNodeFactory(
      createArrayNodeName,
      createArray,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      intersectSetsNodeName,
      getInsersectSetsNode,
      undefined,
      flowEngine
    );
    registerNodeFactory(setSizeNodeName, getSetSizeNode, undefined, flowEngine);
    registerNodeFactory('merge', getMergeNode, undefined, flowEngine);
    registerNodeFactory(rangeNodeName, getRangeNode, undefined, flowEngine);
    registerNodeFactory(
      scopeVariableNodeName,
      getScopedVariable(false),
      undefined,
      flowEngine
    );

    // dictionary nodes
    registerNodeFactory(
      getDictionaryVariableNodeName,
      getDictionaryVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      setDictionaryVariableNodeName,
      setDictionaryVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      getDictionaryAsArrayNodeName,
      getDictionaryAsArray,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      getDictionarySizeNodeName,
      getDictionarySize,
      undefined,
      flowEngine
    );

    // array nodes
    registerNodeFactory(
      initializeArrayariableNodeName,
      initializeArrayVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      pushValueToArrayVariableNodeName,
      pushArrayVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      getArraySizeNodeName,
      getArraySize,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      getArrayNodeName,
      getArrayVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      getArrayVariableNodeName,
      getArrayValueByIndex,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      setArrayValueByIndexVariableNodeName,
      setArrayValueByIndexVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      setArrayNodeName,
      setArrayVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      popArrayVariableNodeName,
      popArrayValue,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      initArrayNodeName,
      initArrayVariable,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      sortArrayNodeName,
      getSortArrayNode,
      undefined,
      flowEngine
    );
    registerNodeFactory(joinArrayNodeName, joinArray, undefined, flowEngine);
    registerNodeFactory(
      reverseArrayNodeName,
      reverseArray,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      getHasArrayDataNodeName,
      getHasArrayDataVariable,
      undefined,
      flowEngine
    );

    // grid nodes
    registerNodeFactory(
      initializeGridVariableNodeName,
      initializeGridVariable,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      setGridRowVariableNodeName,
      setGridRowVariable,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      dialogFormNodeName,
      dialogFormNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      nodeTreeVisualizerNodeName,
      getNodeTreeVisualizer,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      sendNodeToNodeTreeNodeName,
      sendNodeToNodeTree,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      sendResetToNodeTreeNodeName,
      sendResetToNodeTree,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      'thumb-input',
      getThumbInputNode,
      'Input port',
      flowEngine
    );
    registerNodeFactory(
      'thumb-output',
      getThumbOutputNode,
      'Output port',
      flowEngine
    );

    registerNodeFactory('test-node', getTestNode, 'Test Node', flowEngine);
    registerNodeFactory(
      'media-library-node',
      getMediaLibraryNode,
      'Media Library',
      flowEngine
    );
    registerNodeFactory(
      'neural-node',
      getNeuralNode(createRunCounterContext),
      undefined,
      flowEngine
    );
    registerNodeFactory(
      'neural-input-node',
      getNeuralInputNode(createRunCounterContext),
      undefined,
      flowEngine
    );
    registerNodeFactory(
      'neural-bias-node',
      getNeuralBiasNode(createRunCounterContext),
      undefined,
      flowEngine
    );

    registerNodeFactory(
      'neural-output-node',
      getNeuralOutputNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      'neural-train-test-node',
      getNeuralTrainTestNode(createRunCounterContext),
      undefined,
      flowEngine
    );

    registerNodeFactory(
      neuralNodeTrainHiddenLayerName,
      getNeuralNodeTrainHiddenLayerNode,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      neuralNodeTrainOutputLayerName,
      getNeuralNodeTrainOutputLayerNode,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      neuralNodeOutputLayerName,
      getNeuralNodeOutputLayerNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(neuralNodeInputLayerName, getNeuralNodeInputLayerNode);
    registerNodeFactory(
      neuralNodeHiddenLayerName,
      getNeuralNodeHiddenLayerNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      neuralMnistTrainingDataName,
      getNeuralMnistTrainingDataNode,
      undefined,
      flowEngine
    );
    registerNodeFactory(
      neuralManualDrawableCanvasInputNodeName,
      getNeuralManualDrawableCanvasNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      neuralTestTrainingDataName,
      getNeuralTestTrainingNode,
      undefined,
      flowEngine
    );

    registerNodeFactory('image', getImage, undefined, flowEngine);
    registerNodeFactory(
      'convolution-node',
      getConvolutionNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(
      registerExpressionFunctionNodeName,
      getRegisterExpressionFunctionNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(jsonNodeName, getRawJsonNode, undefined, flowEngine);

    registerNodeFactory(textNodeName, getRawTextNode, undefined, flowEngine);

    registerNodeFactory(
      vectorDistanceNodeName,
      getVectorDistanceNode,
      undefined,
      flowEngine
    );

    registerNodeFactory(createGuidNodeName, createGuid, undefined, flowEngine);
  }

  registerExternalNodes?.(
    registerNodeFactory,
    createRunCounterContext,
    flowEngine
  );
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
      getNodeTaskFactory,
      composition
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
    getNodeTaskFactory,
    composition
  );
  registerNodeFactory(`composition-${composition.id}`, node);
};
