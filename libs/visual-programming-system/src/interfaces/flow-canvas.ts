export interface FlowCanvasOptions {
  hasNodeTypeSideBar?: boolean;
  nodeTypeSideBarSelector?: string;
  cameraModifiers?: {
    xOffset: number;
    yOffset: number;
    widthSubtract?: number;
    heightSubtract?: number;
  };
}
