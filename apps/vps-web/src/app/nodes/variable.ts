import {
  CanvasAppInstance,
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { getScopedVariable } from './scoped-variable';

export const getVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  return getScopedVariable(true)(updated);
};
