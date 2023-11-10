import { IRectNodeComponent } from '../interfaces';
import { createSignal } from './signal';

export interface SelectedNodeInfo {
  id: string;
  containerNode?: IRectNodeComponent<unknown>;
}
const [getSelectedNodeSignal, setSelectNodeSignal] = createSignal<
  SelectedNodeInfo | undefined
>(undefined);
export const getSelectedNode = getSelectedNodeSignal;
export const setSelectNode = setSelectNodeSignal;
