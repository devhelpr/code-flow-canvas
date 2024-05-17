import { IRectNodeComponent } from '../interfaces';
import { createSignal } from './signal';

export interface ActionNodeInfo {
  id: string;
  containerNode?: IRectNodeComponent<unknown>;
}
const [getActionNodeSignal, setActionNodeSignal] = createSignal<
  ActionNodeInfo | undefined
>(undefined);
export const getActionNode = getActionNodeSignal;
export const setActionNode = setActionNodeSignal;
