import { createSignal } from './signal';

const [getCountSignal, setCountSignal] = createSignal<number>(0);
export const getCount = getCountSignal;
export const setCount = setCountSignal;
