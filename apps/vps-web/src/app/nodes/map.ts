import {
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import { getBaseIterator, SubOutputActionType } from './base-iterator';
import { NodeTask, NodeTaskFactory } from '../node-task-registry';
import { NodeInfo } from '../types/node-info';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';

export const getMap =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_updated: () => void): NodeTask<NodeInfo> => {
    return getBaseIterator(
      'map',
      'Map',
      (input) => SubOutputActionType.pushToResult,
      animatePath,
      animatePathFromThumb
    );
  };

export const getFilter =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_updated: () => void): NodeTask<NodeInfo> => {
    return getBaseIterator(
      'filter',
      'Filter',
      (input) =>
        Boolean(input) === true
          ? SubOutputActionType.keepInput
          : SubOutputActionType.filterFromResult,
      animatePath,
      animatePathFromThumb,
      true
    );
  };
