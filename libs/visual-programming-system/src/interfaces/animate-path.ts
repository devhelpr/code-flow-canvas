import { FlowCanvas } from '../canvas-app/flow-canvas';
import {
  IConnectionNodeComponent,
  IDOMElement,
  IRectNodeComponent,
  IThumbNodeComponent,
} from './element';
import { OnNextNodeFunction } from './next-node-function';
import { IRunCounter } from './run-counter';

export interface AnimatePathFunctions<T> {
  animatePathFunction: AnimatePathFunction<T>;
  animatePathFromThumbFunction: AnimatePathFromThumbFunction<T>;
  animatePathFromConnectionPairFunction: AnimatePathFromConnectionPairFunction<T>;
}

export type AnimatePathFromConnectionPairFunction<T> = (
  canvasApp: FlowCanvas<T>,
  nodeConnectionPairs:
    | false
    | {
        start: IRectNodeComponent<T>;
        end: IRectNodeComponent<T>;
        connection: IConnectionNodeComponent<T>;
      }[],
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  _followPathByName?: string,
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
    cursorOnly?: boolean;
  },
  offsetX?: number,
  offsetY?: number,
  _followPathToEndThumb?: boolean,
  singleStep?: boolean,
  scopeId?: string,
  runCounter?: IRunCounter
) => void;

export type AnimatePathFunction<T> = (
  node: IRectNodeComponent<T>,
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
    cursorOnly?: boolean;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  followThumb?: string,
  scopeId?: string,
  runCounter?: IRunCounter
) => void;

export type AnimatePathFromThumbFunction<T> = (
  node: IThumbNodeComponent<T>,
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
    cursorOnly?: boolean;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  scopeId?: string,
  runCounter?: IRunCounter
) => void;

export type FollowPathFunction<T> = (
  canvasApp: FlowCanvas<T>,
  node: IRectNodeComponent<T>,
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  followThumb?: string,
  scopeId?: string,
  runCounter?: IRunCounter
) => void;

export type NodeAnimationNextNode = <T>(
  nodeId: string,
  node: IRectNodeComponent<T>,
  input: string | any[],
  connection: IConnectionNodeComponent<T>,
  scopeId?: string,
  runCounter?: IRunCounter
) =>
  | {
      result: boolean;
      output: string | any[];
      followPathByName?: string;
      followPath?: string;
    }
  | Promise<{
      result: boolean;
      output: string | any[];
      followPathByName?: string;
      followPath?: string;
    }>;

export interface NodeAnimatonInfo<T> {
  start: IRectNodeComponent<T>;
  connection: IConnectionNodeComponent<T>;
  end: IRectNodeComponent<T>;
  animationLoop: number;
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  };
  onNextNode?: NodeAnimationNextNode;
  onStopped?: (input: string | any[], scopeId?: string) => void;
  scopeId?: string;
  input?: string | any[];
  singleStep?: boolean;

  domCircle: HTMLElement;
  domMessage?: HTMLElement;
  offsetX?: number;
  offsetY?: number;

  testCircle: IDOMElement;
  message?: IDOMElement;
  messageText?: IDOMElement;

  color: string;
  runCounter?: IRunCounter;
}
