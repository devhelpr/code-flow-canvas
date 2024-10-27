import {
  BaseNodeInfo,
  IConnectionNodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';

export interface Transition<T extends BaseNodeInfo> {
  name: string;
  from: string;
  to: string;
  nodeComponent: IRectNodeComponent<T>;
  connectionIn?: IConnectionNodeComponent<T>;
  connectionOut?: IConnectionNodeComponent<T>;
}
export interface State<T extends BaseNodeInfo> {
  id: string;
  name: string;
  transitions: Transition<T>[];
  isFinal: boolean;
  nodeComponent: IRectNodeComponent<T>;
  stateMachine?: StateMachine<T>;
}

export interface StateMachine<T extends BaseNodeInfo> {
  states: State<T>[];
  initialState: State<T> | undefined;
  currentState?: State<T>;
}

export interface StateTransition<T extends BaseNodeInfo> {
  transition: Transition<T>;
  nextState: State<T>;
}
