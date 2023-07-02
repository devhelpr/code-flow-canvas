export interface NodeShape {
  reference: unknown;
}

export abstract class CoreRenderingEngine {
  canvas: unknown;
  abstract createRectNode(
    x: number,
    y: number,
    width: number,
    height: number
  ): NodeShape;
  abstract createConnectionNode(): NodeShape;
  abstract createThumbNode(): NodeShape;
}
