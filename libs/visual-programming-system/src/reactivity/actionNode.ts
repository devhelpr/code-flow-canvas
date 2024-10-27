import { IRectNodeComponent } from '../interfaces';
import { BaseNodeInfo } from '../types/base-node-info';
import { createSignal } from './signal';

export interface ActionNodeInfo {
  id: string;
  containerNode?: IRectNodeComponent<BaseNodeInfo>;
}
const [getActionNodeSignal, setActionNodeSignal] = createSignal<
  ActionNodeInfo | undefined
>(undefined);
export const getActionNode = getActionNodeSignal;
export const setActionNode = setActionNodeSignal;
