import { IRectNodeComponent } from '../interfaces';
import { BaseNodeInfo } from '../types/base-node-info';
import { createSignal } from './signal';

export interface SelectedNodeInfo {
  id: string;
  containerNode?: IRectNodeComponent<BaseNodeInfo>;
}
const [getSelectedNodeSignal, setSelectNodeSignal] = createSignal<
  SelectedNodeInfo | undefined
>(undefined);
export const getSelectedNode = getSelectedNodeSignal;
export const setSelectNode = setSelectNodeSignal;
