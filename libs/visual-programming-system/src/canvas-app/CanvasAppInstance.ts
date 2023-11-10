import { createCanvasApp } from '.';

export type CanvasAppInstance<T> = ReturnType<typeof createCanvasApp<T>>;
