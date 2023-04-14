import { createSignal } from './signal';

const [getSelectedNodeSignal, setSelectNodeSignal] = createSignal<
  string | undefined
>(undefined);
export const getSelectedNode = getSelectedNodeSignal;
export const setSelectNode = setSelectNodeSignal;
