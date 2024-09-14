import { createFlowCanvas } from '.';

export type FlowCanvasInstance<T> = ReturnType<typeof createFlowCanvas<T>>;
