import { INodeComponent } from '../interfaces/element';
import { createSignal } from './signal';

const [getSelectedNodeSignal, setSelectNodeSignal] = createSignal<
  INodeComponent | undefined
>(undefined);
export const getSelectedNode = getSelectedNodeSignal;
export const setSelectNode = setSelectNodeSignal;
