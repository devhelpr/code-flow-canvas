import {
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import { getBaseIterator, SubOutputActionType } from './base-iterator';
import { NodeTask, NodeTaskFactory } from '../node-type-registry';
import { NodeInfo } from '../types/node-info';

export type AnimatePathFunction = <T>(
  node: IRectNodeComponent<T>,
  color: string,
  onNextNode?: (
    nodeId: string,
    node: IRectNodeComponent<T>,
    input: string | any[]
  ) =>
    | { result: boolean; output: string | any[]; followPathByName?: string }
    | Promise<{
        result: boolean;
        output: string | any[];
        followPathByName?: string;
      }>,
  onStopped?: (input: string | any[]) => void,
  input?: string | any[],
  followPathByName?: string,
  animatedNodes?: undefined,
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean
) => void;

export type AnimatePathFromThumbFunction = <T>(
  node: IThumbNodeComponent<T>,
  color: string,
  onNextNode?: (
    nodeId: string,
    node: INodeComponent<T>,
    input: string | any[]
  ) =>
    | { result: boolean; output: string | any[]; followPathByName?: string }
    | Promise<{
        result: boolean;
        output: string | any[];
        followPathByName?: string;
      }>,
  onStopped?: (input: string | any[]) => void,
  input?: string | any[],
  followPathByName?: string,
  animatedNodes?: undefined,
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean
) => void;

export const getMap =
  (
    animatePath: AnimatePathFunction,
    animatePathFromThumb: AnimatePathFromThumbFunction
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
    animatePath: AnimatePathFunction,
    animatePathFromThumb: AnimatePathFromThumbFunction
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
