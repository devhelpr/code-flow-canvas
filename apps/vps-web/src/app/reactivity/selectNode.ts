import { createSignal } from './signal';

const [getSelectedNodeSignal, setSelectNodeSignal] = createSignal<string>('');
export const getSelectedNode = getSelectedNodeSignal;
export const setSelectNode = setSelectNodeSignal;
