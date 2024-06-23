import { NodeTaskFactory, NodeTask } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { getScopedVariable } from './scoped-variable';

export const getVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  return getScopedVariable(true)(updated);
};
