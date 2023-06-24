import {
  INodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import { getBaseIterator, SubOutputActionType } from './base-iterator';

export type AnimatePathFunction = <T>(
  node: INodeComponent<T>,
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

export const getMap = <T>(
  animatePath: AnimatePathFunction,
  animatePathFromThumb: AnimatePathFromThumbFunction
) => {
  return getBaseIterator(
    'map',
    'Map',
    (input) => SubOutputActionType.pushToResult,
    animatePath,
    animatePathFromThumb
  );
};

export const getFilter = <T>(
  animatePath: AnimatePathFunction,
  animatePathFromThumb: AnimatePathFromThumbFunction
) => {
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
