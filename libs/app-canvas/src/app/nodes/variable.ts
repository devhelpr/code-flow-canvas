import { NodeInfo } from '../types/node-info';
import { NodeTask, NodeTaskFactory } from '../node-task-registry';
import { getScopedVariable } from './scoped-variable';

export const getVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  return getScopedVariable(true)(updated);
};
