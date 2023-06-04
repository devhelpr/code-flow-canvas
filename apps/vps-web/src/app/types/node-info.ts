import { createCanvasApp } from '@devhelpr/visual-programming-system';

export type NodeInfo = any;

export type canvasAppReturnType = ReturnType<typeof createCanvasApp<NodeInfo>>;
