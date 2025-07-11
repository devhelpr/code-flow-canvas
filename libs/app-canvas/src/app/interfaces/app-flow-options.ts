export interface APPFlowOptions {
  hasNodeTypeSideBar?: boolean;
  nodeTypeSideBarSelector?: string;
  cameraModifiers?: CameraModifiers;
}

export interface CameraModifiers {
  xOffset: number;
  yOffset: number;
  widthSubtract?: number;
  heightSubtract?: number;
}
